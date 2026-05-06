import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Crown,
  Eye,
  FolderKanban,
  Inbox,
  ListChecks,
  MessageSquarePlus,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { hasAtLeast, type Role } from "@/lib/auth/roles";
import {
  listAllProjects,
  listProjectsForUser,
} from "@/lib/models/project";
import { listTasksForProject } from "@/lib/models/task";
import {
  findUserById,
  listMembers,
  listMembersForManager,
} from "@/lib/models/user";
import { listClients } from "@/lib/models/client";
import { listFeedback } from "@/lib/models/feedback";
import type { ProjectListItem, ProjectStatus } from "@/lib/projects/types";
import type {
  TaskListItem,
  TaskPriority,
  TaskStatus,
} from "@/lib/tasks/types";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/tasks/types";

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  super_admin: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  member: UserCheck,
};

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const PROJECT_STATUS_PILL: Record<ProjectStatus, string> = {
  planned: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  in_progress:
    "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  on_hold:
    "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  completed:
    "bg-violet-500/15 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  archived:
    "bg-slate-500/15 text-slate-700 ring-slate-500/25 dark:text-slate-300",
};

const TASK_STATUS_PILL: Record<TaskStatus, string> = {
  todo: "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  in_progress:
    "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  in_review:
    "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  done: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
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

function formatShortDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
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
  return formatShortDate(iso);
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

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Working late";
}

