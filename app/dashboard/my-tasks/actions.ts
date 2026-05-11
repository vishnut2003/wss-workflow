"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { hasAtLeast } from "@/lib/auth/roles";
import {
  findTaskById as findClientTaskById,
  setTaskStatus as setClientTaskStatus,
} from "@/lib/models/client-task";
import {
  findTaskRaw as findProjectTaskRaw,
  setTaskStatus as setProjectTaskStatus,
} from "@/lib/models/task";

export type MyTaskActionState = {
  error?: string;
  ok?: boolean;
};

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function ownerMatches(assigneeOid: ObjectId | undefined, userId: string): boolean {
  if (!assigneeOid) return false;
  return assigneeOid.toHexString() === userId;
}

export async function toggleMyClientTaskAction(
  _prev: MyTaskActionState | undefined,
  formData: FormData
): Promise<MyTaskActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };

  const taskId = readField(formData, "taskId");
  if (!taskId) return { error: "Missing task id." };

  const task = await findClientTaskById(taskId);
  if (!task) return { error: "Task not found." };

  const isAdmin = hasAtLeast(session.user.role, "admin");
  const isAssignee = ownerMatches(task.assigneeId, session.user.id);
  if (!isAdmin && !isAssignee) {
    return { error: "You can only update tasks assigned to you." };
  }

  const nextStatus = task.status === "done" ? "pending" : "done";

  try {
    const ok = await setClientTaskStatus(taskId, nextStatus);
    if (!ok) return { error: "Could not update status." };
  } catch {
    return { error: "Could not update status. Please try again." };
  }

  revalidatePath("/dashboard/my-tasks");
  revalidatePath(`/dashboard/clients/${task.clientId.toString()}/tasks`);
  return { ok: true };
}

export async function toggleMyProjectTaskAction(
  _prev: MyTaskActionState | undefined,
  formData: FormData
): Promise<MyTaskActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };

  const taskId = readField(formData, "taskId");
  if (!taskId) return { error: "Missing task id." };

  const task = await findProjectTaskRaw(taskId);
  if (!task) return { error: "Task not found." };

  const isAdmin = hasAtLeast(session.user.role, "admin");
  const isManager = hasAtLeast(session.user.role, "manager");
  const isAssignee = ownerMatches(task.assigneeId, session.user.id);
  if (!isAdmin && !isAssignee) {
    return { error: "You can only update tasks assigned to you." };
  }

  let nextStatus: "todo" | "in_review" | "done";
  if (isManager) {
    nextStatus = task.status === "done" ? "todo" : "done";
  } else {
    if (task.status === "done") {
      return {
        error: "Only a manager can reopen a completed task.",
      };
    }
    nextStatus = task.status === "in_review" ? "todo" : "in_review";
  }

  try {
    const ok = await setProjectTaskStatus(taskId, nextStatus);
    if (!ok) return { error: "Could not update status." };
  } catch {
    return { error: "Could not update status. Please try again." };
  }

  revalidatePath("/dashboard/my-tasks");
  revalidatePath(`/dashboard/projects/${task.projectId.toString()}/tasks`);
  return { ok: true };
}
