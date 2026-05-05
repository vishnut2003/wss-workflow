import {
  ArrowUpRight,
  ArrowDownRight,
  FolderKanban,
  ListTodo,
  Users,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  CircleDot,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner name={name} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Projects"
          value="12"
          delta="+2"
          trend="up"
          icon={FolderKanban}
          accent="from-theme-1 to-theme-3"
        />
        <StatCard
          label="Open Tasks"
          value="48"
          delta="+8"
          trend="up"
          icon={ListTodo}
          accent="from-sky-400 to-blue-600"
        />
        <StatCard
          label="Team Members"
          value="24"
          delta="+1"
          trend="up"
          icon={Users}
          accent="from-violet-400 to-purple-600"
        />
        <StatCard
          label="Completion Rate"
          value="87%"
          delta="-3%"
          trend="down"
          icon={TrendingUp}
          accent="from-amber-400 to-orange-600"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RecentActivity />
        <ProjectsPanel />
      </section>
    </div>
  );
}

function HeroBanner({ name }: { name: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 p-6 text-white shadow-lg shadow-theme-3/20 sm:p-8">
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
        className="absolute -top-20 -right-10 size-72 rounded-full bg-white/15 blur-3xl"
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

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium tracking-wide ring-1 ring-white/25 backdrop-blur-md">
            <Sparkles className="size-3" />
            <span>You have 3 tasks due today</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {name}!
          </h1>
          <p className="max-w-md text-sm text-white/85">
            Here&apos;s what&apos;s happening across your workspace today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-9 bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/25"
          >
            View Reports
          </Button>
          <Button className="h-9 bg-white text-theme-3 hover:bg-white/90">
            <Plus />
            New Project
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-theme-3/10">
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 size-32 rounded-full bg-linear-to-br ${accent} opacity-15 blur-2xl transition-opacity group-hover:opacity-25`}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md shadow-black/10 ring-1 ring-white/20`}
        >
          <Icon className="size-5" />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            trend === "up"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {delta}
        </span>
      </div>
      <div className="relative mt-4 flex flex-col gap-0.5">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

const activityItems = [
  {
    title: "Q2 Marketing Campaign",
    sub: "Sarah Chen completed 3 tasks",
    time: "12m ago",
    status: "done" as const,
    avatar: "SC",
  },
  {
    title: "Client Onboarding Flow",
    sub: "Updated by Marcus Lee",
    time: "1h ago",
    status: "progress" as const,
    avatar: "ML",
  },
  {
    title: "Website Redesign",
    sub: "New comment from Priya R.",
    time: "3h ago",
    status: "open" as const,
    avatar: "PR",
  },
  {
    title: "Product Launch — Phase 2",
    sub: "Deadline moved to Friday",
    time: "Yesterday",
    status: "progress" as const,
    avatar: "JD",
  },
  {
    title: "Internal Audit",
    sub: "Tom Brooks closed the issue",
    time: "Yesterday",
    status: "done" as const,
    avatar: "TB",
  },
];

function RecentActivity() {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5 xl:col-span-2">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">
            Updates from across your workspace
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-theme-3 hover:text-theme-2">
          View all
        </Button>
      </div>
      <ul className="divide-y divide-border/60">
        {activityItems.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-linear-to-br from-theme-1/30 to-theme-3/30 text-xs font-semibold text-theme-3">
                {item.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{item.title}</span>
              <span className="truncate text-xs text-muted-foreground">{item.sub}</span>
            </div>
            <StatusPill status={item.status} />
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {item.time}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="More"
              className="text-muted-foreground"
            >
              <MoreHorizontal />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({ status }: { status: "done" | "progress" | "open" }) {
  const map = {
    done: {
      label: "Done",
      icon: CheckCircle2,
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    progress: {
      label: "In progress",
      icon: Clock,
      cls: "bg-theme-1/15 text-theme-3 dark:text-theme-1",
    },
    open: {
      label: "Open",
      icon: CircleDot,
      cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  } as const;
  const { label, icon: Icon, cls } = map[status];
  return (
    <span
      className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium md:inline-flex ${cls}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

const projects = [
  { name: "Brand Refresh", progress: 82, members: 5, due: "Aug 24" },
  { name: "Mobile App v2", progress: 64, members: 8, due: "Sep 12" },
  { name: "Sales Dashboard", progress: 41, members: 3, due: "Sep 30" },
  { name: "Content System", progress: 27, members: 4, due: "Oct 14" },
];

function ProjectsPanel() {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold">Active Projects</h2>
          <p className="text-xs text-muted-foreground">Progress this week</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="New project">
          <Plus />
        </Button>
      </div>
      <ul className="flex flex-col divide-y divide-border/60">
        {projects.map((p) => (
          <li key={p.name} className="flex flex-col gap-2 px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium">{p.name}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-theme-3">
                {p.progress}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-theme-1 to-theme-3 shadow-sm shadow-theme-2/40"
                style={{ width: `${p.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{p.members} members</span>
              <span>Due {p.due}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
