"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions/check";
import { canUserAccessClient, findClientById } from "@/lib/models/client";
import {
  computeTotals,
  createInvoice,
  deleteInvoice,
  findInvoiceById,
  nextInvoiceNumber,
  recordInvoicePayment,
  setInvoiceCreatedBy,
  setInvoiceStatus,
  setInvoiceStatusAndPayment,
  updateInvoice,
} from "@/lib/models/invoice";
import {
  isInvoiceCurrency,
  isInvoiceStatus,
  type InvoiceCurrencyCode,
  type InvoiceLineItem,
  type InvoiceStatus,
} from "@/lib/clients/invoice-types";

export type InvoiceFormState = {
  error?: string;
  ok?: boolean;
};

const DESC_MAX = 500;
const NOTES_MAX = 5000;
const MAX_ITEMS = 50;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readManyText(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((v) => String(v));
}

function parseLineItems(formData: FormData): InvoiceLineItem[] | { error: string } {
  const descriptions = readManyText(formData, "itemDescription");
  const quantities = readManyText(formData, "itemQuantity");
  const rates = readManyText(formData, "itemRate");
  const count = Math.max(descriptions.length, quantities.length, rates.length);

  if (count === 0) return { error: "Add at least one line item." };
  if (count > MAX_ITEMS) {
    return { error: `Too many line items (max ${MAX_ITEMS}).` };
  }

  const items: InvoiceLineItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const description = (descriptions[i] ?? "").trim();
    const qtyRaw = (quantities[i] ?? "").trim();
    const rateRaw = (rates[i] ?? "").trim();

    // Skip fully blank rows.
    if (!description && !qtyRaw && !rateRaw) continue;

    if (!description) {
      return { error: `Line ${i + 1}: description is required.` };
    }
    if (description.length > DESC_MAX) {
      return {
        error: `Line ${i + 1}: description is too long (max ${DESC_MAX} characters).`,
      };
    }
    const quantity = Number(qtyRaw);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return { error: `Line ${i + 1}: quantity must be a non-negative number.` };
    }
    const rate = Number(rateRaw);
    if (!Number.isFinite(rate)) {
      return { error: `Line ${i + 1}: rate must be a number.` };
    }
    items.push({
      description,
      quantity,
      rate,
      amount: 0, // recomputed by computeTotals
    });
  }

  if (items.length === 0) return { error: "Add at least one line item." };
  return items;
}

type ParsedPayload = {
  issueDate: string;
  dueDate: string;
  currency: InvoiceCurrencyCode;
  status: InvoiceStatus;
  taxPercent: number;
  notes: string;
  items: InvoiceLineItem[];
};

function parsePayload(
  formData: FormData
): { ok: true; data: ParsedPayload } | { ok: false; error: string } {
  const issueDate = readField(formData, "issueDate");
  const dueDate = readField(formData, "dueDate");
  const currencyRaw = readField(formData, "currency");
  const statusRaw = readField(formData, "status");
  const taxPercentRaw = readField(formData, "taxPercent");
  const notes = readField(formData, "notes");

  if (!issueDate) return { ok: false, error: "Issue date is required." };
  if (Number.isNaN(new Date(issueDate).getTime())) {
    return { ok: false, error: "Invalid issue date." };
  }
  if (!dueDate) return { ok: false, error: "Due date is required." };
  if (Number.isNaN(new Date(dueDate).getTime())) {
    return { ok: false, error: "Invalid due date." };
  }
  if (!isInvoiceCurrency(currencyRaw)) {
    return { ok: false, error: "Unsupported currency." };
  }
  if (!isInvoiceStatus(statusRaw)) {
    return { ok: false, error: "Invalid status." };
  }
  const taxPercent = Number(taxPercentRaw || "0");
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    return { ok: false, error: "Tax % must be between 0 and 100." };
  }
  if (notes.length > NOTES_MAX) {
    return { ok: false, error: `Notes too long (max ${NOTES_MAX}).` };
  }

  const items = parseLineItems(formData);
  if ("error" in items) return { ok: false, error: items.error };

  return {
    ok: true,
    data: {
      issueDate,
      dueDate,
      currency: currencyRaw,
      status: statusRaw,
      taxPercent,
      notes,
      items,
    },
  };
}

