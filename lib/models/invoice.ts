import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import {
  isInvoiceStatus,
  isInvoiceCurrency,
  type InvoiceCurrencyCode,
  type InvoiceDisplayStatus,
  type InvoiceLineItem,
  type InvoiceListItem,
  type InvoiceStatus,
  type InvoiceSummary,
} from "@/lib/clients/invoice-types";

export type InvoiceDoc = {
  _id: ObjectId;
  clientId: ObjectId;
  number: string;
  issueDate: Date;
  dueDate: Date;
  currency: InvoiceCurrencyCode;
  items: InvoiceLineItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  /** Cumulative payments recorded against this invoice. */
  paidAmount?: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceInput = {
  clientId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: InvoiceCurrencyCode;
  items: InvoiceLineItem[];
  taxPercent: number;
  notes?: string;
  status: InvoiceStatus;
};

let indexEnsured = false;

async function invoicesCollection(): Promise<Collection<InvoiceDoc>> {
  const db = await getDb();
  const col = db.collection<InvoiceDoc>("invoices");
  if (!indexEnsured) {
    await col.createIndex({ clientId: 1, createdAt: -1 });
    await col.createIndex({ number: 1 }, { unique: true });
    await col.createIndex({ status: 1, dueDate: 1 });
    indexEnsured = true;
  }
  return col;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeTotals(items: InvoiceLineItem[], taxPercent: number) {
  let subtotal = 0;
  const normalized: InvoiceLineItem[] = [];
  for (const it of items) {
    const qty = Number.isFinite(it.quantity) ? Math.max(0, it.quantity) : 0;
    const rate = Number.isFinite(it.rate) ? it.rate : 0;
    const amount = round2(qty * rate);
    subtotal += amount;
    normalized.push({
      description: it.description.trim(),
      quantity: qty,
      rate: round2(rate),
      amount,
    });
  }
  subtotal = round2(subtotal);
  const tax = round2(subtotal * (Math.max(0, taxPercent) / 100));
  const total = round2(subtotal + tax);
  return { items: normalized, subtotal, taxAmount: tax, total };
}

function computeDisplayStatus(
  status: InvoiceStatus,
  dueDate: Date,
  total: number,
  paidAmount: number
): InvoiceDisplayStatus {
  if (status !== "sent") return status;
  if (paidAmount > 0 && paidAmount < total) return "partial";
  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
    return status;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime() ? "overdue" : status;
}

function toIso(d: Date | undefined): string {
  if (!d) return "";
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : "";
}

function toListItem(d: WithId<InvoiceDoc>): InvoiceListItem {
  const status = isInvoiceStatus(d.status) ? d.status : "draft";
  const currency = isInvoiceCurrency(d.currency) ? d.currency : "USD";
  const total = d.total;
  const rawPaid = typeof d.paidAmount === "number" ? d.paidAmount : 0;
  const paidAmount = round2(Math.max(0, Math.min(rawPaid, total)));
  const outstanding = round2(Math.max(0, total - paidAmount));
  return {
    id: d._id.toString(),
    clientId: d.clientId.toString(),
    number: d.number,
    issueDate: toIso(d.issueDate),
    dueDate: toIso(d.dueDate),
    currency,
    items: (d.items ?? []).map((it) => ({
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.amount,
    })),
    subtotal: d.subtotal,
    taxPercent: d.taxPercent,
    taxAmount: d.taxAmount,
    total,
    paidAmount,
    outstanding,
    status,
    displayStatus: computeDisplayStatus(status, d.dueDate, total, paidAmount),
    notes: d.notes ?? "",
    createdBy: d.createdBy,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

export async function listInvoicesForClient(
  clientId: string
): Promise<InvoiceListItem[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const col = await invoicesCollection();
  const docs = await col
    .find({ clientId: new ObjectId(clientId) })
    .sort({ issueDate: -1, createdAt: -1 })
    .toArray();
  return docs.map(toListItem);
}

export async function findInvoiceById(
  id: string
): Promise<InvoiceListItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await invoicesCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? toListItem(doc) : null;
}

/**
 * Generate the next invoice number in the format INV-{YYYY}-{NNNN}.
 * Sequence resets per calendar year (based on issue date year, not creation
 * year, so back-dated invoices sit in the right bucket).
 */
export async function nextInvoiceNumber(year: number): Promise<string> {
  const col = await invoicesCollection();
  const prefix = `INV-${year}-`;
  const last = await col
    .find({ number: { $regex: `^${prefix}` } })
    .sort({ number: -1 })
    .limit(1)
    .toArray();
  let seq = 1;
  if (last[0]) {
    const tail = last[0].number.slice(prefix.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function createInvoice(
  input: InvoiceInput
): Promise<{ id: string; number: string }> {
  if (!ObjectId.isValid(input.clientId)) {
    throw new Error("Invalid client id.");
  }
  const col = await invoicesCollection();
  const now = new Date();
  const issueDate = new Date(input.issueDate);
  const dueDate = new Date(input.dueDate);
  const { items, subtotal, taxAmount, total } = computeTotals(
    input.items,
    input.taxPercent
  );

  const result = await col.insertOne({
    _id: new ObjectId(),
    clientId: new ObjectId(input.clientId),
    number: input.number.trim(),
    issueDate,
    dueDate,
    currency: input.currency,
    items,
    subtotal,
    taxPercent: input.taxPercent,
    taxAmount,
    total,
    paidAmount: 0,
    status: input.status,
    notes: input.notes?.trim() || undefined,
    createdBy: "",
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString(), number: input.number.trim() };
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await invoicesCollection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return false;

  const issueDate = new Date(input.issueDate);
  const dueDate = new Date(input.dueDate);
  const { items, subtotal, taxAmount, total } = computeTotals(
    input.items,
    input.taxPercent
  );

  // If the new total is lower than the recorded paid amount (e.g. line items
  // removed after a payment was recorded), clamp paidAmount to the new total.
  const prevPaid =
    typeof existing.paidAmount === "number" ? existing.paidAmount : 0;
  const clampedPaid = round2(Math.max(0, Math.min(prevPaid, total)));

  const res = await col.updateOne(
    { _id: existing._id },
    {
      $set: {
        number: input.number.trim(),
        issueDate,
        dueDate,
        currency: input.currency,
        items,
        subtotal,
        taxPercent: input.taxPercent,
        taxAmount,
        total,
        paidAmount: clampedPaid,
        status: input.status,
        notes: input.notes?.trim() || undefined,
        updatedAt: new Date(),
      },
    }
  );
  return res.matchedCount === 1;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await invoicesCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

export async function setInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await invoicesCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );
  return res.matchedCount === 1;
}

/**
 * Set status and paidAmount in one write. Used by transitions that need to
 * keep both in sync (e.g. marking an invoice paid implies fully paid; reopening
 * to draft or cancelled clears any recorded payment).
 */
export async function setInvoiceStatusAndPayment(
  id: string,
  status: InvoiceStatus,
  paidAmount: number
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await invoicesCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        paidAmount: round2(Math.max(0, paidAmount)),
        updatedAt: new Date(),
      },
    }
  );
  return res.matchedCount === 1;
}

/**
 * Add an additional payment to an invoice. Clamps the cumulative paidAmount
 * to the invoice total, and auto-flips the status to "paid" when fully
 * covered. Returns the updated paidAmount and resulting status; null if the
 * invoice doesn't exist or the increment is invalid.
 */
export async function recordInvoicePayment(
  id: string,
  amount: number
): Promise<{ paidAmount: number; status: InvoiceStatus } | null> {
  if (!ObjectId.isValid(id)) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const col = await invoicesCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  const prevPaid = typeof doc.paidAmount === "number" ? doc.paidAmount : 0;
  const nextPaid = round2(Math.max(0, Math.min(prevPaid + amount, doc.total)));
  // Only auto-flip from sent → paid. Don't touch draft/cancelled — those need
  // a deliberate status change before payments make sense.
  const nextStatus: InvoiceStatus =
    doc.status === "sent" && nextPaid >= doc.total ? "paid" : doc.status;

  const res = await col.updateOne(
    { _id: doc._id },
    {
      $set: {
        paidAmount: nextPaid,
        status: nextStatus,
        updatedAt: new Date(),
      },
    }
  );
  if (res.matchedCount !== 1) return null;
  return { paidAmount: nextPaid, status: nextStatus };
}

export async function setInvoiceCreatedBy(
  id: string,
  userId: string
): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const col = await invoicesCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { createdBy: userId } }
  );
}

