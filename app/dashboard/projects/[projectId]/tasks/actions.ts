"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { hasAtLeast, type Role } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";
import {
  addTaskComment,
  createTask,
  deleteTask,
  findTaskRaw,
  setTaskStatus,
  updateTask,
} from "@/lib/models/task";
import {
  isTaskPriority,
  isTaskStatus,
  type TaskStatus,
} from "@/lib/tasks/types";

export type TaskFormState = {
  error?: string;
  ok?: boolean;
};

const TITLE_MAX = 200;
const DESC_MAX = 5000;
const COMMENT_MAX = 2000;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

type AuthorizedProject = NonNullable<
  Awaited<ReturnType<typeof findProjectForUser>>
>;

type Guard =
  | {
      ok: true;
      userId: string;
      userRole: Role;
      project: AuthorizedProject;
      isManager: boolean;
    }
  | { ok: false; error: string };

async function authorizeProject(projectId: string): Promise<Guard> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "You must be signed in." };
  if (!ObjectId.isValid(projectId)) {
    return { ok: false, error: "Invalid project." };
  }
  const project = await findProjectForUser(
    projectId,
    session.user.id,
    session.user.role
  );
  if (!project) return { ok: false, error: "Project not found." };

  const isAdmin = hasAtLeast(session.user.role, "admin");
  const isAssignedManager =
    session.user.role === "manager" &&
    project.assignees.some((a) => a.id === session.user.id);

  return {
    ok: true,
    userId: session.user.id,
    userRole: session.user.role,
    project,
    isManager: isAdmin || isAssignedManager,
  };
}

function revalidate(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}/tasks`);
}

export async function createTaskAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const projectId = readField(formData, "projectId");
  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };
  if (!guard.isManager) {
    return { error: "Only managers and admins can create tasks." };
  }

  const title = readField(formData, "title");
  const description = readField(formData, "description");
  const priorityRaw = readField(formData, "priority");
  const assigneeId = readField(formData, "assigneeId");
  const dueDate = readField(formData, "dueDate");

  if (!title) return { error: "Task title is required." };
  if (title.length > TITLE_MAX) {
    return { error: `Title is too long (max ${TITLE_MAX} characters).` };
  }
  if (description.length > DESC_MAX) {
    return { error: `Description is too long (max ${DESC_MAX} characters).` };
  }
  if (!isTaskPriority(priorityRaw)) {
    return { error: "Invalid priority." };
  }
  if (assigneeId) {
    if (!ObjectId.isValid(assigneeId)) {
      return { error: "Invalid assignee." };
    }
    const isMember = guard.project.members.some((m) => m.id === assigneeId);
    if (!isMember) {
      return { error: "Assignee must be a member of this project." };
    }
  }
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return { error: "Invalid due date." };
  }

  try {
    await createTask({
      projectId,
      title,
      description,
      status: "todo",
      priority: priorityRaw,
      assigneeId: assigneeId || null,
      dueDate: dueDate || undefined,
      createdBy: guard.userId,
    });
  } catch {
    return { error: "Could not create the task. Please try again." };
  }

  revalidate(projectId);
  return { ok: true };
}

export async function updateTaskAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const projectId = readField(formData, "projectId");
  const taskId = readField(formData, "taskId");
  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };

  const task = await findTaskRaw(taskId);
  if (!task || task.projectId.toHexString() !== projectId) {
    return { error: "Task not found." };
  }

  const isCreator = task.createdBy === guard.userId;
  if (!guard.isManager && !isCreator) {
    return { error: "You can only edit your own tasks." };
  }

  const title = readField(formData, "title");
  const description = readField(formData, "description");
  const priorityRaw = readField(formData, "priority");
  const assigneeId = readField(formData, "assigneeId");
  const dueDate = readField(formData, "dueDate");

  if (!title) return { error: "Task title is required." };
  if (title.length > TITLE_MAX) {
    return { error: `Title is too long (max ${TITLE_MAX} characters).` };
  }
  if (description.length > DESC_MAX) {
    return { error: `Description is too long (max ${DESC_MAX} characters).` };
  }
  if (!isTaskPriority(priorityRaw)) {
    return { error: "Invalid priority." };
  }
  if (assigneeId) {
    if (!ObjectId.isValid(assigneeId)) {
      return { error: "Invalid assignee." };
    }
    const isMember = guard.project.members.some((m) => m.id === assigneeId);
    if (!isMember) {
      return { error: "Assignee must be a member of this project." };
    }
  }
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return { error: "Invalid due date." };
  }

  try {
    const ok = await updateTask(taskId, {
      title,
      description,
      priority: priorityRaw,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    });
    if (!ok) return { error: "Task could not be updated." };
  } catch {
    return { error: "Could not update the task. Please try again." };
  }

  revalidate(projectId);
  return { ok: true };
}

export async function changeTaskStatusAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const projectId = readField(formData, "projectId");
  const taskId = readField(formData, "taskId");
  const target = readField(formData, "status");

  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };
  if (!isTaskStatus(target)) return { error: "Invalid status." };

  const task = await findTaskRaw(taskId);
  if (!task || task.projectId.toHexString() !== projectId) {
    return { error: "Task not found." };
  }

  const assigneeHex =
    task.assigneeId instanceof ObjectId ? task.assigneeId.toHexString() : null;
  const isAssignee = assigneeHex !== null && assigneeHex === guard.userId;

  const allowed = isStatusChangeAllowed(target, guard.isManager, isAssignee);
  if (!allowed) {
    return {
      error:
        target === "done"
          ? "Only managers can mark a task as done."
          : "You can only update the status of tasks assigned to you.",
    };
  }

  try {
    const ok = await setTaskStatus(taskId, target);
    if (!ok) return { error: "Task could not be updated." };
  } catch {
    return { error: "Could not update the status. Please try again." };
  }

  revalidate(projectId);
  return { ok: true };
}

function isStatusChangeAllowed(
  target: TaskStatus,
  isManager: boolean,
  isAssignee: boolean
): boolean {
  if (isManager) return true;
  if (target === "done") return false;
  return isAssignee;
}

export async function deleteTaskAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const projectId = readField(formData, "projectId");
  const taskId = readField(formData, "taskId");
  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };

  const task = await findTaskRaw(taskId);
  if (!task || task.projectId.toHexString() !== projectId) {
    return { error: "Task not found." };
  }

  if (!guard.isManager) {
    return { error: "Only managers and admins can delete tasks." };
  }

  try {
    await deleteTask(taskId);
  } catch {
    return { error: "Could not delete the task. Please try again." };
  }

  revalidate(projectId);
  return { ok: true };
}

export async function addCommentAction(
  _prev: TaskFormState | undefined,
  formData: FormData
): Promise<TaskFormState> {
  const projectId = readField(formData, "projectId");
  const taskId = readField(formData, "taskId");
  const body = readField(formData, "body");

  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };

  const task = await findTaskRaw(taskId);
  if (!task || task.projectId.toHexString() !== projectId) {
    return { error: "Task not found." };
  }

  if (!body) return { error: "Comment cannot be empty." };
  if (body.length > COMMENT_MAX) {
    return { error: `Comment is too long (max ${COMMENT_MAX} characters).` };
  }

  try {
    const result = await addTaskComment(taskId, guard.userId, body);
    if (!result) return { error: "Could not post the comment." };
  } catch {
    return { error: "Could not post the comment. Please try again." };
  }

  revalidate(projectId);
  return { ok: true };
}
