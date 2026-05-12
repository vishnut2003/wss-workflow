"use client";

import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Receipt,
  TriangleAlert,
} from "lucide-react";

import { findCurrency } from "@/lib/clients/invoice-types";
import type { CurrencySummary } from "@/lib/models/invoice";

function formatMoney(value: number, currencyCode: string): string {
  const meta = findCurrency(currencyCode);
  return `${meta?.symbol ?? ""}${value.toFixed(2)}`;
}

export function InvoiceSummaries({
  summaries,
}: {
  summaries: CurrencySummary[];
}) {
  const [open, setOpen] = useState(false);

  if (summaries.length === 0) return null;

  const mixed = summaries.length > 1;
  const headline =
    summaries.length === 1
      ? summarizeLine(summaries[0])
      : `${summaries.length} currencies`;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-left ring-1 ring-foreground/5 transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/10 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
            <BarChart3 className="size-3.5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Overview</span>
            <span className="text-[11px] text-muted-foreground">
              {headline}
            </span>
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
          {open ? "Hide" : "Show"}
          {open ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-4">
          {summaries.map((summary) => (
            <CurrencyGroup
              key={summary.currency}
              summary={summary}
              showHeader={mixed}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function summarizeLine(s: CurrencySummary): string {
  const pieces = [
    `${formatMoney(s.total, s.currency)} billed`,
    s.outstanding > 0
      ? `${formatMoney(s.outstanding, s.currency)} outstanding`
      : null,
    s.overdue > 0 ? `${s.overdueCount} overdue` : null,
  ].filter(Boolean);
  return pieces.join(" · ");
}

function CurrencyGroup({
  summary,
  showHeader,
}: {
  summary: CurrencySummary;
  showHeader: boolean;
}) {
  const meta = findCurrency(summary.currency);
  return (
    <section className="flex flex-col gap-2">
      {showHeader ? (
        <header className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span aria-hidden className="font-mono text-sm">
              {meta?.symbol ?? ""}
            </span>
            {summary.currency}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {summary.invoiceCount}{" "}
            {summary.invoiceCount === 1 ? "invoice" : "invoices"}
          </span>
        </header>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total billed"
          value={formatMoney(summary.total, summary.currency)}
          hint="Excludes cancelled"
          icon={Receipt}
          accent="from-theme-1 to-theme-3"
        />
        <SummaryCard
          label="Outstanding"
          value={formatMoney(summary.outstanding, summary.currency)}
          hint={
            summary.sentCount + summary.partialCount + summary.overdueCount ===
            0
              ? "Nothing pending"
              : `${summary.sentCount + summary.partialCount + summary.overdueCount} unpaid`
          }
          icon={CircleDollarSign}
          accent="from-sky-400 to-blue-600"
        />
        <SummaryCard
          label="Paid"
          value={formatMoney(summary.paid, summary.currency)}
          hint={
            summary.paidCount === 0 && summary.partialCount === 0
              ? "No payments yet"
              : summary.partialCount > 0
                ? `${summary.paidCount} settled · ${summary.partialCount} partial`
                : `${summary.paidCount} settled`
          }
          icon={CheckCircle2}
          accent="from-emerald-400 to-teal-600"
        />
        <SummaryCard
          label="Overdue"
          value={formatMoney(summary.overdue, summary.currency)}
          hint={
            summary.overdueCount === 0
              ? "All on time"
              : `${summary.overdueCount} late`
          }
          icon={TriangleAlert}
          accent="from-rose-400 to-rose-600"
          warn={summary.overdueCount > 0}
        />
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  warn?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 transition-all">
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 size-32 rounded-full bg-linear-to-br ${accent} opacity-15 blur-2xl`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md shadow-black/10 ring-1 ring-white/20`}
        >
          <Icon className="size-5" />
        </div>
        <span
          className={`inline-flex max-w-[55%] items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            warn
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="truncate">{hint}</span>
        </span>
      </div>
      <div className="relative mt-4 flex flex-col gap-0.5">
        <span className="font-heading text-xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
