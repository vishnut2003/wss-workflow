import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  CircleDollarSign,
  Clock,
  FileText,
  Plus,
  Send,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { findCurrency, type InvoiceDisplayStatus, type InvoiceListItem } from "@/lib/clients/invoice-types";

const STATUS_LABEL: Record<InvoiceDisplayStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  partial: "Partial",
  cancelled: "Cancelled",
};

const STATUS_PILL: Record<InvoiceDisplayStatus, string> = {
  draft:
    "bg-slate-500/15 text-slate-700 ring-slate-500/25 dark:text-slate-300",
  sent: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  paid: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  overdue: "bg-rose-500/15 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  partial:
    "bg-violet-500/15 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  cancelled:
    "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
};

const STATUS_ICON: Record<
  InvoiceDisplayStatus,
  React.ComponentType<{ className?: string }>
> = {
  draft: CircleDashed,
  sent: Send,
  paid: CheckCircle2,
  overdue: TriangleAlert,
  partial: CircleDollarSign,
  cancelled: XCircle,
};

function formatMoney(value: number, currencyCode: string): string {
  const meta = findCurrency(currencyCode);
  const symbol = meta?.symbol ?? "";
  return `${symbol}${value.toFixed(2)}`;
}

function formatShortDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function InvoicesList({
  invoices,
  clientId,
  canManage,
}: {
  invoices: InvoiceListItem[];
  clientId: string;
  canManage: boolean;
}) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 px-5 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
          <FileText className="size-6 text-theme-3 dark:text-theme-1" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">No invoices yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Create the first invoice to start tracking what this client owes.
          </p>
        </div>
        {canManage ? (
          <Button
            size="sm"
            nativeButton={false}
            className="mt-2 h-8 gap-1.5 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
            render={<Link href={`/dashboard/clients/${clientId}/invoices/new`} />}
          >
            <Plus className="size-3.5" />
            New invoice
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Issued</th>
              <th className="px-3 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="w-10 px-2 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {invoices.map((inv) => {
              const Status = STATUS_ICON[inv.displayStatus];
              const days = daysUntil(inv.dueDate);
              const dueLate =
                inv.displayStatus === "overdue" && days !== null
                  ? `${Math.abs(days)}d late`
                  : "";
              const dueSoon =
                inv.displayStatus === "sent" &&
                days !== null &&
                days >= 0 &&
                days <= 7
                  ? days === 0
                    ? "today"
                    : `in ${days}d`
                  : "";
              return (
                <tr key={inv.id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/clients/${inv.clientId}/invoices/${inv.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
                        <FileText className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold group-hover:text-theme-3 dark:group-hover:text-theme-1">
                          {inv.number}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {inv.items.length}{" "}
                          {inv.items.length === 1 ? "line" : "lines"}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_PILL[inv.displayStatus]}`}
                    >
                      <Status className="size-3" />
                      {STATUS_LABEL[inv.displayStatus]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {formatShortDate(inv.issueDate)}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {formatShortDate(inv.dueDate)}
                      </span>
                      {dueLate ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <CalendarClock className="size-3" />
                          {dueLate}
                        </span>
                      ) : dueSoon ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="size-3" />
                          Due {dueSoon}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                    {formatMoney(inv.total, inv.currency)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link
                      href={`/dashboard/clients/${inv.clientId}/invoices/${inv.id}`}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Open invoice"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
