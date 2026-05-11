"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasAtLeast } from "@/lib/auth/roles";
import { findClientById } from "@/lib/models/client";
import {
  createTask,
  deleteTask,
  findTaskById,
  setTaskStatus,
  updateTask,
} from "@/lib/models/client-task";
import {
  isClientTaskStatus,
  type ClientTaskStatus,
} from "@/lib/clients/task-types";

export type TaskFormState = {
  error?: string;
  ok?: boolean;
};

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 5000;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

type ValidatedPayload = {
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
};

function validatePayload(
  formData: FormData
):
  | { ok: true; data: ValidatedPayload }
  | { ok: false; error: string } {
  const title = readField(formData, "title");
  const description = readField(formData, "description");
  const dueDate = readField(formData, "dueDate");
  const assigneeId = readField(formData, "assigneeId");

  if (!title) return { ok: false, error: "Task title is required." };
  if (title.length > TITLE_MAX) {
    return { ok: false, error: `Title is too long (max ${TITLE_MAX} characters).` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `Description is too long (max ${DESCRIPTION_MAX} characters).`,
    };
  }
  if (dueDate) {
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Invalid due date." };
    }
  }

  return { ok: true, data: { title, description, dueDate, assigneeId } };
}

export async function addTaskAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to add tasks." };
  }

  const clientId = readField(formData, "clientId");
  if (!clientId) return { error: "Missing client id." };
  const client = await findClientById(clientId);
  if (!client) return { error: "Client not found." };

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  try {
    const created = await createTask({
      clientId,
      title: result.data.title,
      description: result.data.description,
      dueDate: result.data.dueDate,
      assigneeId: result.data.assigneeId,
      createdBy: session.user.id,
      createdByName: session.user.name ?? session.user.email ?? "",
    });
    if (!created) return { error: "Could not create the task." };
  } catch {
    return { error: "Could not create the task. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${clientId}/tasks`);
  return { ok: true };
}

export async function updateTaskAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to update tasks." };
  }

  const taskId = readField(formData, "taskId");
  if (!taskId) return { error: "Missing task id." };
  const existing = await findTaskById(taskId);
  if (!existing) return { error: "Task not found." };

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  try {
    const ok = await updateTask(taskId, result.data);
    if (!ok) return { error: "Task could not be updated." };
  } catch {
    return { error: "Could not update the task. Please try again." };
  }

  revalidatePath(
    `/dashboard/clients/${existing.clientId.toString()}/tasks`
  );
  return { ok: true };
}

export async function setTaskStatusAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to update tasks." };
  }

  const taskId = readField(formData, "taskId");
  if (!taskId) return { error: "Missing task id." };
  const statusRaw = readField(formData, "status");
  if (!isClientTaskStatus(statusRaw)) return { error: "Invalid status." };
  const status: ClientTaskStatus = statusRaw;

  const existing = await findTaskById(taskId);
  if (!existing) return { error: "Task not found." };

  try {
    const ok = await setTaskStatus(taskId, status);
    if (!ok) return { error: "Could not update status." };
  } catch {
    return { error: "Could not update status. Please try again." };
  }

  revalidatePath(
    `/dashboard/clients/${existing.clientId.toString()}/tasks`
  );
  return { ok: true };
}

export async function deleteTaskAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to delete tasks." };
  }

  const taskId = readField(formData, "taskId");
  if (!taskId) return { error: "Missing task id." };
  const existing = await findTaskById(taskId);
  if (!existing) return { error: "Task not found." };

  try {
    const ok = await deleteTask(taskId);
    if (!ok) return { error: "Task could not be deleted." };
  } catch {
    return { error: "Could not delete the task. Please try again." };
  }

  revalidatePath(
    `/dashboard/clients/${existing.clientId.toString()}/tasks`
  );
  return { ok: true };
}
