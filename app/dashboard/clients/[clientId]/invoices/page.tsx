import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterX, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { can, requireCan } from "@/lib/permissions/check";
import { findClientListItemForUser } from "@/lib/models/client";
import {
  listInvoicesForClient,
  summarizeByCurrency,
} from "@/lib/models/invoice";

import { InvoicesList } from "./_components/invoices-list";
import { InvoiceFiltersBar } from "./_components/invoice-filters-bar";
import { InvoiceSummaries } from "./_components/invoice-summaries";
import {
  applyFilters,
  countByStatus,
  parseFilters,
} from "./_lib/filters";

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireCan("clients.invoices.view");
  const { clientId } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const client = await findClientListItemForUser(
    clientId,
    session.user.id,
    session.user.role
  );
  if (!client) notFound();

  const [allInvoices, canManage] = await Promise.all([
    listInvoicesForClient(clientId),
    can(session.user.role, "clients.invoices.manage"),
  ]);
  const counts = countByStatus(allInvoices);
  const availableCurrencies = Array.from(
    new Set(allInvoices.map((i) => i.currency))
  ).sort();

  const visibleInvoices = applyFilters(allInvoices, filters);
  const summaries = summarizeByCurrency(visibleInvoices);
  const clientLabel = client.company || client.name || "this client";
  const filtersActive =
    filters.status !== "all" ||
    filters.currency !== "all" ||
    filters.q.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            Billing for {clientLabel}.{" "}
            {filtersActive
              ? `${visibleInvoices.length} of ${allInvoices.length} shown.`
              : `${allInvoices.length} ${allInvoices.length === 1 ? "invoice" : "invoices"} on file.`}
          </p>
        </div>
        {canManage ? (
          <Button
            size="sm"
            nativeButton={false}
            className="gap-1.5 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
            render={<Link href={`/dashboard/clients/${clientId}/invoices/new`} />}
          >
            <Plus className="size-3.5" />
            New invoice
          </Button>
        ) : null}
      </div>

      {allInvoices.length > 0 ? (
        <InvoiceFiltersBar
          filters={filters}
          counts={counts}
          availableCurrencies={availableCurrencies}
        />
      ) : null}

      <InvoiceSummaries summaries={summaries} />

      {allInvoices.length > 0 && visibleInvoices.length === 0 ? (
        <NoMatches clientId={clientId} />
      ) : (
        <InvoicesList
          invoices={visibleInvoices}
          clientId={clientId}
          canManage={canManage}
        />
      )}
    </div>
  );
}

function NoMatches({ clientId }: { clientId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 px-5 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FilterX className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">No invoices match your filters</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Try clearing the filters above, or jump to all invoices for this
          client.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        nativeButton={false}
        className="mt-1"
        render={<Link href={`/dashboard/clients/${clientId}/invoices`} />}
      >
        Clear filters
      </Button>
    </div>
  );
}
