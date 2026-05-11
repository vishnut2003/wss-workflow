import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { findClientListItemById } from "@/lib/models/client";
import { listTasksForClient } from "@/lib/models/client-task";
import { listManagers } from "@/lib/models/user";

import { ViewClientButton } from "../../_components/view-client-dialog";
import { AddTaskDialog } from "./_components/add-task-dialog";
import { TasksList } from "./_components/tasks-list";
import type { TaskAssigneeOption } from "./_components/task-form-fields";

export default async function ClientTasksPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireRole("admin");
  const { clientId } = await params;
  const client = await findClientListItemById(clientId);
  if (!client) notFound();

  const [tasks, managers] = await Promise.all([
    listTasksForClient(clientId),
    listManagers(),
  ]);

  const assignees: TaskAssigneeOption[] = managers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  const clientLabel = client.company || client.name || "this client";
  const openCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tasks & follow-ups
          </h1>
          <p className="text-sm text-muted-foreground">
            Action items for {clientLabel}.{" "}
            {tasks.length === 0
              ? "Nothing tracked yet."
              : `${openCount} open · ${tasks.length - openCount} done.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewClientButton client={client} />
          <AddTaskDialog clientId={clientId} assignees={assignees} />
        </div>
      </div>

      <TasksList tasks={tasks} assignees={assignees} />
    </div>
  );
}
