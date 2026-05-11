"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientTaskListItem } from "@/lib/clients/task-types";

import { setTaskStatusAction } from "../actions";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import type { TaskAssigneeOption } from "./task-form-fields";

function initialsOf(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

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

export function TasksList({
  tasks,
  assignees,
}: {
  tasks: ClientTaskListItem[];
  assignees: TaskAssigneeOption[];
}) {
  const [actionTarget, setActionTarget] = useState<ClientTaskListItem | null>(
    null
  );
  const [dialog, setDialog] = useState<"none" | "edit" | "delete">("none");
  const [showDone, setShowDone] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startStatusTransition] = useTransition();

  const { open, done } = useMemo(() => {
    const o: ClientTaskListItem[] = [];
    const d: ClientTaskListItem[] = [];
    for (const t of tasks) (t.status === "done" ? d : o).push(t);
    o.sort((a, b) => {
      const ad = daysUntil(a.dueDate);
      const bd = daysUntil(b.dueDate);
      if (ad === null && bd === null) return 0;
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
  }, [tasks]);

  const openEdit = (t: ClientTaskListItem) => {
    setActionTarget(t);
    setDialog("edit");
  };
  const openDelete = (t: ClientTaskListItem) => {
    setActionTarget(t);
    setDialog("delete");
  };
  const closeDialog = (open: boolean) => {
    if (!open) {
      setDialog("none");
      window.setTimeout(() => setActionTarget(null), 150);
    }
  };

  const toggleStatus = (t: ClientTaskListItem) => {
    const fd = new FormData();
    fd.set("taskId", t.id);
    fd.set("status", t.status === "done" ? "pending" : "done");
    setPendingId(t.id);
    startStatusTransition(async () => {
      await setTaskStatusAction(undefined, fd);
      setPendingId(null);
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
          <ClipboardList className="size-5 text-theme-3 dark:text-theme-1" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">No tasks yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Add a follow-up so nothing slips — call backs, proposals, renewals,
            anything you owe this client.
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
            All caught up — every task is done.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {open.map((t) => (
              <li key={t.id}>
                <TaskRow
                  task={t}
                  pending={pendingId === t.id}
                  onToggle={() => toggleStatus(t)}
                  onEdit={() => openEdit(t)}
                  onDelete={() => openDelete(t)}
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
                {done.map((t) => (
                  <li key={t.id}>
                    <TaskRow
                      task={t}
                      pending={pendingId === t.id}
                      onToggle={() => toggleStatus(t)}
                      onEdit={() => openEdit(t)}
                      onDelete={() => openDelete(t)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <EditTaskDialog
        open={dialog === "edit"}
        onOpenChange={closeDialog}
        task={dialog === "edit" ? actionTarget : null}
        assignees={assignees}
      />

      <DeleteTaskDialog
        open={dialog === "delete"}
        onOpenChange={closeDialog}
        taskId={dialog === "delete" ? actionTarget?.id ?? null : null}
        taskTitle={actionTarget?.title ?? ""}
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
  task,
  pending,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: ClientTaskListItem;
  pending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "done";
  const tone = dueTone(task.dueDate);
  const dueText = dueLabel(task.dueDate);

  return (
    <article
      className={`group flex items-start gap-3 rounded-xl border bg-card p-3.5 shadow-sm ring-1 transition-colors ${
        isDone
          ? "border-border/40 bg-muted/20 ring-foreground/0"
          : "border-border/60 ring-foreground/5 hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
      } ${pending ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={isDone}
        aria-label={isDone ? "Mark as not done" : "Mark as done"}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-input bg-background hover:border-emerald-500/60 hover:bg-emerald-500/10"
        } disabled:cursor-not-allowed`}
      >
        {isDone ? <Check className="size-3.5" /> : null}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className={`text-left text-sm font-medium leading-snug outline-none transition-colors focus-visible:text-theme-3 ${
            isDone
              ? "text-muted-foreground line-through decoration-muted-foreground/60"
              : "text-foreground hover:text-theme-3 dark:hover:text-theme-1"
          }`}
        >
          {task.title}
        </button>

        {task.description ? (
          <p
            className={`line-clamp-2 text-xs ${
              isDone ? "text-muted-foreground/70" : "text-muted-foreground"
            }`}
          >
            {task.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {tone && dueText && !isDone ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ${DUE_TONE_CLASS[tone]}`}
            >
              <CalendarClock className="size-3" />
              {dueText}
            </span>
          ) : null}
          {isDone && task.completedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Done {formatLongDate(task.completedAt)}
            </span>
          ) : null}
          {task.assignee ? (
            <span
              className="inline-flex items-center gap-1.5 text-muted-foreground"
              title={task.assignee.email}
            >
              <Avatar className="size-5">
                <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[9px] font-semibold text-theme-3 dark:text-theme-1">
                  {initialsOf(task.assignee.name || task.assignee.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {task.assignee.name?.trim() || task.assignee.email.split("@")[0]}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground/70">
              <UserIcon className="size-3 opacity-60" />
              Unassigned
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${task.title}`}
              disabled={pending}
              className="opacity-60 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={onToggle}>
            {isDone ? (
              <>
                <ClipboardList className="size-4" />
                Mark as not done
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Mark as done
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            Edit task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
