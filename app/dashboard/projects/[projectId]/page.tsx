import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  FolderArchive,
  LinkIcon,
  ListChecks,
  Plus,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";
import { listTasksForProject } from "@/lib/models/task";
import { listResourcesForProject } from "@/lib/models/resource";
import {
  type ProjectListItem,
  type ProjectStatus,
} from "@/lib/projects/types";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";
import type { ResourceListItem } from "@/lib/resources/types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_HERO_PILL: Record<ProjectStatus, string> = {
  planned: "bg-sky-500/20 text-sky-50 ring-sky-300/40",
  in_progress: "bg-emerald-500/25 text-emerald-50 ring-emerald-300/40",
  on_hold: "bg-amber-500/25 text-amber-50 ring-amber-300/50",
  completed: "bg-violet-500/25 text-violet-50 ring-violet-300/40",
  archived: "bg-slate-500/25 text-slate-50 ring-slate-300/40",
};

const TASK_STATUS_PILL: Record<TaskStatus, string> = {
  todo: "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  in_progress:
    "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  in_review:
    "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  done: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
};

const TASK_STATUS_BAR: Record<TaskStatus, string> = {
  todo: "bg-slate-400 dark:bg-slate-500",
  in_progress: "bg-sky-500",
  in_review: "bg-amber-500",
  done: "bg-emerald-500",
};

const PRIORITY_PILL: Record<TaskPriority, string> = {
  low: "bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  medium:
    "bg-blue-500/15 text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300",
  high: "bg-rose-500/15 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300",
};

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "?";
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

function formatRelative(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 1) return "just now";
  if (Math.abs(diffMin) < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 7) return `${diffD}d ago`;
  return formatLongDate(iso);
}

function daysBetween(fromIso: string, toIso: string): number | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  const ms = to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();
  const project = await findProjectForUser(
    projectId,
    session.user.id,
    session.user.role
  );
  if (!project) notFound();

  const canEdit = hasAtLeast(session.user.role, "manager");
  const isAdmin = hasAtLeast(session.user.role, "admin");
  const isAssignedManager =
    session.user.role === "manager" &&
    project.assignees.some((a) => a.id === session.user.id);
  const canManageTasks = isAdmin || isAssignedManager;

  const [tasks, resources] = await Promise.all([
    listTasksForProject(project.id),
    listResourcesForProject(project.id),
  ]);

  const taskCounts: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  };
  for (const t of tasks) taskCounts[t.status] += 1;

  const totalTasks = tasks.length;
  const doneTasks = taskCounts.done;
  const completionPct =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const activeTasks =
    taskCounts.todo + taskCounts.in_progress + taskCounts.in_review;

  const todayIso = new Date().toISOString();
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.dueDate &&
      (daysBetween(todayIso, t.dueDate) ?? 1) < 0
  ).length;

  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const recentResources = resources.slice(0, 4);

  const teamMembers = project.members;
  const teamSize = project.assignees.length + teamMembers.length;

  const dueDays =
    project.dueDate ? daysBetween(todayIso, project.dueDate) : null;
  const startDays =
    project.startDate ? daysBetween(project.startDate, todayIso) : null;
  const totalDuration =
    project.startDate && project.dueDate
      ? daysBetween(project.startDate, project.dueDate)
      : null;
  const elapsedPct =
    totalDuration && totalDuration > 0 && startDays !== null
      ? Math.max(0, Math.min(100, Math.round((startDays / totalDuration) * 100)))
      : null;

  return (
    <div className="flex flex-col gap-6">
      <HeroHeader
        project={project}
        canEdit={canEdit}
        canManageTasks={canManageTasks}
        completionPct={completionPct}
        dueDays={dueDays}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={String(totalTasks)}
          hint={
            totalTasks === 0
              ? "Get started"
              : `${doneTasks} done · ${activeTasks} active`
          }
          icon={ListChecks}
          accent="from-sky-400 to-blue-600"
        />
        <StatCard
          label="In progress"
          value={String(taskCounts.in_progress)}
          hint={
            taskCounts.in_review > 0
              ? `${taskCounts.in_review} in review`
              : taskCounts.todo > 0
                ? `${taskCounts.todo} queued`
                : "Nothing in flight"
          }
          icon={Activity}
          accent="from-amber-400 to-orange-500"
        />
        <StatCard
          label="Completion"
          value={`${completionPct}%`}
          hint={
            overdueTasks > 0
              ? `${overdueTasks} overdue`
              : completionPct === 100 && totalTasks > 0
                ? "All done"
                : "On track"
          }
          hintTone={overdueTasks > 0 ? "warn" : "default"}
          icon={TrendingUp}
          accent="from-emerald-400 to-teal-600"
        />
        <StatCard
          label="Resources"
          value={String(resources.length)}
          hint={`${teamSize} ${teamSize === 1 ? "teammate" : "teammates"}`}
          icon={FolderArchive}
          accent="from-violet-400 to-fuchsia-500"
        />
      </section>

      <ProgressBreakdown
        projectId={project.id}
        counts={taskCounts}
        total={totalTasks}
        completionPct={completionPct}
        canManageTasks={canManageTasks}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <RecentTasksPanel
          projectId={project.id}
          tasks={recentTasks}
          totalTasks={totalTasks}
          canManageTasks={canManageTasks}
        />

        <div className="flex flex-col gap-4">
          <TimelineCard
            startDate={project.startDate}
            dueDate={project.dueDate}
            elapsedPct={elapsedPct}
            dueDays={dueDays}
          />
          <TeamCard
            projectId={project.id}
            assignees={project.assignees}
            members={teamMembers}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DescriptionCard
          description={project.description}
          client={project.client}
          createdAt={project.createdAt}
          updatedAt={project.updatedAt}
        />
        <ResourcesPanel
          projectId={project.id}
          resources={recentResources}
          totalResources={resources.length}
        />
      </section>
    </div>
  );
}

