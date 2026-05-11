"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Search,
  Users,
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
  PROJECT_STATUSES,
  type ProjectListItem,
  type ProjectStatus,
} from "@/lib/projects/types";

const PAGE_SIZE = 12;

type StatusFilter = "all" | ProjectStatus;

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_CHIP_ACTIVE: Record<ProjectStatus, string> = {
  planned: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  in_progress:
    "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  on_hold:
    "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  completed:
    "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
  archived:
    "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300",
};

const STATUS_BADGE: Record<ProjectStatus, string> = {
  planned: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  in_progress:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  on_hold:
    "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  completed:
    "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  archived:
    "bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300",
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
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function countByStatus(
  projects: ProjectListItem[]
): Record<ProjectStatus, number> {
  const counts: Record<ProjectStatus, number> = {
    planned: 0,
    in_progress: 0,
    on_hold: 0,
    completed: 0,
    archived: 0,
  };
  for (const p of projects) counts[p.status] += 1;
  return counts;
}

export function ProjectsGrid({
  projects,
  canManage,
  scope,
  title,
  emptyTitle,
  emptyDescription,
}: {
  projects: ProjectListItem[];
  canManage: boolean;
  scope: "all" | "mine";
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const totalCounts = useMemo(() => countByStatus(projects), [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      const haystack =
        `${p.name} ${p.description} ${p.client?.name ?? ""} ${p.client?.company ?? ""} ${p.assignees
          .map((a) => `${a.name} ${a.email}`)
          .join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };
  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const effectivePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (effectivePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filtered.length);

  const isFiltering = query.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-linear-to-br from-theme-1/8 via-card to-card px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/20 ring-1 ring-theme-1/20">
              <FolderKanban className="size-4 text-theme-3 dark:text-theme-1" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-heading text-sm font-semibold leading-tight">
                {title ?? (scope === "all" ? "All projects" : "Your projects")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isFiltering
                  ? `${filtered.length} of ${projects.length} ${projects.length === 1 ? "project" : "projects"}`
                  : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
              </p>
            </div>
          </div>

          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name, client, assignee..."
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              aria-label="Search projects"
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => updateQuery("")}
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
            active={statusFilter === "all"}
            onClick={() => updateStatusFilter("all")}
            label="All"
            count={projects.length}
            activeClass="bg-foreground/10 text-foreground ring-foreground/20"
          />
          {PROJECT_STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={statusFilter === status}
              onClick={() =>
                updateStatusFilter(statusFilter === status ? "all" : status)
              }
              label={STATUS_LABEL[status]}
              count={totalCounts[status]}
              activeClass={STATUS_CHIP_ACTIVE[status]}
              disabled={totalCounts[status] === 0}
            />
          ))}
          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => {
                updateQuery("");
                updateStatusFilter("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? "No projects yet"}
          description={
            emptyDescription ??
            (canManage
              ? "Create your first project to get started."
              : scope === "mine"
                ? "You haven't been assigned to any projects yet."
                : "There are no projects yet.")
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description={
            query.trim()
              ? `No projects match "${query.trim()}"${statusFilter !== "all" ? ` in ${STATUS_LABEL[statusFilter]}` : ""}.`
              : `No ${STATUS_LABEL[statusFilter as ProjectStatus]} projects yet.`
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateQuery("");
                updateStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {showingFrom}–{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {filtered.length}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2"
                  onClick={() => setPage(Math.max(1, effectivePage - 1))}
                  disabled={effectivePage === 1}
                >
                  <ChevronLeft className="size-3.5" />
                  Prev
                </Button>
                <span className="px-2 text-xs tabular-nums text-muted-foreground">
                  {effectivePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2"
                  onClick={() =>
                    setPage(Math.min(totalPages, effectivePage + 1))
                  }
                  disabled={effectivePage === totalPages}
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  const visibleAssignees = project.assignees.slice(0, 3);
  const overflow = project.assignees.length - visibleAssignees.length;
  const dueLabel = formatShortDate(project.dueDate);
  const href = `/dashboard/projects/${project.id}`;

  return (
    <article className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-4 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-theme-1/40 hover:shadow-md hover:shadow-theme-2/10 focus-within:-translate-y-0.5 focus-within:border-theme-1/40 focus-within:shadow-md focus-within:shadow-theme-2/10">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-theme-1 via-theme-2 to-theme-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />

      <Button
        size="sm"
        nativeButton={false}
        aria-label={`Open ${project.name}`}
        className="absolute top-3 right-3 z-10 h-7 gap-1 bg-linear-to-br from-theme-1 to-theme-3 px-2 text-[11px] text-white opacity-0 shadow-md shadow-theme-2/30 ring-1 ring-white/20 transition-opacity hover:brightness-105 group-hover:opacity-100 group-focus-within:opacity-100"
        render={<Link href={href} />}
      >
        Open
        <ArrowRight className="size-3" />
      </Button>

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
            <FolderKanban className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col">
            <Link
              href={href}
              className="line-clamp-1 font-heading text-sm font-semibold leading-tight outline-none transition-colors hover:text-theme-3 focus-visible:text-theme-3 dark:hover:text-theme-1 dark:focus-visible:text-theme-1"
              title={project.name}
            >
              {project.name}
            </Link>
            {project.client ? (
              <span
                className="mt-0.5 inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground"
                title={
                  project.client.company
                    ? `${project.client.name} · ${project.client.company}`
                    : project.client.name
                }
              >
                <Building2 className="size-3 shrink-0 opacity-60" />
                <span className="truncate">
                  {project.client.company || project.client.name}
                </span>
              </span>
            ) : (
              <span className="mt-0.5 text-[11px] text-muted-foreground/70">
                No client
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.description ? (
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {project.description}
        </p>
      ) : (
        <p className="text-xs italic text-muted-foreground/60">
          No description
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1">
          {project.assignees.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
              <Users className="size-3 opacity-60" />
              Unassigned
            </span>
          ) : (
            <div className="flex -space-x-1.5">
              {visibleAssignees.map((a) => (
                <Avatar
                  key={a.id}
                  className="size-6 ring-2 ring-card"
                  title={a.name || a.email}
                >
                  <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[10px] font-semibold text-theme-3 dark:text-theme-1">
                    {initialsOf(a.name || a.email)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {overflow > 0 ? (
                <span
                  className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card"
                  title={project.assignees
                    .slice(3)
                    .map((a) => a.name || a.email)
                    .join(", ")}
                >
                  +{overflow}
                </span>
              ) : null}
            </div>
          )}
        </div>
        {dueLabel ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground"
            title={`Due ${dueLabel}`}
          >
            <CalendarIcon className="size-3 opacity-60" />
            {dueLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  activeClass,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
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
        <FolderKanban className="size-6 text-theme-3 dark:text-theme-1" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
