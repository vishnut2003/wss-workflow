import type { InvoiceListItem } from "@/lib/clients/invoice-types";

export const STATUS_FILTERS = [
  "all",
  "draft",
  "sent",
  "partial",
  "overdue",
  "paid",
  "cancelled",
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function isStatusFilter(value: unknown): value is StatusFilter {
  return (
    typeof value === "string" &&
    (STATUS_FILTERS as readonly string[]).includes(value)
  );
}

export type InvoiceFilters = {
  status: StatusFilter;
  currency: string; // "all" | currency code
  q: string;
};

export function parseFilters(
  raw: Record<string, string | string[] | undefined>
): InvoiceFilters {
  const statusRaw = typeof raw.status === "string" ? raw.status : "";
  const currencyRaw = typeof raw.currency === "string" ? raw.currency : "";
  const qRaw = typeof raw.q === "string" ? raw.q : "";
  return {
    status: isStatusFilter(statusRaw) ? statusRaw : "all",
    currency: currencyRaw || "all",
    q: qRaw.trim(),
  };
}

function matchesStatus(inv: InvoiceListItem, status: StatusFilter): boolean {
  if (status === "all") return true;
  if (status === "draft") return inv.status === "draft";
  if (status === "paid") return inv.status === "paid";
  if (status === "cancelled") return inv.status === "cancelled";
  // Display-derived buckets:
  if (status === "sent") return inv.displayStatus === "sent";
  if (status === "partial") return inv.displayStatus === "partial";
  if (status === "overdue") return inv.displayStatus === "overdue";
  return true;
}

export function applyFilters(
  invoices: InvoiceListItem[],
  filters: InvoiceFilters
): InvoiceListItem[] {
  const needle = filters.q.toLowerCase();
  return invoices.filter((inv) => {
    if (filters.currency !== "all" && inv.currency !== filters.currency) {
      return false;
    }
    if (!matchesStatus(inv, filters.status)) return false;
    if (needle && !inv.number.toLowerCase().includes(needle)) return false;
    return true;
  });
}

export type StatusCounts = Record<StatusFilter, number>;

export function countByStatus(invoices: InvoiceListItem[]): StatusCounts {
  const counts: StatusCounts = {
    all: invoices.length,
    draft: 0,
    sent: 0,
    partial: 0,
    overdue: 0,
    paid: 0,
    cancelled: 0,
  };
  for (const inv of invoices) {
    if (inv.status === "draft") counts.draft += 1;
    else if (inv.status === "paid") counts.paid += 1;
    else if (inv.status === "cancelled") counts.cancelled += 1;
    else if (inv.displayStatus === "partial") counts.partial += 1;
    else if (inv.displayStatus === "overdue") counts.overdue += 1;
    else if (inv.displayStatus === "sent") counts.sent += 1;
  }
  return counts;
}
