import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";

export default async function ProjectOverviewPage({
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

  const canEdit = hasAtLeast(session.user.role, "manager");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.description || "No description yet."}
          </p>
        </div>
        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="h-9 gap-1.5"
            render={
              <Link href={`/dashboard/projects/${project.id}/settings`} />
            }
          >
            <Settings className="size-4" />
            Edit project
          </Button>
        ) : null}
      </div>
    </div>
  );
}
