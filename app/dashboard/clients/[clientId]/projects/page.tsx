import { notFound } from "next/navigation";

import { can, requireCan } from "@/lib/permissions/check";
import {
  findClientListItemForUser,
  listClientsForUser,
} from "@/lib/models/client";
import { listProjectsForClient } from "@/lib/models/project";
import { listManagers } from "@/lib/models/user";

import { AddProjectDialog } from "@/app/dashboard/projects/_components/add-project-dialog";
import { ProjectsGrid } from "@/app/dashboard/projects/_components/projects-grid";

export default async function ClientProjectsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await requireCan("pages.clients");
  const { clientId } = await params;
  const client = await findClientListItemForUser(
    clientId,
    session.user.id,
    session.user.role
  );
  if (!client) notFound();

  const canCreateProject = await can(session.user.role, "projects.create");
  const [projects, clients, managers] = await Promise.all([
    listProjectsForClient(clientId),
    canCreateProject
      ? listClientsForUser(session.user.id, session.user.role)
      : Promise.resolve([]),
    canCreateProject ? listManagers() : Promise.resolve([]),
  ]);

  const clientLabel = client.company || client.name || "this client";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Projects for {clientLabel}.
          </p>
        </div>
        {canCreateProject ? (
          <AddProjectDialog
            clients={clients}
            managers={managers}
            initialClientId={clientId}
            triggerLabel="New project"
            currentUserId={session.user.id}
            currentUserRole={session.user.role}
          />
        ) : null}
      </div>

      <ProjectsGrid
        projects={projects}
        canManage={canCreateProject}
        scope="all"
        title={`Projects · ${clientLabel}`}
        emptyTitle={`No projects for ${clientLabel} yet`}
        emptyDescription="Create the first project to start tracking work for this client."
      />
    </div>
  );
}
