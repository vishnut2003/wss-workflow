"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  FolderKanban,
  Lock,
} from "lucide-react";

import type { ClientListItem } from "@/lib/clients/types";

import { ViewClientDialog } from "../../clients/_components/view-client-dialog";
import type { MyTaskItem, MyTaskSource } from "../_lib/types";
import {
  toggleMyClientTaskAction,
  toggleMyProjectTaskAction,
} from "../actions";

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

type DueTone = "overdue" | "today" | "soon" | "ok";

function dueTone(iso: string): DueTone | null {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 3) return "soon";
  return "ok";
}

const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
  today: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  soon: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  ok: "bg-muted text-muted-foreground ring-border",
};

function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days}d`;
  return `Due ${formatLongDate(iso)}`;
}

const SOURCE_LABEL: Record<MyTaskSource, string> = {
  client: "Client",
  project: "Project",
};

const SOURCE_CHIP: Record<MyTaskSource, string> = {
  client:
    "bg-theme-1/10 text-theme-3 ring-theme-1/25 dark:text-theme-1",
  project:
    "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300",
};

export function MyTasksList({ items }: { items: MyTaskItem[] }) {
  const [showDone, setShowDone] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [viewClient, setViewClient] = useState<ClientListItem | null>(null);

  const closeViewClient = (open: boolean) => {
    if (!open) {
      window.setTimeout(() => setViewClient(null), 150);
    }
  };

  const { open, done } = useMemo(() => {
    const o: MyTaskItem[] = [];
    const d: MyTaskItem[] = [];
    for (const i of items) (i.isMyComplete ? d : o).push(i);
    o.sort((a, b) => {
      const ad = daysUntil(a.dueDate);
      const bd = daysUntil(b.dueDate);
      if (ad === null && bd === null) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (ad === null) return 1;
      if (bd === null) return -1;
      return ad - bd;
    });
    d.sort((a, b) => {
      const ac = a.completedAt || a.updatedAt;
      const bc = b.completedAt || b.updatedAt;
      return bc.localeCompare(ac);
    });
    return { open: o, done: d };
  }, [items]);

  const toggle = (item: MyTaskItem) => {
    if (!item.canToggle) return;
    const fd = new FormData();
    fd.set("taskId", item.id);
    const key = `${item.source}:${item.id}`;
    setPendingKey(key);
    startTransition(async () => {
      if (item.source === "client") {
        await toggleMyClientTaskAction(undefined, fd);
      } else {
        await toggleMyProjectTaskAction(undefined, fd);
      }
      setPendingKey(null);
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 px-5 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
          <ClipboardList className="size-6 text-theme-3 dark:text-theme-1" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Inbox zero</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Nothing&rsquo;s assigned to you yet. When something does land here,
            you&rsquo;ll be able to mark it done from this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <SectionHeader title="Open" count={open.length} />
        {open.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-center text-xs text-muted-foreground">
            All caught up — everything assigned to you is done.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {open.map((item) => (
              <li key={`${item.source}:${item.id}`}>
                <TaskRow
                  item={item}
                  pending={pendingKey === `${item.source}:${item.id}`}
                  onToggle={() => toggle(item)}
                  onViewClient={setViewClient}
                />
              </li>
            ))}
          </ul>
        )}

        {done.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowDone((prev) => !prev)}
              className="inline-flex w-fit items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {showDone ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              {showDone ? "Hide" : "Show"} {done.length} completed
            </button>
            {showDone ? (
              <ul className="flex flex-col gap-2">
                {done.map((item) => (
                  <li key={`${item.source}:${item.id}`}>
                    <TaskRow
                      item={item}
                      pending={pendingKey === `${item.source}:${item.id}`}
                      onToggle={() => toggle(item)}
                      onViewClient={setViewClient}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <ViewClientDialog
        open={viewClient !== null}
        onOpenChange={closeViewClient}
        client={viewClient}
      />
    </>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
        {count}
      </span>
    </div>
  );
}

function TaskRow({
  item,
  pending,
  onToggle,
  onViewClient,
}: {
  item: MyTaskItem;
  pending: boolean;
  onToggle: () => void;
  onViewClient: (client: ClientListItem) => void;
}) {
  const tone = dueTone(item.dueDate);
  const dueText = dueLabel(item.dueDate);
  const SourceIcon = item.source === "client" ? Building2 : FolderKanban;
  const clientForView = item.source === "client" ? item.client : null;
  const checkboxDisabled = pending || !item.canToggle;

  const checkboxLabel = !item.canToggle
    ? "Locked — only a manager can change this"
    : item.isMyComplete
      ? item.isInReview
        ? "Withdraw from review"
        : "Mark as not done"
      : item.source === "project" && !item.isInReview
        ? "Submit for review"
        : "Mark as done";

  const checkboxClass = !item.canToggle
    ? "border-emerald-500 bg-emerald-500 text-white opacity-70"
    : item.isMyComplete
      ? item.isInReview
        ? "border-amber-500 bg-amber-500 text-white"
        : "border-emerald-500 bg-emerald-500 text-white"
      : "border-input bg-background hover:border-emerald-500/60 hover:bg-emerald-500/10";

  return (
    <article
      className={`group flex items-start gap-3 rounded-xl border bg-card p-3.5 shadow-sm ring-1 transition-colors ${
        item.isMyComplete
          ? "border-border/40 bg-muted/20 ring-foreground/0"
          : "border-border/60 ring-foreground/5 hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
      } ${pending ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={checkboxDisabled}
        aria-pressed={item.isMyComplete}
        aria-label={checkboxLabel}
        title={checkboxLabel}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${checkboxClass} disabled:cursor-not-allowed`}
      >
        {!item.canToggle ? (
          <Lock className="size-3" />
        ) : item.isMyComplete ? (
          item.isInReview ? (
            <Eye className="size-3" />
          ) : (
            <Check className="size-3.5" />
          )
        ) : null}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${SOURCE_CHIP[item.source]}`}
          >
            <SourceIcon className="size-2.5" />
            {SOURCE_LABEL[item.source]}
          </span>
          {clientForView ? (
            <button
              type="button"
              onClick={() => onViewClient(clientForView)}
              title="View client details"
              className="inline-flex items-center gap-1 rounded-sm text-[11px] font-medium text-muted-foreground transition-colors outline-none hover:text-theme-3 focus-visible:text-theme-3"
            >
              <span className="truncate">{item.parentName}</span>
              <Eye className="size-3 shrink-0 opacity-60" />
            </button>
          ) : item.parentHref ? (
            <Link
              href={item.parentHref}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-theme-3 hover:underline"
            >
              <span className="truncate">{item.parentName}</span>
              <ArrowUpRight className="size-3 shrink-0 opacity-60" />
            </Link>
          ) : (
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {item.parentName}
            </span>
          )}
        </div>

        <p
          className={`text-sm font-medium leading-snug ${
            item.isMyComplete && !item.isInReview
              ? "text-muted-foreground line-through decoration-muted-foreground/60"
              : "text-foreground"
          }`}
        >
          {item.title}
        </p>

        {item.description ? (
          <p
            className={`line-clamp-2 text-xs ${
              item.isMyComplete ? "text-muted-foreground/70" : "text-muted-foreground"
            }`}
          >
            {item.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {tone && dueText && !item.isMyComplete ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ${DUE_TONE_CLASS[tone]}`}
            >
              <CalendarClock className="size-3" />
              {dueText}
            </span>
          ) : null}
          {item.isInReview ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300">
              <Eye className="size-3" />
              In review
            </span>
          ) : null}
          {item.isMyComplete && !item.isInReview && item.completedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Done {formatLongDate(item.completedAt)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
