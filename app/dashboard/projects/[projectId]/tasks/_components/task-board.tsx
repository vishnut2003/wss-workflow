"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  Filter,
  Inbox,
  MessageSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

import { TaskDetailDialog } from "./task-detail-dialog";

type ProjectMemberOption = {
  id: string;
  name: string;
  email: string;
};

type ColumnTheme = {
  icon: React.ComponentType<{ className?: string }>;
  topBar: string;
  iconWrap: string;
  iconColor: string;
  countPill: string;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyMessage: string;
  cardWash?: string;
};

const COLUMN_THEME: Record<TaskStatus, ColumnTheme> = {
  todo: {
    icon: ClipboardList,
    topBar: "bg-linear-to-r from-slate-400 via-slate-500 to-slate-400",
    iconWrap: "bg-slate-500/15 ring-slate-500/20",
    iconColor: "text-slate-600 dark:text-slate-300",
    countPill:
      "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300",
    emptyIcon: Inbox,
    emptyMessage: "Nothing queued",
  },
  in_progress: {
    icon: Activity,
    topBar: "bg-linear-to-r from-sky-400 via-blue-500 to-cyan-400",
    iconWrap: "bg-sky-500/15 ring-sky-500/25",
    iconColor: "text-sky-600 dark:text-sky-300",
    countPill: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    emptyIcon: Sparkles,
    emptyMessage: "Nothing in flight",
  },
  in_review: {
    icon: Eye,
    topBar: "bg-linear-to-r from-amber-400 via-orange-500 to-amber-400",
    iconWrap: "bg-amber-500/15 ring-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-300",
    countPill:
      "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
    emptyIcon: Eye,
    emptyMessage: "Nothing waiting",
  },
  done: {
    icon: CheckCircle2,
    topBar: "bg-linear-to-r from-emerald-400 via-teal-500 to-emerald-400",
    iconWrap: "bg-emerald-500/15 ring-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-300",
    countPill:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
    emptyIcon: CheckCircle2,
    emptyMessage: "Nothing shipped yet",
    cardWash: "opacity-80",
  },
};

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  low: "before:bg-slate-300 dark:before:bg-slate-600",
  medium: "before:bg-blue-500",
  high: "before:bg-rose-500",
};

const PRIORITY_LABEL_PILL: Record<TaskPriority, string> = {
  low: "bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  medium:
    "bg-blue-500/15 text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300",
  high: "bg-rose-500/15 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300",
};

function initialsOf(nameOrEmail: string): string {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

type DueState = {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
};

function describeDue(iso: string, status: TaskStatus): DueState | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const shortDate = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (status === "done") {
    return {
      label: shortDate,
      className: "text-muted-foreground",
      icon: CalendarDays,
    };
  }
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: `${days}d overdue`,
      className:
        "text-rose-700 dark:text-rose-300 bg-rose-500/10 ring-1 ring-inset ring-rose-500/20 px-1.5 py-0.5 rounded-md",
      icon: AlertTriangle,
    };
  }
  if (diffDays === 0) {
    return {
      label: "Due today",
      className:
        "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20 px-1.5 py-0.5 rounded-md",
      icon: CalendarDays,
    };
  }
  if (diffDays <= 3) {
    return {
      label: `${diffDays}d left`,
      className:
        "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20 px-1.5 py-0.5 rounded-md",
      icon: CalendarDays,
    };
  }
  return {
    label: shortDate,
    className: "text-muted-foreground",
    icon: CalendarDays,
  };
}

