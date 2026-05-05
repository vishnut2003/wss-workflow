import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import {
  listAllProjects,
  listProjectsForUser,
} from "@/lib/models/project";
import { listClients } from "@/lib/models/client";
import { listManagers } from "@/lib/models/user";
import { AddProjectDialog } from "./_components/add-project-dialog";
import { ProjectsGrid } from "./_components/projects-grid";

export default async function ProjectsPage() {
  const session = await requireSession();
  const role = session.user.role;
  const canManage = hasAtLeast(role, "manager");
  const canSeeAll = hasAtLeast(role, "admin");

  const projects = canSeeAll
    ? await listAllProjects()
    : await listProjectsForUser(session.user.id);

  const [clients, managers] = canManage
    ? await Promise.all([listClients(), listManagers()])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            {canSeeAll
              ? "All projects across the workspace."
              : "Projects you've created or are assigned to."}
          </p>
        </div>
        {canManage ? (
          <AddProjectDialog clients={clients} managers={managers} />
        ) : null}
      </div>

      <ProjectsGrid
        projects={projects}
        canManage={canManage}
        scope={canSeeAll ? "all" : "mine"}
      />
    </div>
  );
}