function HeroHeader({
  project,
  canEdit,
  canManageTasks,
  completionPct,
  dueDays,
}: {
  project: ProjectListItem;
  canEdit: boolean;
  canManageTasks: boolean;
  completionPct: number;
  dueDays: number | null;
}) {
  const dueLabel = formatLongDate(project.dueDate);
  const startLabel = formatLongDate(project.startDate);
  const dueTone =
    dueDays === null
      ? null
      : dueDays < 0
        ? "overdue"
        : dueDays <= 7
          ? "soon"
          : "ok";
  const dueText =
    dueDays === null
      ? null
      : dueDays < 0
        ? `${Math.abs(dueDays)}d overdue`
        : dueDays === 0
          ? "Due today"
          : `${dueDays}d remaining`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 p-6 text-white shadow-lg shadow-theme-3/25 sm:p-8">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.3) 0, transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-12 size-72 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-10 size-72 rounded-full bg-black/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-md ${STATUS_HERO_PILL[project.status]}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {STATUS_LABEL[project.status]}
              </span>
              {project.client ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/25 backdrop-blur-md">
                  <Building2 className="size-3" />
                  {project.client.company || project.client.name}
                </span>
              ) : null}
              {dueText && dueTone ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 backdrop-blur-md ${
                    dueTone === "overdue"
                      ? "bg-rose-500/30 text-rose-50 ring-rose-200/50"
                      : dueTone === "soon"
                        ? "bg-amber-500/30 text-amber-50 ring-amber-200/50"
                        : "bg-white/15 text-white ring-white/25"
                  }`}
                >
                  <CalendarClock className="size-3" />
                  {dueText}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/75 uppercase">
                Project overview
              </span>
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {project.name}
              </h1>
              {project.description ? (
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/85 line-clamp-2">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center lg:items-end lg:flex-col">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                nativeButton={false}
                className="h-9 gap-1.5 bg-white text-theme-3 ring-1 ring-white/40 hover:bg-white/90"
                render={
                  <Link href={`/dashboard/projects/${project.id}/tasks`} />
                }
              >
                <ListChecks className="size-4" />
                View tasks
              </Button>
              {canEdit ? (
                <Button
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  className="h-9 gap-1.5 bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/25"
                  render={
                    <Link
                      href={`/dashboard/projects/${project.id}/settings`}
                    />
                  }
                >
                  <Settings className="size-4" />
                  Edit
                </Button>
              ) : null}
            </div>
            {canManageTasks ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-white/80">
                <Sparkles className="size-3" />
                You manage this project
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
          <HeroFact
            icon={CalendarDays}
            label="Start"
            value={startLabel || "Not set"}
          />
          <HeroFact
            icon={Target}
            label="Due"
            value={dueLabel || "Not set"}
          />
          <HeroFact
            icon={UserCheck}
            label="Manager"
            value={
              project.assignees.length > 0
                ? project.assignees
                    .map((a) => a.name || a.email.split("@")[0])
                    .slice(0, 2)
                    .join(", ") +
                  (project.assignees.length > 2
                    ? ` +${project.assignees.length - 2}`
                    : "")
                : "Unassigned"
            }
          />
          <HeroFact
            icon={TrendingUp}
            label="Completion"
            value={`${completionPct}%`}
          />
        </div>
      </div>
    </div>
  );
}

function HeroFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-white/75 uppercase">
          {label}
        </span>
        <span className="truncate text-sm font-medium" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  hintTone = "default",
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  hintTone?: "default" | "warn";
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-theme-3/10">
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 size-32 rounded-full bg-linear-to-br ${accent} opacity-15 blur-2xl transition-opacity group-hover:opacity-25`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md shadow-black/10 ring-1 ring-white/20`}
        >
          <Icon className="size-5" />
        </div>
        <span
          className={`inline-flex max-w-[55%] items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            hintTone === "warn"
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className="truncate">{hint}</span>
        </span>
      </div>
      <div className="relative mt-4 flex flex-col gap-0.5">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function ProgressBreakdown({
  projectId,
  counts,
  total,
  completionPct,
  canManageTasks,
}: {
  projectId: string;
  counts: Record<TaskStatus, number>;
  total: number;
  completionPct: number;
  canManageTasks: boolean;
}) {
  const segments: { key: TaskStatus; pct: number }[] =
    total > 0
      ? (Object.keys(counts) as TaskStatus[]).map((key) => ({
          key,
          pct: (counts[key] / total) * 100,
        }))
      : [];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-sm font-semibold">Task progress</h2>
          <p className="text-xs text-muted-foreground">
            {total === 0
              ? "No tasks yet — start by adding one."
              : `${counts.done} of ${total} ${total === 1 ? "task" : "tasks"} completed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            {completionPct}%
          </span>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="h-8 gap-1 text-xs"
            render={<Link href={`/dashboard/projects/${projectId}/tasks`} />}
          >
            Tasks board
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-muted/70">
        {total === 0 ? (
          <div className="h-full w-full bg-linear-to-r from-muted to-muted/50" />
        ) : (
          segments.map(({ key, pct }) =>
            pct > 0 ? (
              <div
                key={key}
                className={`h-full ${TASK_STATUS_BAR[key]} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${TASK_STATUS_LABELS[key]} · ${counts[key]}`}
              />
            ) : null
          )
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(counts) as TaskStatus[]).map((key) => (
          <BreakdownItem
            key={key}
            label={TASK_STATUS_LABELS[key]}
            count={counts[key]}
            total={total}
            barClass={TASK_STATUS_BAR[key]}
            tone={key}
          />
        ))}
      </div>

      {total === 0 && canManageTasks ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
            <ClipboardList className="size-5" />
          </div>
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Break the work down into tasks so the team can pick things up.
          </p>
          <Button
            size="sm"
            nativeButton={false}
            className="mt-1 h-8 gap-1 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
            render={<Link href={`/dashboard/projects/${projectId}/tasks`} />}
          >
            <Plus className="size-3.5" />
            Add first task
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function BreakdownItem({
  label,
  count,
  total,
  barClass,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  barClass: string;
  tone: TaskStatus;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 ring-1 ring-foreground/5`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span className={`size-2 rounded-full ${barClass}`} />
          {label}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${TASK_STATUS_PILL[tone]}`}
        >
          {count}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{pct}%</span>
        <span>of total</span>
      </div>
    </div>
  );
}

function RecentTasksPanel({
  projectId,
  tasks,
  totalTasks,
  canManageTasks,
}: {
  projectId: string;
  tasks: TaskListItem[];
  totalTasks: number;
  canManageTasks: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5 xl:col-span-2">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-400/30 to-cyan-500/20 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300">
            <ListChecks className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Recent tasks</h2>
            <p className="text-xs text-muted-foreground">
              Latest activity from the board
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-theme-3 hover:text-theme-2 dark:text-theme-1"
          render={<Link href={`/dashboard/projects/${projectId}/tasks`} />}
        >
          View all
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClipboardList className="size-5" />
          </div>
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {canManageTasks
              ? "Create the first task to get the team moving."
              : "Tasks will appear here once they're added."}
          </p>
          {canManageTasks ? (
            <Button
              size="sm"
              nativeButton={false}
              className="mt-2 h-8 gap-1 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
              render={<Link href={`/dashboard/projects/${projectId}/tasks`} />}
            >
              <Plus className="size-3.5" />
              Add task
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {tasks.map((task) => (
            <RecentTaskRow key={task.id} task={task} projectId={projectId} />
          ))}
        </ul>
      )}

      {tasks.length > 0 && totalTasks > tasks.length ? (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-2.5 text-center text-[11px] text-muted-foreground">
          +{totalTasks - tasks.length} more on the tasks board
        </div>
      ) : null}
    </div>
  );
}

function RecentTaskRow({
  task,
  projectId,
}: {
  task: TaskListItem;
  projectId: string;
}) {
  const dueLabel = formatLongDate(task.dueDate);
  const overdue =
    task.status !== "done" &&
    task.dueDate &&
    (daysBetween(new Date().toISOString(), task.dueDate) ?? 1) < 0;
  const StatusIcon =
    task.status === "done"
      ? CheckCircle2
      : task.status === "in_review"
        ? Eye
        : task.status === "in_progress"
          ? Activity
          : ClipboardList;

  return (
    <li>
      <Link
        href={`/dashboard/projects/${projectId}/tasks`}
        className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
      >
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${TASK_STATUS_PILL[task.status]}`}
        >
          <StatusIcon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium group-hover:text-theme-3 dark:group-hover:text-theme-1">
              {task.title}
            </span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_PILL[task.priority]}`}
            >
              {TASK_PRIORITY_LABELS[task.priority]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${TASK_STATUS_PILL[task.status]}`}
            >
              {TASK_STATUS_LABELS[task.status]}
            </span>
            <span className="opacity-50">·</span>
            <span>Updated {formatRelative(task.updatedAt)}</span>
            {dueLabel ? (
              <>
                <span className="opacity-50">·</span>
                <span
                  className={`inline-flex items-center gap-1 ${overdue ? "text-rose-600 dark:text-rose-400" : ""}`}
                >
                  <CalendarClock className="size-3" />
                  {dueLabel}
                </span>
              </>
            ) : null}
          </div>
        </div>
        {task.assignee ? (
          <Avatar
            className="size-7 shrink-0 ring-2 ring-card"
            title={task.assignee.name || task.assignee.email}
          >
            <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[10px] font-semibold text-theme-3 dark:text-theme-1">
              {initialsOf(task.assignee.name || task.assignee.email)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">
            Unassigned
          </span>
        )}
      </Link>
    </li>
  );
}

