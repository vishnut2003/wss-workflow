"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CircleDashed,
  CircleDollarSign,
  Loader2,
  Search,
  Send,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { findCurrency } from "@/lib/clients/invoice-types";

import {
  type InvoiceFilters,
  type StatusCounts,
  type StatusFilter,
} from "../_lib/filters";

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: string;
}> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft", icon: CircleDashed, tone: "slate" },
  { value: "sent", label: "Sent", icon: Send, tone: "sky" },
  {
    value: "partial",
    label: "Partial",
    icon: CircleDollarSign,
    tone: "violet",
  },
  { value: "overdue", label: "Overdue", icon: TriangleAlert, tone: "rose" },
  { value: "paid", label: "Paid", icon: CheckCircle2, tone: "emerald" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, tone: "amber" },
];

const TONE_ACTIVE: Record<string, string> = {
  slate: "bg-slate-500/20 text-slate-700 ring-slate-500/40 dark:text-slate-200",
  sky: "bg-sky-500/20 text-sky-700 ring-sky-500/40 dark:text-sky-200",
  violet:
    "bg-violet-500/20 text-violet-700 ring-violet-500/40 dark:text-violet-200",
  rose: "bg-rose-500/20 text-rose-700 ring-rose-500/40 dark:text-rose-200",
  emerald:
    "bg-emerald-500/20 text-emerald-700 ring-emerald-500/40 dark:text-emerald-200",
  amber:
    "bg-amber-500/20 text-amber-700 ring-amber-500/40 dark:text-amber-200",
};

export function InvoiceFiltersBar({
  filters,
  counts,
  availableCurrencies,
}: {
  filters: InvoiceFilters;
  counts: StatusCounts;
  availableCurrencies: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const lastPushedRef = useRef(filters.q);

  // Keep local query in sync if filters change via another route push (e.g.
  // clearing filters).
  useEffect(() => {
    if (filters.q !== lastPushedRef.current) {
      setQuery(filters.q);
      lastPushedRef.current = filters.q;
    }
  }, [filters.q]);

  const buildUrl = (patch: Partial<InvoiceFilters>) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    const apply = (key: keyof InvoiceFilters, value: string) => {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    };
    if (patch.status !== undefined) apply("status", patch.status);
    if (patch.currency !== undefined) apply("currency", patch.currency);
    if (patch.q !== undefined) apply("q", patch.q);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const push = (patch: Partial<InvoiceFilters>) => {
    startTransition(() => {
      router.replace(buildUrl(patch), { scroll: false });
    });
  };

  // Debounce text-search updates so we don't push on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (query !== filters.q) {
        lastPushedRef.current = query;
        push({ q: query });
      }
    }, 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.currency !== "all" ||
    filters.q.length > 0;

  const clearAll = () => {
    setQuery("");
    lastPushedRef.current = "";
    push({ status: "all", currency: "all", q: "" });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 ring-1 ring-foreground/5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice number…"
            aria-label="Search invoices"
            className="h-9 w-full rounded-md border border-border/60 bg-background pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        {availableCurrencies.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Currency
            </span>
            <CurrencyChip
              active={filters.currency === "all"}
              label="All"
              onClick={() => push({ currency: "all" })}
            />
            {availableCurrencies.map((code) => {
              const meta = findCurrency(code);
              return (
                <CurrencyChip
                  key={code}
                  active={filters.currency === code}
                  label={`${meta?.symbol ?? ""} ${code}`}
                  onClick={() => push({ currency: code })}
                />
              );
            })}
          </div>
        ) : null}

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-1"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = filters.status === opt.value;
          const Icon = opt.icon;
          const count = counts[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => push({ status: opt.value })}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 transition-colors ${
                active
                  ? opt.tone
                    ? TONE_ACTIVE[opt.tone]
                    : "bg-foreground text-background ring-foreground/40"
                  : "bg-muted/40 text-muted-foreground ring-border hover:bg-muted hover:text-foreground"
              } ${count === 0 && !active ? "opacity-50" : ""}`}
            >
              {Icon ? <Icon className="size-3" /> : null}
              <span>{opt.label}</span>
              <span
                className={`inline-flex items-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                  active
                    ? "bg-background/30"
                    : "bg-background text-foreground/70"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CurrencyChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 transition-colors ${
        active
          ? "bg-theme-1/15 text-theme-3 ring-theme-1/30 dark:text-theme-1"
          : "bg-muted/40 text-muted-foreground ring-border hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