export function summarize(invoices: InvoiceListItem[]): InvoiceSummary {
  let total = 0;
  let paid = 0;
  let outstanding = 0;
  let overdue = 0;
  let draftCount = 0;
  let sentCount = 0;
  let partialCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let cancelledCount = 0;
  let currency: InvoiceCurrencyCode | null = null;
  let currencyConflict = false;

  for (const inv of invoices) {
    if (currency === null) currency = inv.currency;
    else if (currency !== inv.currency) currencyConflict = true;

    if (inv.status === "cancelled") {
      cancelledCount += 1;
      continue;
    }

    total += inv.total;
    paid += inv.paidAmount;

    if (inv.status === "paid") {
      paidCount += 1;
    } else if (inv.status === "draft") {
      draftCount += 1;
    } else if (inv.status === "sent") {
      outstanding += inv.outstanding;
      if (inv.displayStatus === "overdue") {
        overdue += inv.outstanding;
        overdueCount += 1;
      } else if (inv.displayStatus === "partial") {
        partialCount += 1;
      } else {
        sentCount += 1;
      }
    }
  }

  return {
    total: round2(total),
    paid: round2(paid),
    outstanding: round2(outstanding),
    overdue: round2(overdue),
    draftCount,
    sentCount,
    partialCount,
    paidCount,
    overdueCount,
    cancelledCount,
    currency: currencyConflict ? null : currency,
  };
}

export type CurrencySummary = InvoiceSummary & {
  currency: InvoiceCurrencyCode;
  invoiceCount: number;
};

/**
 * Bucket invoices by currency, then summarize each bucket. The result is sorted
 * by total billed descending so the heaviest currency renders first.
 */
export function summarizeByCurrency(
  invoices: InvoiceListItem[]
): CurrencySummary[] {
  const buckets = new Map<InvoiceCurrencyCode, InvoiceListItem[]>();
  for (const inv of invoices) {
    const list = buckets.get(inv.currency);
    if (list) list.push(inv);
    else buckets.set(inv.currency, [inv]);
  }

  const out: CurrencySummary[] = [];
  for (const [code, list] of buckets) {
    const base = summarize(list);
    out.push({ ...base, currency: code, invoiceCount: list.length });
  }
  out.sort((a, b) => b.total - a.total);
  return out;
}