function TimelineCard({
  startDate,
  dueDate,
  elapsedPct,
  dueDays,
}: {
  startDate: string;
  dueDate: string;
  elapsedPct: number | null;
  dueDays: number | null;
}) {
  const startLabel = formatLongDate(startDate) || "Not set";
  const dueLabel = formatLongDate(dueDate) || "Not set";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/30 to-orange-500/20 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
          <CalendarDays className="size-4" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold">Timeline</h2>
          <p className="text-xs text-muted-foreground">
            {dueDays === null
              ? "Add a due date to track progress"
              : dueDays < 0
                ? `${Math.abs(dueDays)} ${Math.abs(dueDays) === 1 ? "day" : "days"} past due`
                : dueDays === 0
                  ? "Due today"
                  : `${dueDays} ${dueDays === 1 ? "day" : "days"} remaining`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
            Start
          </span>
          <span className="font-medium">{startLabel}</span>
        </div>
        <div className="flex-1 px-1">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
            {elapsedPct !== null ? (
              <div
                className="h-full rounded-full bg-linear-to-r from-theme-1 to-theme-3 shadow-sm shadow-theme-2/40"
                style={{ width: `${elapsedPct}%` }}
              />
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
            Due
          </span>
          <span
            className={`font-medium ${dueDays !== null && dueDays < 0 ? "text-rose-600 dark:text-rose-400" : ""}`}
          >
            {dueLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function TeamCard({
  projectId,
  assignees,
  members,
}: {
  projectId: string;
  assignees: ProjectListItem["assignees"];
  members: ProjectListItem["members"];
}) {
  const visibleManagers = assignees.slice(0, 3);
  const overflowManagers = assignees.length - visibleManagers.length;
  const visibleMembers = members.slice(0, 5);
  const overflowMembers = members.length - visibleMembers.length;

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Users className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Team</h2>
            <p className="text-xs text-muted-foreground">
              {assignees.length + members.length === 0
                ? "No one assigned yet"
                : `${assignees.length} ${assignees.length === 1 ? "manager" : "managers"} · ${members.length} ${members.length === 1 ? "member" : "members"}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href={`/dashboard/projects/${projectId}/team`} />}
        >
          Manage
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        <TeamGroup
          title="Managers"
          empty="No manager assigned"
          people={visibleManagers}
          overflow={overflowManagers}
        />
        <TeamGroup
          title="Members"
          empty="No members yet"
          people={visibleMembers}
          overflow={overflowMembers}
        />
      </div>
    </div>
  );
}

function TeamGroup({
  title,
  empty,
  people,
  overflow,
}: {
  title: string;
  empty: string;
  people: { id: string; name: string; email: string }[];
  overflow: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/80 uppercase">
        {title}
      </span>
      {people.length === 0 ? (
        <p className="text-xs italic text-muted-foreground/70">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {people.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/40"
            >
              <Avatar className="size-7" title={p.name || p.email}>
                <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[10px] font-semibold text-theme-3 dark:text-theme-1">
                  {initialsOf(p.name || p.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-xs font-medium">
                  {p.name || p.email.split("@")[0]}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {p.email}
                </span>
              </div>
            </li>
          ))}
          {overflow > 0 ? (
            <li className="text-[11px] text-muted-foreground">
              +{overflow} more
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function DescriptionCard({
  description,
  client,
  createdAt,
  updatedAt,
}: {
  description: string;
  client: ProjectListItem["client"];
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5 lg:col-span-2">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
          <FileText className="size-4" />
        </div>
        <h2 className="font-heading text-sm font-semibold">About this project</h2>
      </div>

      <div className="mt-4">
        {description ? (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/70">
            No description yet — add one in project settings.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        {client ? (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5 opacity-70" />
            <span className="font-medium text-foreground">
              {client.company || client.name}
            </span>
            {client.company && client.name ? (
              <span className="opacity-70">· {client.name}</span>
            ) : null}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5 opacity-70" />
          Created {formatLongDate(createdAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 opacity-70" />
          Updated {formatRelative(updatedAt)}
        </span>
      </div>
    </div>
  );
}

function ResourcesPanel({
  projectId,
  resources,
  totalResources,
}: {
  projectId: string;
  resources: ResourceListItem[];
  totalResources: number;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/30 to-orange-500/20 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <FolderArchive className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Resources</h2>
            <p className="text-xs text-muted-foreground">
              {totalResources === 0
                ? "Nothing shared yet"
                : `${totalResources} ${totalResources === 1 ? "item" : "items"}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href={`/dashboard/projects/${projectId}/resources`} />}
        >
          Open
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {resources.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderArchive className="size-5" />
          </div>
          <p className="text-sm font-medium">No resources yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Share files and links the team needs to ship this project.
          </p>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="mt-1 h-8 gap-1 text-xs"
            render={<Link href={`/dashboard/projects/${projectId}/resources`} />}
          >
            <Plus className="size-3.5" />
            Add resource
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {resources.map((r) => (
            <ResourceRow key={r.id} resource={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ResourceRow({ resource }: { resource: ResourceListItem }) {
  const Icon = resource.kind === "file" ? FileText : LinkIcon;
  const sizeLabel =
    resource.kind === "file" && resource.sizeBytes
      ? formatBytes(resource.sizeBytes)
      : "";
  return (
    <li>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
      >
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${
            resource.kind === "file"
              ? "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300"
              : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium group-hover:text-theme-3 dark:group-hover:text-theme-1">
            {resource.title}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {resource.kind === "file"
              ? [resource.fileName, sizeLabel].filter(Boolean).join(" · ") ||
                "File"
              : resource.url}
          </span>
        </div>
        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
          {formatRelative(resource.createdAt)}
        </span>
      </a>
    </li>
  );
}
