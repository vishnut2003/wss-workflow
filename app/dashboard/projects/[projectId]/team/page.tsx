import { notFound } from "next/navigation";
import { Lock, Users } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { findProjectForUser } from "@/lib/models/project";
import { listMembersForManager } from "@/lib/models/user";

import { ProjectTeamPanel } from "./_components/project-team-panel";
import { ProjectTeamReadOnly } from "./_components/project-team-readonly";

export default async function ProjectTeamPage({
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

  const isAssignedManager =
    session.user.role === "manager" &&
    project.assignees.some((a) => a.id === session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Users className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Project team
            </h1>
            <p className="text-sm text-muted-foreground">
              Members working on{" "}
              <span className="font-medium text-foreground">{project.name}</span>
              .
            </p>
          </div>
        </div>
      </div>

      {isAssignedManager ? (
        <ProjectTeamPanelWithEligible
          projectId={project.id}
          managerId={session.user.id}
          currentMembers={project.members}
        />
      ) : (
        <>
          <ReadOnlyNotice role={session.user.role} />
          <ProjectTeamReadOnly members={project.members} />
        </>
      )}
    </div>
  );
}

async function ProjectTeamPanelWithEligible({
  projectId,
  managerId,
  currentMembers,
}: {
  projectId: string;
  managerId: string;
  currentMembers: { id: string; name: string; email: string; managerId: string | null }[];
}) {
  const eligible = await listMembersForManager(managerId);

  return (
    <ProjectTeamPanel
      projectId={projectId}
      managerId={managerId}
      currentMembers={currentMembers}
      eligible={eligible.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
      }))}
    />
  );
}

function ReadOnlyNotice({ role }: { role: string }) {
  const message =
    role === "manager"
      ? "You're viewing this project's team. Only managers assigned to this project can change its members."
      : role === "admin" || role === "super_admin"
        ? "Admins can view a project's team but cannot change it. Members are managed by the project's assigned manager."
        : "You're viewing the team for this project.";

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