function pickHighlightTask(tasks: TaskListItem[]): TaskListItem | null {
  const open = tasks.filter((t) => t.status !== "done");
  if (open.length === 0) return null;
  const overdue = open
    .filter((t) => t.dueDate && (daysUntil(t.dueDate) ?? 1) < 0)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  if (overdue.length > 0) return overdue[0];
  const dueSoon = open
    .filter((t) => t.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  if (dueSoon.length > 0) return dueSoon[0];
  const priorityOrder: TaskPriority[] = ["high", "medium", "low"];
  const sorted = [...open].sort(
    (a, b) =>
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );
  return sorted[0] ?? null;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const role = (session.user.role ?? "member") as Role;
  const userId = session.user.id;
  const displayName =
    session.user.name?.trim() ||
    session.user.email?.split("@")[0] ||
    "there";

  const isSuperAdmin = hasAtLeast(role, "super_admin");
  const isAdmin = hasAtLeast(role, "admin");

  const projects = isAdmin
    ? await listAllProjects()
    : await listProjectsForUser(userId);

  const projectIdsLimit = projects.slice(0, 25).map((p) => p.id);
  const tasksPerProject = await Promise.all(
    projectIdsLimit.map((pid) => listTasksForProject(pid))
  );
  const allTasks: TaskListItem[] = tasksPerProject.flat();

  const myTasks = allTasks.filter((t) => t.assignee?.id === userId);

  const projectsActive = projects.filter(
    (p) => p.status === "in_progress"
  ).length;
  const projectsCompleted = projects.filter(
    (p) => p.status === "completed"
  ).length;

  const myOpenTasks = myTasks.filter((t) => t.status !== "done").length;
  const myDoneTasks = myTasks.filter((t) => t.status === "done").length;
  const myOverdueTasks = myTasks.filter(
    (t) =>
      t.status !== "done" &&
      t.dueDate &&
      (daysUntil(t.dueDate) ?? 1) < 0
  ).length;
  const myDueThisWeek = myTasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    const d = daysUntil(t.dueDate);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const totalTasks = allTasks.length;
  const totalDone = allTasks.filter((t) => t.status === "done").length;
  const completionPct =
    totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const [members, clients, feedback, directReports, me] = await Promise.all([
    isAdmin ? listMembers() : Promise.resolve([]),
    isAdmin ? listClients() : Promise.resolve([]),
    isSuperAdmin ? listFeedback() : Promise.resolve([]),
    role === "manager"
      ? listMembersForManager(userId)
      : Promise.resolve([]),
    role === "member" ? findUserById(userId) : Promise.resolve(null),
  ]);

  let managerInfo: { name: string; email: string } | null = null;
  if (role === "member" && me?.managerId) {
    const m = await findUserById(me.managerId.toString());
    if (m) managerInfo = { name: m.name ?? "", email: m.email };
  }

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const recentMyTasks = [...myTasks]
    .sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      const aDone = a.status === "done";
      const bDone = b.status === "done";
      if (aDone !== bDone) return aDone ? 1 : -1;
      return aDue - bDue;
    })
    .slice(0, 5);

  const highlight = pickHighlightTask(myTasks);

  const projectProgress = recentProjects.map((p) => {
    const tlist = tasksPerProject[projects.findIndex((q) => q.id === p.id)] ?? [];
    const done = tlist.filter((t) => t.status === "done").length;
    const total = tlist.length;
    return {
      project: p,
      done,
      total,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        name={displayName}
        role={role}
        highlight={highlight}
        myOverdue={myOverdueTasks}
        myOpenTasks={myOpenTasks}
        myDueThisWeek={myDueThisWeek}
        completionPct={completionPct}
      />

      <StatsGrid
        role={role}
        projectsCount={projects.length}
        projectsActive={projectsActive}
        projectsCompleted={projectsCompleted}
        myOpenTasks={myOpenTasks}
        myDoneTasks={myDoneTasks}
        myOverdueTasks={myOverdueTasks}
        myDueThisWeek={myDueThisWeek}
        totalTasks={totalTasks}
        completionPct={completionPct}
        membersCount={members.length}
        clientsCount={clients.length}
        feedbackCount={feedback.length}
        directReportsCount={directReports.length}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <ProjectsPanel projects={projectProgress} role={role} />
        <RoleSidePanel
          role={role}
          members={members}
          feedback={feedback}
          directReports={directReports}
          managerInfo={managerInfo}
          recentMyTasks={recentMyTasks}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <MyTasksPanel tasks={recentMyTasks} totalOpen={myOpenTasks} />
        <QuickActions role={role} />
      </section>
    </div>
  );
}

function HeroBanner({
  name,
  role,
  highlight,
  myOverdue,
  myOpenTasks,
  myDueThisWeek,
  completionPct,
}: {
  name: string;
  role: Role;
  highlight: TaskListItem | null;
  myOverdue: number;
  myOpenTasks: number;
  myDueThisWeek: number;
  completionPct: number;
}) {
  const RoleIcon = ROLE_ICON[role];
  const roleSubtitle: Record<Role, string> = {
    super_admin:
      "You have full visibility across the workspace. Here's what's moving today.",
    admin:
      "Keep projects on track and the team aligned. Here's the workspace pulse.",
    manager:
      "Coach the team, unblock work, ship outcomes. Here's your snapshot.",
    member: "Focus on what matters today. Here's what needs your attention.",
  };

  const tagline =
    myOverdue > 0
      ? `${myOverdue} overdue ${myOverdue === 1 ? "task needs" : "tasks need"} your attention`
      : myDueThisWeek > 0
        ? `${myDueThisWeek} ${myDueThisWeek === 1 ? "task" : "tasks"} due this week`
        : myOpenTasks > 0
          ? `${myOpenTasks} open ${myOpenTasks === 1 ? "task" : "tasks"} on your plate`
          : completionPct === 100
            ? "All caught up — nice work"
            : "Nothing urgent — pick the next thing to ship";

  const tagTone =
    myOverdue > 0
      ? "bg-rose-500/25 text-rose-50 ring-rose-200/50"
      : myDueThisWeek > 0
        ? "bg-amber-500/25 text-amber-50 ring-amber-200/50"
        : "bg-white/15 text-white ring-white/25";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 p-6 text-white shadow-lg shadow-theme-3/25 sm:p-8">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.45) 0, transparent 42%), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.32) 0, transparent 48%)",
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-white/30 backdrop-blur-md">
                <RoleIcon className="size-3" />
                {ROLE_LABEL[role]}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ring-1 ${tagTone}`}
              >
                <Sparkles className="size-3" />
                {tagline}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {timeOfDayGreeting()}, {name}!
              </h1>
              <p className="max-w-2xl text-sm text-white/85">
                {roleSubtitle[role]}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              nativeButton={false}
              className="h-9 bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md hover:bg-white/25"
              render={<Link href="/dashboard/projects" />}
            >
              <FolderKanban className="size-4" />
              Projects
            </Button>
            {hasAtLeast(role, "admin") ? (
              <Button
                size="sm"
                nativeButton={false}
                className="h-9 bg-white text-theme-3 ring-1 ring-white/40 hover:bg-white/90"
                render={<Link href="/dashboard/projects" />}
              >
                <Plus className="size-4" />
                New project
              </Button>
            ) : null}
          </div>
        </div>

        {highlight ? (
          <Link
            href={`/dashboard/projects/${highlight.projectId}/tasks`}
            className="group relative flex flex-col gap-2 rounded-xl bg-white/10 p-4 ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/15 sm:flex-row sm:items-center"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
              <Star className="size-5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold tracking-[0.18em] text-white/80 uppercase">
                Up next for you
              </span>
              <span className="truncate text-sm font-semibold">
                {highlight.title}
              </span>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/85">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-medium ring-1 ring-white/20">
                  {TASK_STATUS_LABELS[highlight.status]}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-medium ring-1 ring-white/20">
                  {TASK_PRIORITY_LABELS[highlight.priority]} priority
                </span>
                {highlight.dueDate ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" />
                    {(() => {
                      const d = daysUntil(highlight.dueDate);
                      if (d === null) return formatShortDate(highlight.dueDate);
                      if (d < 0) return `${Math.abs(d)}d overdue`;
                      if (d === 0) return "Due today";
                      return `Due in ${d}d`;
                    })()}
                  </span>
                ) : null}
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function StatsGrid({
  role,
  projectsCount,
  projectsActive,
  projectsCompleted,
  myOpenTasks,
  myDoneTasks,
  myOverdueTasks,
  myDueThisWeek,
  totalTasks,
  completionPct,
  membersCount,
  clientsCount,
  feedbackCount,
  directReportsCount,
}: {
  role: Role;
  projectsCount: number;
  projectsActive: number;
  projectsCompleted: number;
  myOpenTasks: number;
  myDoneTasks: number;
  myOverdueTasks: number;
  myDueThisWeek: number;
  totalTasks: number;
  completionPct: number;
  membersCount: number;
  clientsCount: number;
  feedbackCount: number;
  directReportsCount: number;
}) {
  const cards: Array<{
    label: string;
    value: string;
    hint: string;
    hintTone?: "default" | "warn";
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }> = [];

  if (role === "super_admin" || role === "admin") {
    cards.push(
      {
        label: "Projects",
        value: String(projectsCount),
        hint:
          projectsActive > 0
            ? `${projectsActive} active`
            : projectsCompleted > 0
              ? `${projectsCompleted} completed`
              : "Get started",
        icon: FolderKanban,
        accent: "from-theme-1 to-theme-3",
      },
      {
        label: "Workspace tasks",
        value: String(totalTasks),
        hint:
          completionPct === 0 && totalTasks === 0
            ? "Nothing yet"
            : `${completionPct}% done`,
        icon: ListChecks,
        accent: "from-sky-400 to-blue-600",
      },
      {
        label: "Team members",
        value: String(membersCount),
        hint:
          membersCount === 0
            ? "Invite someone"
            : `${membersCount} ${membersCount === 1 ? "person" : "people"}`,
        icon: Users,
        accent: "from-violet-400 to-fuchsia-500",
      },
      {
        label: "Clients",
        value: String(clientsCount),
        hint: clientsCount === 0 ? "Add your first" : "Active relationships",
        icon: Building2,
        accent: "from-amber-400 to-orange-500",
      }
    );
  } else if (role === "manager") {
    cards.push(
      {
        label: "My projects",
        value: String(projectsCount),
        hint:
          projectsActive > 0 ? `${projectsActive} active` : "Nothing active",
        icon: FolderKanban,
        accent: "from-theme-1 to-theme-3",
      },
      {
        label: "My open tasks",
        value: String(myOpenTasks),
        hint:
          myOverdueTasks > 0
            ? `${myOverdueTasks} overdue`
            : myDueThisWeek > 0
              ? `${myDueThisWeek} due this week`
              : "On track",
        hintTone: myOverdueTasks > 0 ? "warn" : "default",
        icon: ClipboardList,
        accent: "from-sky-400 to-blue-600",
      },
      {
        label: "My team",
        value: String(directReportsCount),
        hint:
          directReportsCount === 0
            ? "No reports yet"
            : `${directReportsCount} direct ${directReportsCount === 1 ? "report" : "reports"}`,
        icon: UserCog,
        accent: "from-violet-400 to-fuchsia-500",
      },
      {
        label: "Completion",
        value: `${completionPct}%`,
        hint: `${myDoneTasks} done by me`,
        icon: TrendingUp,
        accent: "from-emerald-400 to-teal-600",
      }
    );
  } else {
    cards.push(
      {
        label: "My projects",
        value: String(projectsCount),
        hint:
          projectsActive > 0 ? `${projectsActive} active` : "Standing by",
        icon: FolderKanban,
        accent: "from-theme-1 to-theme-3",
      },
      {
        label: "Open tasks",
        value: String(myOpenTasks),
        hint:
          myOverdueTasks > 0
            ? `${myOverdueTasks} overdue`
            : myDueThisWeek > 0
              ? `${myDueThisWeek} due this week`
              : "On track",
        hintTone: myOverdueTasks > 0 ? "warn" : "default",
        icon: ClipboardList,
        accent: "from-sky-400 to-blue-600",
      },
      {
        label: "Tasks completed",
        value: String(myDoneTasks),
        hint:
          myDoneTasks === 0
            ? "Ship something"
            : `${completionPct}% workspace done`,
        icon: CheckCircle2,
        accent: "from-emerald-400 to-teal-600",
      },
      {
        label: "Due this week",
        value: String(myDueThisWeek),
        hint:
          myDueThisWeek === 0
            ? "Clear runway"
            : "Plan your week",
        icon: CalendarClock,
        accent: "from-amber-400 to-orange-500",
      }
    );
  }

  if (role === "super_admin") {
    cards[3] = {
      label: "Feedback inbox",
      value: String(feedbackCount),
      hint: feedbackCount === 0 ? "All clear" : "Review when free",
      icon: Inbox,
      accent: "from-amber-400 to-orange-500",
    };
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </section>
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
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function ProjectsPanel({
  projects,
  role,
}: {
  projects: {
    project: ProjectListItem;
    done: number;
    total: number;
    pct: number;
  }[];
  role: Role;
}) {
  const isAdmin = hasAtLeast(role, "admin");
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5 xl:col-span-2">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
            <FolderKanban className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">
              {isAdmin ? "Active projects" : "Your projects"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {projects.length === 0
                ? "Nothing here yet"
                : "Recent progress at a glance"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-theme-3 hover:text-theme-2 dark:text-theme-1"
          render={<Link href="/dashboard/projects" />}
        >
          View all
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderKanban className="size-5" />
          </div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {isAdmin
              ? "Spin up a project to get the team moving."
              : "You'll see projects here once you're added to one."}
          </p>
          {isAdmin ? (
            <Button
              size="sm"
              nativeButton={false}
              className="mt-2 h-8 gap-1 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
              render={<Link href="/dashboard/projects" />}
            >
              <Plus className="size-3.5" />
              New project
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {projects.map(({ project, done, total, pct }) => {
            const dueDays = project.dueDate ? daysUntil(project.dueDate) : null;
            const dueTone =
              dueDays === null
                ? "muted"
                : dueDays < 0
                  ? "rose"
                  : dueDays <= 7
                    ? "amber"
                    : "muted";
            return (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="group flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
                      <FolderKanban className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold group-hover:text-theme-3 dark:group-hover:text-theme-1">
                        {project.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${PROJECT_STATUS_PILL[project.status]}`}
                        >
                          {PROJECT_STATUS_LABEL[project.status]}
                        </span>
                        {project.client ? (
                          <>
                            <span className="opacity-50">·</span>
                            <span className="inline-flex items-center gap-1 truncate">
                              <Building2 className="size-3 opacity-60" />
                              {project.client.company || project.client.name}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-theme-3 dark:text-theme-1">
                        {pct}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {done}/{total} tasks
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-12">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/70">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-theme-1 to-theme-3 shadow-sm shadow-theme-2/40 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {project.dueDate ? (
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 text-[10px] tabular-nums ${
                          dueTone === "rose"
                            ? "text-rose-600 dark:text-rose-400"
                            : dueTone === "amber"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        <CalendarClock className="size-3" />
                        {dueDays !== null && dueDays < 0
                          ? `${Math.abs(dueDays)}d late`
                          : dueDays === 0
                            ? "Due today"
                            : formatShortDate(project.dueDate)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RoleSidePanel({
  role,
  members,
  feedback,
  directReports,
  managerInfo,
  recentMyTasks,
}: {
  role: Role;
  members: Awaited<ReturnType<typeof listMembers>>;
  feedback: Awaited<ReturnType<typeof listFeedback>>;
  directReports: Awaited<ReturnType<typeof listMembersForManager>>;
  managerInfo: { name: string; email: string } | null;
  recentMyTasks: TaskListItem[];
}) {
  if (role === "super_admin") {
    return <FeedbackPanel feedback={feedback.slice(0, 5)} />;
  }
  if (role === "admin") {
    return <RecentMembersPanel members={members.slice(0, 6)} />;
  }
  if (role === "manager") {
    return <MyTeamPanel team={directReports.slice(0, 6)} />;
  }
  return (
    <ManagerInfoPanel
      managerInfo={managerInfo}
      tasksCount={recentMyTasks.length}
    />
  );
}

function FeedbackPanel({
  feedback,
}: {
  feedback: Awaited<ReturnType<typeof listFeedback>>;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/30 to-orange-500/20 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <Inbox className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Feedback</h2>
            <p className="text-xs text-muted-foreground">
              {feedback.length === 0
                ? "Inbox is clear"
                : `${feedback.length} ${feedback.length === 1 ? "message" : "messages"}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href="/dashboard/feedback/view" />}
        >
          Open
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
      {feedback.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquarePlus className="size-5" />
          </div>
          <p className="text-sm font-medium">No feedback yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            When teammates send feedback, it lands here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {feedback.map((f) => (
            <li
              key={f.id}
              className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-linear-to-br from-amber-400/40 to-orange-500/30 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  {initialsOf(f.userName || f.userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {f.subject}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {f.userName || f.userEmail} · {formatRelative(f.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentMembersPanel({
  members,
}: {
  members: Awaited<ReturnType<typeof listMembers>>;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Users className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Members</h2>
            <p className="text-xs text-muted-foreground">
              {members.length === 0 ? "Invite the team" : "Recently added"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href="/dashboard/members" />}
        >
          Manage
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-5" />
          </div>
          <p className="text-sm font-medium">No members yet</p>
          <Button
            size="sm"
            nativeButton={false}
            className="mt-2 h-8 gap-1 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
            render={<Link href="/dashboard/members" />}
          >
            <Plus className="size-3.5" />
            Add member
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[10px] font-semibold text-theme-3 dark:text-theme-1">
                  {initialsOf(m.name || m.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {m.name || m.email.split("@")[0]}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {m.email}
                </span>
              </div>
              <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize sm:inline">
                {m.role.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MyTeamPanel({
  team,
}: {
  team: Awaited<ReturnType<typeof listMembersForManager>>;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
            <UserCog className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">My team</h2>
            <p className="text-xs text-muted-foreground">
              {team.length === 0
                ? "No reports yet"
                : `${team.length} direct ${team.length === 1 ? "report" : "reports"}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href="/dashboard/team" />}
        >
          View team
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
      {team.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-5" />
          </div>
          <p className="text-sm font-medium">No team members yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            An admin can assign team members to you from Members.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {team.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
            >
              <Avatar className="size-9 shrink-0 ring-2 ring-card">
                <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[10px] font-semibold text-theme-3 dark:text-theme-1">
                  {initialsOf(m.name || m.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {m.name || m.email.split("@")[0]}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {m.email}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ManagerInfoPanel({
  managerInfo,
  tasksCount,
}: {
  managerInfo: { name: string; email: string } | null;
  tasksCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
          <UserCog className="size-4" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold">Your manager</h2>
          <p className="text-xs text-muted-foreground">
            Reach out anytime you need a hand
          </p>
        </div>
      </div>
      {managerInfo ? (
        <div className="flex items-center gap-3 rounded-lg bg-linear-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-3 ring-1 ring-violet-500/15">
          <Avatar className="size-10 shrink-0 ring-2 ring-card">
            <AvatarFallback className="bg-linear-to-br from-violet-400/40 to-fuchsia-500/30 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
              {initialsOf(managerInfo.name || managerInfo.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">
              {managerInfo.name || managerInfo.email.split("@")[0]}
            </span>
            <a
              href={`mailto:${managerInfo.email}`}
              className="truncate text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {managerInfo.email}
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          No manager assigned yet. An admin will assign one shortly.
        </div>
      )}

      <div className="rounded-lg bg-linear-to-br from-theme-1/10 to-theme-3/5 p-3 ring-1 ring-theme-1/15">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Rocket className="size-3.5 text-theme-3 dark:text-theme-1" />
          <span>
            {tasksCount === 0
              ? "Pick a project to dive into."
              : `${tasksCount} ${tasksCount === 1 ? "task is" : "tasks are"} on your radar.`}
          </span>
        </div>
      </div>
    </div>
  );
}

function MyTasksPanel({
  tasks,
  totalOpen,
}: {
  tasks: TaskListItem[];
  totalOpen: number;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-400/30 to-cyan-500/20 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300">
            <ListChecks className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">My tasks</h2>
            <p className="text-xs text-muted-foreground">
              {tasks.length === 0
                ? "No tasks assigned to you"
                : `${totalOpen} open · sorted by due date`}
            </p>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClipboardList className="size-5" />
          </div>
          <p className="text-sm font-medium">Nothing on your plate</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            New tasks assigned to you will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {tasks.map((t) => {
            const dueDays = t.dueDate ? daysUntil(t.dueDate) : null;
            const overdue =
              t.status !== "done" && dueDays !== null && dueDays < 0;
            const StatusIcon =
              t.status === "done"
                ? CheckCircle2
                : t.status === "in_review"
                  ? Eye
                  : t.status === "in_progress"
                    ? Activity
                    : ClipboardList;
            return (
              <li key={t.id}>
                <Link
                  href={`/dashboard/projects/${t.projectId}/tasks`}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${TASK_STATUS_PILL[t.status]}`}
                  >
                    <StatusIcon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium group-hover:text-theme-3 dark:group-hover:text-theme-1">
                        {t.title}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_PILL[t.priority]}`}
                      >
                        {TASK_PRIORITY_LABELS[t.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${TASK_STATUS_PILL[t.status]}`}
                      >
                        {TASK_STATUS_LABELS[t.status]}
                      </span>
                      {t.dueDate ? (
                        <>
                          <span className="opacity-50">·</span>
                          <span
                            className={`inline-flex items-center gap-1 ${overdue ? "text-rose-600 dark:text-rose-400" : ""}`}
                          >
                            <CalendarClock className="size-3" />
                            {dueDays !== null && dueDays < 0
                              ? `${Math.abs(dueDays)}d overdue`
                              : dueDays === 0
                                ? "Due today"
                                : formatShortDate(t.dueDate)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="opacity-50">·</span>
                          <span className="inline-flex items-center gap-1 opacity-70">
                            <Clock className="size-3" />
                            No due date
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QuickActions({ role }: { role: Role }) {
  const actions: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }> = [];

  if (hasAtLeast(role, "admin")) {
    actions.push({
      title: "New project",
      description: "Spin up the next initiative",
      href: "/dashboard/projects",
      icon: Plus,
      accent: "from-theme-1 to-theme-3",
    });
    actions.push({
      title: "Manage members",
      description: "Add or update teammates",
      href: "/dashboard/members",
      icon: Users,
      accent: "from-violet-400 to-fuchsia-500",
    });
    actions.push({
      title: "Clients",
      description: "Browse client accounts",
      href: "/dashboard/clients",
      icon: Building2,
      accent: "from-amber-400 to-orange-500",
    });
  } else if (role === "manager") {
    actions.push({
      title: "Open projects",
      description: "Jump back to your work",
      href: "/dashboard/projects",
      icon: FolderKanban,
      accent: "from-theme-1 to-theme-3",
    });
    actions.push({
      title: "My team",
      description: "Check in with your reports",
      href: "/dashboard/team",
      icon: UserCog,
      accent: "from-violet-400 to-fuchsia-500",
    });
    actions.push({
      title: "Share feedback",
      description: "Help shape the workspace",
      href: "/dashboard/feedback",
      icon: MessageSquarePlus,
      accent: "from-amber-400 to-orange-500",
    });
  } else {
    actions.push({
      title: "Browse projects",
      description: "See what you're part of",
      href: "/dashboard/projects",
      icon: FolderKanban,
      accent: "from-theme-1 to-theme-3",
    });
    actions.push({
      title: "Help & support",
      description: "Find guides and answers",
      href: "/dashboard/help",
      icon: Sparkles,
      accent: "from-violet-400 to-fuchsia-500",
    });
    actions.push({
      title: "Share feedback",
      description: "Tell us what could be better",
      href: "/dashboard/feedback",
      icon: MessageSquarePlus,
      accent: "from-amber-400 to-orange-500",
    });
  }

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
          <Rocket className="size-4" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold">Quick actions</h2>
          <p className="text-xs text-muted-foreground">
            Jump straight to where you need to go
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.title}>
              <Link
                href={a.href}
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-theme-1/40 hover:shadow-md hover:shadow-theme-2/10"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${a.accent} text-white shadow-md shadow-black/10 ring-1 ring-white/20`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold group-hover:text-theme-3 dark:group-hover:text-theme-1">
                    {a.title}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {a.description}
                  </span>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
