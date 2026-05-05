"use client";

import { useMemo, useState } from "react";
import {
  Bug,
  Inbox,
  Lightbulb,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type FeedbackListItem,
} from "@/lib/feedback/categories";

type CategoryFilter = "all" | FeedbackCategory;

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  general: "General",
  bug: "Bug",
  feature: "Feature",
  other: "Other",
};

const CATEGORY_ICON: Record<
  FeedbackCategory,
  React.ComponentType<{ className?: string }>
> = {
  general: MessageSquare,
  bug: Bug,
  feature: Lightbulb,
  other: Sparkles,
};

const CATEGORY_CHIP_ACTIVE: Record<FeedbackCategory, string> = {
  general: "bg-theme-1/20 text-theme-3 ring-theme-1/30 dark:text-theme-1",
  bug: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  feature: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  other: "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300",
};

function initialsOf(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

function formatAbsoluteDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatRelativeDate(iso: string) {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const sec = Math.round(diffMs / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const wk = Math.round(day / 7);
    const mo = Math.round(day / 30);
    const yr = Math.round(day / 365);

    if (sec < 45) return "just now";
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;
    if (wk < 5) return `${wk}w ago`;
    if (mo < 12) return `${mo}mo ago`;
    return `${yr}y ago`;
  } catch {
    return "";
  }
}

function countByCategory(
  items: FeedbackListItem[]
): Record<FeedbackCategory, number> {
  const counts: Record<FeedbackCategory, number> = {
    general: 0,
    bug: 0,
    feature: 0,
    other: 0,
  };
  for (const item of items) counts[item.category] += 1;
  return counts;
}

export function FeedbackList({ feedback }: { feedback: FeedbackListItem[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const totalCounts = useMemo(() => countByCategory(feedback), [feedback]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feedback.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const haystack =
        `${item.subject} ${item.message} ${item.userName} ${item.userEmail}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [feedback, query, categoryFilter]);

  const isFiltering =
    query.trim().length > 0 || categoryFilter !== "all";

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-linear-to-br from-theme-1/8 via-card to-card px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/20 ring-1 ring-theme-1/20">
              <Inbox className="size-4 text-theme-3 dark:text-theme-1" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-heading text-sm font-semibold leading-tight">
                All feedback
              </h2>
              <p className="text-xs text-muted-foreground">
                {isFiltering
                  ? `${filtered.length} of ${feedback.length} ${
                      feedback.length === 1 ? "entry" : "entries"
                    }`
                  : `${feedback.length} ${
                      feedback.length === 1 ? "entry" : "entries"
                    } received`}
              </p>
            </div>
          </div>

          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search subject, sender or content"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search feedback"
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            label="All"
            count={feedback.length}
            activeClass="bg-foreground/10 text-foreground ring-foreground/20"
          />
          {FEEDBACK_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c];
            return (
              <FilterChip
                key={c}
                active={categoryFilter === c}
                onClick={() =>
                  setCategoryFilter((prev) => (prev === c ? "all" : c))
                }
                label={CATEGORY_LABEL[c]}
                count={totalCounts[c]}
                icon={<Icon className="size-3" />}
                activeClass={CATEGORY_CHIP_ACTIVE[c]}
                disabled={totalCounts[c] === 0}
              />
            );
          })}
          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => {
                setQuery("");
                setCategoryFilter("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {feedback.length === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="When members share feedback, it'll show up here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description={
            query.trim()
              ? `No feedback matches "${query.trim()}"${
                  categoryFilter !== "all"
                    ? ` in ${CATEGORY_LABEL[categoryFilter]}`
                    : ""
                }.`
              : `No ${CATEGORY_LABEL[categoryFilter as FeedbackCategory]} feedback yet.`
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setCategoryFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border/40">
          {filtered.map((item) => {
            const Icon = CATEGORY_ICON[item.category];
            const displayName = item.userName || item.userEmail.split("@")[0];
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 ring-2 ring-background">
                    <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-xs font-semibold text-theme-3 dark:text-theme-1">
                      {initialsOf(item.userName || item.userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {item.subject}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ${
                          CATEGORY_CHIP_ACTIVE[item.category]
                        }`}
                      >
                        <Icon className="size-3" />
                        {CATEGORY_LABEL[item.category]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {displayName}
                      </span>
                      <a
                        href={`mailto:${item.userEmail}`}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        <Mail className="size-3 opacity-60" />
                        <span className="truncate">{item.userEmail}</span>
                      </a>
                      <span
                        className="tabular-nums"
                        title={formatAbsoluteDate(item.createdAt)}
                      >
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground/90 ring-1 ring-border/40">
                  {item.message}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  icon,
  activeClass,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
  activeClass: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? activeClass
          : "bg-background/60 text-muted-foreground ring-border hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`tabular-nums rounded px-1 text-[10px] ${
          active ? "bg-background/40" : "bg-muted/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
        <Inbox className="size-6 text-theme-3 dark:text-theme-1" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