export function TaskBoard({
  projectId,
  tasks,
  members,
  currentUserId,
  isManager,
}: {
  projectId: string;
  tasks: TaskListItem[];
  members: ProjectMemberOption[];
  currentUserId: string;
  isManager: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const showMineToggle = !isManager;
  const myTaskCount = useMemo(
    () => tasks.filter((t) => t.assignee?.id === currentUserId).length,
    [tasks, currentUserId]
  );

  const visibleTasks = useMemo(() => {
    if (!showMineToggle || !mineOnly) return tasks;
    return tasks.filter((t) => t.assignee?.id === currentUserId);
  }, [tasks, mineOnly, showMineToggle, currentUserId]);

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskListItem[]>();
    for (const s of TASK_STATUSES) map.set(s, []);
    for (const t of visibleTasks) {
      const bucket = map.get(t.status);
      if (bucket) bucket.push(t);
    }
    return map;
  }, [visibleTasks]);

  const selectedTask = useMemo(() => {
    if (!selectedId) return null;
    return tasks.find((t) => t.id === selectedId) ?? null;
  }, [tasks, selectedId]);

  const totalTasks = tasks.length;
  const doneCount = byStatus.get("done")?.length ?? 0;
  const completionPct =
    totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {totalTasks > 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm ring-1 ring-foreground/5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Completion
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-xl leading-none font-semibold tabular-nums">
                  {completionPct}
                </span>
                <span className="text-xs text-muted-foreground">%</span>
                <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
                  {doneCount} of {totalTasks} done
                </span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-theme-1 via-theme-2 to-theme-3 transition-[width] duration-500 ease-out"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {TASK_STATUSES.map((status) => {
                const count = byStatus.get(status)?.length ?? 0;
                const theme = COLUMN_THEME[status];
                const Icon = theme.icon;
                return (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${theme.countPill}`}
                  >
                    <Icon className="size-3" />
                    <span>{TASK_STATUS_LABELS[status]}</span>
                    <span className="rounded-full bg-background/60 px-1.5 text-[10px] font-bold tabular-nums ring-1 ring-foreground/10">
                      {count}
                    </span>
                  </span>
                );
              })}
            </div>

            {showMineToggle ? (
              <Toggle
                variant="outline"
                size="sm"
                pressed={mineOnly}
                onPressedChange={(next) => setMineOnly(Boolean(next))}
                aria-label="Show only tasks assigned to me"
                className={`shrink-0 gap-1.5 transition-colors ${
                  mineOnly
                    ? "border-theme-1/50 bg-linear-to-br from-theme-1/15 to-theme-3/10 text-theme-3 ring-1 ring-theme-1/20 hover:bg-linear-to-br hover:from-theme-1/20 hover:to-theme-3/15 dark:text-theme-1"
                    : ""
                }`}
              >
                <UserCheck className="size-3.5" />
                <span>My tasks only</span>
                <span
                  className={`ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ring-1 ring-inset ${
                    mineOnly
                      ? "bg-theme-1/20 text-theme-3 ring-theme-1/30 dark:text-theme-1"
                      : "bg-muted text-muted-foreground ring-border"
                  }`}
                >
                  {myTaskCount}
                </span>
              </Toggle>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => {
          const items = byStatus.get(status) ?? [];
          const theme = COLUMN_THEME[status];
          const Icon = theme.icon;
          const EmptyIcon = theme.emptyIcon;
          return (
            <section
              key={status}
              className="group/col relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border/60 bg-linear-to-b from-card to-card/40 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
            >
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 ${theme.topBar}`}
              />

              <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-7 items-center justify-center rounded-lg ring-1 ring-inset ${theme.iconWrap}`}
                  >
                    <Icon className={`size-3.5 ${theme.iconColor}`} />
                  </span>
                  <h2 className="font-heading text-[13px] font-semibold tracking-wide">
                    {TASK_STATUS_LABELS[status]}
                  </h2>
                </div>
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ring-1 ring-inset ${theme.countPill}`}
                >
                  {items.length}
                </span>
              </header>

              <ul className="flex flex-1 flex-col gap-2 px-2.5 pb-3">
                {items.length === 0 ? (
                  <li className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/50 px-3 py-6 text-center">
                    <EmptyIcon className="size-4 text-muted-foreground/40" />
                    <span className="text-[11px] text-muted-foreground/70">
                      {theme.emptyMessage}
                    </span>
                  </li>
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      cardWash={theme.cardWash}
                      onClick={() => setSelectedId(task.id)}
                    />
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>

      <TaskDetailDialog
        projectId={projectId}
        task={selectedTask}
        open={selectedId !== null}
        onOpenChange={(next) => {
          if (!next) setSelectedId(null);
        }}
        members={members}
        currentUserId={currentUserId}
        isManager={isManager}
      />
    </div>
  );
}

function TaskCard({
  task,
  cardWash,
  onClick,
}: {
  task: TaskListItem;
  cardWash?: string;
  onClick: () => void;
}) {
  const due = describeDue(task.dueDate, task.status);
  const isDone = task.status === "done";

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group/task relative flex w-full flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-card px-3 pt-2.5 pr-3 pb-2.5 pl-3.5 text-left shadow-sm ring-1 ring-foreground/5 transition-all duration-150 ease-out before:absolute before:inset-y-2 before:left-1.5 before:w-1 before:rounded-full before:transition-all hover:-translate-y-0.5 hover:border-theme-1/40 hover:shadow-md hover:shadow-theme-2/10 hover:before:inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${PRIORITY_BORDER[task.priority]} ${cardWash ?? ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`flex-1 text-sm leading-snug font-semibold transition-colors group-hover/task:text-theme-3 dark:group-hover/task:text-theme-1 ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}
          >
            {task.title}
          </h3>
          {task.priority !== "low" ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${PRIORITY_LABEL_PILL[task.priority]}`}
            >
              {task.priority}
            </span>
          ) : null}
        </div>

        {task.description ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {due ? (
              <span
                className={`inline-flex items-center gap-1 font-medium ${due.className}`}
              >
                <due.icon className="size-3" />
                {due.label}
              </span>
            ) : null}
            {task.comments.length > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                <MessageSquare className="size-3" />
                {task.comments.length}
              </span>
            ) : null}
          </div>

          {task.assignee ? (
            <Avatar className="size-6 ring-2 ring-background transition-transform group-hover/task:scale-105">
              <AvatarFallback
                className="bg-linear-to-br from-theme-1/30 to-theme-3/20 text-[9px] font-bold text-theme-3 dark:text-theme-1"
                title={task.assignee.name || task.assignee.email}
              >
                {initialsOf(task.assignee.name || task.assignee.email)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="rounded-full bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground/80">
              Unassigned
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
