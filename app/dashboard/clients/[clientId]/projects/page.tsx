import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { findClientListItemById } from "@/lib/models/client";
import { listProjectsForClient } from "@/lib/models/project";
import { listClients } from "@/lib/models/client";
import { listManagers } from "@/lib/models/user";

import { AddProjectDialog } from "@/app/dashboard/projects/_components/add-project-dialog";
import { ProjectsGrid } from "@/app/dashboard/projects/_components/projects-grid";

export default async function ClientProjectsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireRole("admin");
  const { clientId } = await params;
  const client = await findClientListItemById(clientId);
  if (!client) notFound();

  const [projects, clients, managers] = await Promise.all([
    listProjectsForClient(clientId),
    listClients(),
    listManagers(),
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
        <AddProjectDialog
          clients={clients}
          managers={managers}
          initialClientId={clientId}
          triggerLabel="New project"
        />
      </div>

      <ProjectsGrid
        projects={projects}
        canManage
        scope="all"
        title={`Projects · ${clientLabel}`}
        emptyTitle={`No projects for ${clientLabel} yet`}
        emptyDescription="Create the first project to start tracking work for this client."
      />
    </div>
  );
}
