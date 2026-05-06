import { notFound, redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";
import { listClients } from "@/lib/models/client";
import { listManagers } from "@/lib/models/user";

import { EditProjectForm } from "./_components/edit-project-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();

  if (!hasAtLeast(session.user.role, "manager")) {
    redirect("/forbidden");
  }

  const project = await findProjectForUser(
    projectId,
    session.user.id,
    session.user.role
  );
  if (!project) notFound();

  const canManageAssignees = hasAtLeast(session.user.role, "admin");

  const [clients, managers] = await Promise.all([
    listClients(),
    listManagers(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
          <Settings className="size-5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Project settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Update details for{" "}
            <span className="font-medium text-foreground">{project.name}</span>.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6">
        <EditProjectForm
          key={`${project.id}:${project.updatedAt}`}
          project={project}
          clients={clients}
          managers={managers}
          canManageAssignees={canManageAssignees}
        />
      </div>
    </div>
  );
}