export async function createInvoiceAction(
  _prev: InvoiceFormState | undefined,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };
  if (!(await can(session.user.role, "clients.invoices.manage"))) {
    return { error: "You do not have permission to create invoices." };
  }

  const clientId = readField(formData, "clientId");
  if (!clientId) return { error: "Missing client id." };
  const client = await findClientById(clientId);
  if (!client) return { error: "Client not found." };
  if (
    !(await canUserAccessClient(clientId, session.user.id, session.user.role))
  ) {
    return { error: "You can only create invoices for assigned clients." };
  }

  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };

  // Ensure totals are sane before persisting.
  computeTotals(parsed.data.items, parsed.data.taxPercent);

  // Generate the invoice number server-side using the issue date's year, and
  // retry a few times if a concurrent insert wins the unique-index race.
  const issueYear = new Date(parsed.data.issueDate).getFullYear();
  let result: { id: string } | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5 && !result; attempt += 1) {
    const number = await nextInvoiceNumber(issueYear);
    try {
      result = await createInvoice({
        clientId,
        number,
        ...parsed.data,
      });
    } catch (err) {
      lastError = err;
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        // Duplicate number — another invoice was inserted between our read
        // and write. Loop and try the next sequence.
        continue;
      }
      return { error: "Could not create the invoice. Please try again." };
    }
  }

  if (!result) {
    console.error("Failed to allocate invoice number after retries", lastError);
    return { error: "Could not allocate an invoice number. Please try again." };
  }

  await setInvoiceCreatedBy(result.id, session.user.id);

  revalidatePath(`/dashboard/clients/${clientId}/invoices`);
  revalidatePath(`/dashboard/clients/${clientId}`);
  redirect(`/dashboard/clients/${clientId}/invoices/${result.id}`);
}

