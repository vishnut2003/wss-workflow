import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireCan } from "@/lib/permissions/check";
import { findClientListItemById } from "@/lib/models/client";
import { findInvoiceById } from "@/lib/models/invoice";

import { InvoiceForm } from "../../_components/invoice-form";
import type { InvoiceFormValues } from "../../_components/invoice-form-defaults";

function isoDateOnly(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ clientId: string; invoiceId: string }>;
}) {
  await requireCan("clients.invoices.manage");
  const { clientId, invoiceId } = await params;
  const [invoice, client] = await Promise.all([
    findInvoiceById(invoiceId),
    findClientListItemById(clientId),
  ]);
  if (!invoice || !client || invoice.clientId !== clientId) notFound();

  const initial: InvoiceFormValues = {
    number: invoice.number,
    issueDate: isoDateOnly(invoice.issueDate),
    dueDate: isoDateOnly(invoice.dueDate),
    currency: invoice.currency,
    status: invoice.status,
    taxPercent: invoice.taxPercent,
    notes: invoice.notes,
    items: invoice.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.amount,
    })),
  };

  const clientLabel = client.company || client.name || "this client";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link
          href={`/dashboard/clients/${clientId}/invoices/${invoiceId}`}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to invoice
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit invoice {invoice.number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update the details for {clientLabel}.
        </p>
      </div>

      <InvoiceForm
        initial={initial}
        mode={{ kind: "edit", clientId, invoiceId }}
        clientLabel={clientLabel}
      />
    </div>
  );
}
