import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  CircleDollarSign,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Send,
  StickyNote,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { can, requireCan } from "@/lib/permissions/check";
import { findClientListItemById } from "@/lib/models/client";
import { findInvoiceById } from "@/lib/models/invoice";
import {
  findCurrency,
  type InvoiceDisplayStatus,
} from "@/lib/clients/invoice-types";
import { findCountry } from "@/lib/clients/countries";

import { InvoiceActionsBar } from "../_components/invoice-actions-bar";

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

function formatLongDate(iso: string): string {
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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; invoiceId: string }>;
}) {
  const session = await requireCan("clients.invoices.view");
  const { clientId, invoiceId } = await params;
  const [invoice, client, canManage, canDelete] = await Promise.all([
    findInvoiceById(invoiceId),
    findClientListItemById(clientId),
    can(session.user.role, "clients.invoices.manage"),
    can(session.user.role, "clients.invoices.delete"),
  ]);
  if (!invoice || !client || invoice.clientId !== clientId) notFound();

  const currencyMeta = findCurrency(invoice.currency);
  const symbol = currencyMeta?.symbol ?? "";
  const StatusIcon = STATUS_ICON[invoice.displayStatus];
  const country = findCountry(client.phoneCountry);
  const phoneDisplay = client.phone
    ? country
      ? `${country.dial} ${client.phone}`
      : client.phone
    : "";
  const location = [client.city, client.country].filter(Boolean).join(", ");
  const dueDays = daysUntil(invoice.dueDate);
  const dueHint =
    invoice.displayStatus === "overdue" && dueDays !== null
      ? `${Math.abs(dueDays)} days overdue`
      : invoice.displayStatus === "sent" && dueDays !== null
        ? dueDays === 0
          ? "Due today"
          : dueDays > 0
            ? `Due in ${dueDays} days`
            : `${Math.abs(dueDays)} days late`
        : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/dashboard/clients/${clientId}/invoices`}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All invoices
        </Link>
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
        <div
          aria-hidden
          className="absolute -top-16 -right-12 size-48 rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-3/30 ring-1 ring-white/20">
              <FileText className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_PILL[invoice.displayStatus]}`}
                >
                  <StatusIcon className="size-3" />
                  {STATUS_LABEL[invoice.displayStatus]}
                </span>
                {dueHint ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      invoice.displayStatus === "overdue"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CalendarClock className="size-3" />
                    {dueHint}
                  </span>
                ) : null}
              </div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                {invoice.number}
              </h1>
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-3.5 opacity-80" />
                <Link
                  href={`/dashboard/clients/${clientId}`}
                  className="hover:text-foreground hover:underline"
                >
                  {client.company || client.name}
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {invoice.paidAmount > 0 && invoice.outstanding > 0
                ? "Outstanding"
                : invoice.status === "paid"
                  ? "Total paid"
                  : "Total due"}
            </span>
            <span className="font-heading text-3xl font-bold tabular-nums text-theme-3 dark:text-theme-1">
              {symbol}
              {(invoice.paidAmount > 0 && invoice.outstanding > 0
                ? invoice.outstanding
                : invoice.total
              ).toFixed(2)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {invoice.currency}
              {invoice.paidAmount > 0 && invoice.outstanding > 0
                ? ` · ${symbol}${invoice.paidAmount.toFixed(2)} of ${symbol}${invoice.total.toFixed(2)} paid`
                : ""}
            </span>
          </div>
        </div>
      </header>

      <InvoiceActionsBar
        invoice={invoice}
        canManage={canManage}
        canDelete={canDelete}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 lg:col-span-2">
          <header className="mb-4 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
              <FileText className="size-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-heading text-sm font-semibold">Line items</h2>
              <p className="text-xs text-muted-foreground">
                {invoice.items.length}{" "}
                {invoice.items.length === 1 ? "line" : "lines"}
              </p>
            </div>
          </header>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Description</th>
                    <th className="w-20 px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="w-28 px-3 py-2 text-right font-semibold">Rate</th>
                    <th className="w-28 px-3 py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 align-top">
                        <p className="whitespace-pre-wrap text-foreground/90">
                          {item.description}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {symbol}
                        {item.rate.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                        {symbol}
                        {item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/20 text-sm">
                  <tr>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground" colSpan={3}>
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {symbol}
                      {invoice.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground" colSpan={3}>
                      Tax ({invoice.taxPercent}%)
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {symbol}
                      {invoice.taxAmount.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td
                      className="px-3 py-2 text-right text-sm font-semibold"
                      colSpan={3}
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-heading font-bold tabular-nums text-theme-3 dark:text-theme-1">
                      {symbol}
                      {invoice.total.toFixed(2)}
                    </td>
                  </tr>
                  {invoice.paidAmount > 0 ? (
                    <>
                      <tr>
                        <td
                          className="px-3 py-2 text-right text-xs text-muted-foreground"
                          colSpan={3}
                        >
                          Paid
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                          − {symbol}
                          {invoice.paidAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-t border-border/60">
                        <td
                          className="px-3 py-2 text-right text-sm font-semibold"
                          colSpan={3}
                        >
                          Outstanding
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-heading font-bold tabular-nums ${
                            invoice.outstanding === 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-theme-3 dark:text-theme-1"
                          }`}
                        >
                          {symbol}
                          {invoice.outstanding.toFixed(2)}
                        </td>
                      </tr>
                    </>
                  ) : null}
                </tfoot>
              </table>
            </div>
          </div>

          {invoice.notes ? (
            <div className="mt-4 flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <StickyNote className="size-3.5 text-theme-3 dark:text-theme-1" />
                Notes
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {invoice.notes}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          {invoice.paidAmount > 0 ? (
            <section className="rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
              <header className="mb-3 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-400/30 to-teal-500/20 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                  <CircleDollarSign className="size-4" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-heading text-sm font-semibold">
                    Payment progress
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const pct =
                        invoice.total > 0
                          ? Math.round(
                              (invoice.paidAmount / invoice.total) * 100
                            )
                          : 0;
                      return `${pct}% collected`;
                    })()}
                  </p>
                </div>
              </header>
              <div className="flex flex-col gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{
                      width: `${
                        invoice.total > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (invoice.paidAmount / invoice.total) * 100
                              )
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-0.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                      Paid
                    </dt>
                    <dd className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                      {symbol}
                      {invoice.paidAmount.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Outstanding
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {symbol}
                      {invoice.outstanding.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
            <header className="mb-3 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/30 to-orange-500/20 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
                <CalendarDays className="size-4" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-heading text-sm font-semibold">Schedule</h2>
                <p className="text-xs text-muted-foreground">Dates on this invoice</p>
              </div>
            </header>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Issued</dt>
                <dd className="font-medium">{formatLongDate(invoice.issueDate)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Due</dt>
                <dd
                  className={`font-medium ${
                    invoice.displayStatus === "overdue"
                      ? "text-rose-600 dark:text-rose-400"
                      : ""
                  }`}
                >
                  {formatLongDate(invoice.dueDate)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {formatLongDate(invoice.createdAt)}
                </dd>
              </div>
              {invoice.updatedAt &&
              invoice.updatedAt !== invoice.createdAt ? (
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-muted-foreground">Updated</dt>
                  <dd className="font-medium">
                    {formatLongDate(invoice.updatedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
            <header className="mb-3 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
                <Building2 className="size-4" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-heading text-sm font-semibold">Bill to</h2>
                <p className="text-xs text-muted-foreground">
                  {client.company || client.name}
                </p>
              </div>
            </header>
            <dl className="flex flex-col gap-2 text-sm">
              {client.name && client.company ? (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Attn:</span>
                  <span className="truncate text-foreground">{client.name}</span>
                </div>
              ) : null}
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-3.5 opacity-70" />
                  <span className="truncate">{client.email}</span>
                </a>
              ) : null}
              {phoneDisplay ? (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3.5 opacity-70" />
                  <span className="truncate">{phoneDisplay}</span>
                </span>
              ) : null}
              {client.website ? (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="size-3.5 opacity-70" />
                  <span className="truncate">{client.website}</span>
                </span>
              ) : null}
              {client.address || location ? (
                <span className="inline-flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 opacity-70" />
                  <span className="whitespace-pre-wrap text-foreground/90">
                    {[client.address, location].filter(Boolean).join("\n")}
                  </span>
                </span>
              ) : null}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