export async function updateInvoiceAction(
  _prev: InvoiceFormState | undefined,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };
  if (!(await can(session.user.role, "clients.invoices.manage"))) {
    return { error: "You do not have permission to update invoices." };
  }

  const invoiceId = readField(formData, "invoiceId");
  if (!invoiceId) return { error: "Missing invoice id." };
  const existing = await findInvoiceById(invoiceId);
  if (!existing) return { error: "Invoice not found." };
  if (
    !(await canUserAccessClient(
      existing.clientId,
      session.user.id,
      session.user.role
    ))
  ) {
    return { error: "You can only update invoices on assigned clients." };
  }

  const parsed = parsePayload(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    const ok = await updateInvoice(invoiceId, {
      clientId: existing.clientId,
      // Invoice number is immutable once assigned.
      number: existing.number,
      ...parsed.data,
    });
    if (!ok) return { error: "Invoice could not be updated." };
  } catch {
    return { error: "Could not update the invoice. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices`);
  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices/${invoiceId}`);
  revalidatePath(`/dashboard/clients/${existing.clientId}`);
  redirect(`/dashboard/clients/${existing.clientId}/invoices/${invoiceId}`);
}

export async function setInvoiceStatusAction(
  _prev: InvoiceFormState | undefined,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };
  if (!(await can(session.user.role, "clients.invoices.manage"))) {
    return { error: "You do not have permission to change invoice status." };
  }

  const invoiceId = readField(formData, "invoiceId");
  const statusRaw = readField(formData, "status");
  if (!invoiceId) return { error: "Missing invoice id." };
  if (!isInvoiceStatus(statusRaw)) return { error: "Invalid status." };

  const existing = await findInvoiceById(invoiceId);
  if (!existing) return { error: "Invoice not found." };
  if (
    !(await canUserAccessClient(
      existing.clientId,
      session.user.id,
      session.user.role
    ))
  ) {
    return { error: "You can only change invoices on assigned clients." };
  }

  try {
    let ok: boolean;
    if (statusRaw === "paid") {
      // "Mark as paid" implies fully paid — top up to the total.
      ok = await setInvoiceStatusAndPayment(invoiceId, "paid", existing.total);
    } else if (
      (statusRaw === "draft" || statusRaw === "cancelled") &&
      existing.paidAmount > 0
    ) {
      // Moving back to draft or cancelling clears any recorded payments —
      // those states semantically mean "nothing's been collected on this".
      ok = await setInvoiceStatusAndPayment(invoiceId, statusRaw, 0);
    } else if (statusRaw === "sent" && existing.status === "paid") {
      // Reopening a paid invoice to "sent" wipes the paid amount so the user
      // can record fresh (partial) payments.
      ok = await setInvoiceStatusAndPayment(invoiceId, "sent", 0);
    } else {
      ok = await setInvoiceStatus(invoiceId, statusRaw);
    }
    if (!ok) return { error: "Status could not be updated." };
  } catch {
    return { error: "Could not update status. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices`);
  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices/${invoiceId}`);
  revalidatePath(`/dashboard/clients/${existing.clientId}`);
  return { ok: true };
}

export async function recordInvoicePaymentAction(
  _prev: InvoiceFormState | undefined,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };
  if (!(await can(session.user.role, "clients.invoices.manage"))) {
    return { error: "You do not have permission to record payments." };
  }

  const invoiceId = readField(formData, "invoiceId");
  const amountRaw = readField(formData, "amount");
  if (!invoiceId) return { error: "Missing invoice id." };

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a positive payment amount." };
  }

  const existing = await findInvoiceById(invoiceId);
  if (!existing) return { error: "Invoice not found." };
  if (
    !(await canUserAccessClient(
      existing.clientId,
      session.user.id,
      session.user.role
    ))
  ) {
    return { error: "You can only record payments on assigned clients." };
  }
  if (existing.status === "cancelled") {
    return { error: "Can't record payments on a cancelled invoice." };
  }
  if (existing.status === "draft") {
    return { error: "Mark the invoice as sent before recording payments." };
  }
  if (existing.status === "paid") {
    return { error: "This invoice is already fully paid." };
  }
  if (amount > existing.outstanding + 0.005) {
    return {
      error: `Amount exceeds the outstanding balance of ${existing.outstanding.toFixed(2)}.`,
    };
  }

  try {
    const updated = await recordInvoicePayment(invoiceId, amount);
    if (!updated) return { error: "Payment could not be recorded." };
  } catch {
    return { error: "Could not record the payment. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices`);
  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices/${invoiceId}`);
  revalidatePath(`/dashboard/clients/${existing.clientId}`);
  return { ok: true };
}

export async function deleteInvoiceAction(
  _prev: InvoiceFormState | undefined,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };
  if (!(await can(session.user.role, "clients.invoices.delete"))) {
    return { error: "You do not have permission to delete invoices." };
  }

  const invoiceId = readField(formData, "invoiceId");
  if (!invoiceId) return { error: "Missing invoice id." };
  const existing = await findInvoiceById(invoiceId);
  if (!existing) return { error: "Invoice not found." };
  if (
    !(await canUserAccessClient(
      existing.clientId,
      session.user.id,
      session.user.role
    ))
  ) {
    return { error: "You can only delete invoices on assigned clients." };
  }

  try {
    const ok = await deleteInvoice(invoiceId);
    if (!ok) return { error: "Invoice could not be deleted." };
  } catch {
    return { error: "Could not delete the invoice. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId}/invoices`);
  revalidatePath(`/dashboard/clients/${existing.clientId}`);
  redirect(`/dashboard/clients/${existing.clientId}/invoices`);
}

export async function suggestNextInvoiceNumber(year: number): Promise<string> {
  return nextInvoiceNumber(year);
}
