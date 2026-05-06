import { notFound } from "next/navigation";
import { FolderArchive } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";
import { listResourcesForProject } from "@/lib/models/resource";

import { AddResourceDialog } from "./_components/add-resource-dialog";
import { ResourceList } from "./_components/resource-list";

export default async function ProjectResourcesPage({
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

  const resources = await listResourcesForProject(project.id);

  const isAdmin = hasAtLeast(session.user.role, "admin");
  const isAssignedManager =
    session.user.role === "manager" &&
    project.assignees.some((a) => a.id === session.user.id);
  const canDeleteAny = isAdmin || isAssignedManager;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/30 to-orange-500/20 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <FolderArchive className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Resources
            </h1>
            <p className="text-sm text-muted-foreground">
              Files and links shared on{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
              .
            </p>
          </div>
        </div>

        <AddResourceDialog projectId={project.id} />
      </div>

      <ResourceList
        projectId={project.id}
        resources={resources}
        currentUserId={session.user.id}
        canDeleteAny={canDeleteAny}
      />
    </div>
  );
}
