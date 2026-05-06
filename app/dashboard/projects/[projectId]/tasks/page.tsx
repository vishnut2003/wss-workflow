import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";
import { listTasksForProject } from "@/lib/models/task";

import { AddTaskDialog } from "./_components/add-task-dialog";
import { TaskBoard } from "./_components/task-board";

export default async function ProjectTasksPage({
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

  const tasks = await listTasksForProject(project.id);

  const isAdmin = hasAtLeast(session.user.role, "admin");
  const isAssignedManager =
    session.user.role === "manager" &&
    project.assignees.some((a) => a.id === session.user.id);
  const isManager = isAdmin || isAssignedManager;

  const memberOptions = project.members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-sky-500/8 via-card to-card p-5 shadow-sm ring-1 ring-foreground/5">
        <span
          aria-hidden
          className="absolute -top-16 -right-12 size-44 rounded-full bg-linear-to-br from-sky-400/25 to-cyan-500/15 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-20 -left-10 size-44 rounded-full bg-linear-to-br from-theme-1/15 to-theme-3/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-sky-500/30 ring-1 ring-white/30">
              <ListChecks className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground/80 uppercase">
                Project tasks
              </span>
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
                <span className="bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent dark:from-foreground dark:to-foreground/80">
                  {project.name}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Plan the work, track progress, and keep the team in sync.
              </p>
            </div>
          </div>

          {isManager ? (
            <AddTaskDialog projectId={project.id} members={memberOptions} />
          ) : null}
        </div>
      </div>

      <TaskBoard
        projectId={project.id}
        tasks={tasks}
        members={memberOptions}
        currentUserId={session.user.id}
        isManager={isManager}
      />
    </div>
  );
}
