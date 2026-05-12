import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireCan } from "@/lib/permissions/check";
import { findClientListItemById } from "@/lib/models/client";
import { nextInvoiceNumber } from "@/lib/models/invoice";

import { InvoiceForm } from "../_components/invoice-form";
import { emptyInvoiceValues } from "../_components/invoice-form-defaults";

export default async function NewInvoicePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireCan("clients.invoices.manage");
  const { clientId } = await params;
  const client = await findClientListItemById(clientId);
  if (!client) notFound();

  const year = new Date().getFullYear();
  const suggestedNumber = await nextInvoiceNumber(year);
  const clientLabel = client.company || client.name || "this client";
  const initial = emptyInvoiceValues(suggestedNumber);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link
          href={`/dashboard/clients/${clientId}/invoices`}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All invoices
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          New invoice
        </h1>
        <p className="text-sm text-muted-foreground">
          Bill {clientLabel}. Totals are calculated as you type.
        </p>
      </div>

      <InvoiceForm
        initial={initial}
        mode={{ kind: "create", clientId }}
        clientLabel={clientLabel}
      />
    </div>
  );
}
