"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { hasAtLeast } from "@/lib/auth/roles";
import {
  createProject,
  findProjectForUser,
  updateProject,
} from "@/lib/models/project";
import { findClientById } from "@/lib/models/client";
import { findUserById } from "@/lib/models/user";
import { isProjectStatus, type ProjectStatus } from "@/lib/projects/types";

export type ProjectFormState = {
  error?: string;
  ok?: boolean;
};

const NAME_MAX = 160;
const DESCRIPTION_MAX = 5000;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readMany(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

type ProjectPayload = {
  name: string;
  description: string;
  status: ProjectStatus;
  clientId: string;
  assigneeIds: string[];
  startDate: string;
  dueDate: string;
};

async function validatePayload(
  formData: FormData
): Promise<{ ok: true; data: ProjectPayload } | { ok: false; error: string }> {
  const name = readField(formData, "name");
  const description = readField(formData, "description");
  const statusRaw = readField(formData, "status");
  const clientId = readField(formData, "clientId");
  const startDate = readField(formData, "startDate");
  const dueDate = readField(formData, "dueDate");
  const assigneeIds = readMany(formData, "assigneeIds");

  if (!name) return { ok: false, error: "Project name is required." };
  if (name.length > NAME_MAX) {
    return { ok: false, error: `Name is too long (max ${NAME_MAX} characters).` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `Description is too long (max ${DESCRIPTION_MAX} characters).`,
    };
  }
  if (!isProjectStatus(statusRaw)) return { ok: false, error: "Invalid status." };
  const status: ProjectStatus = statusRaw;

  if (clientId) {
    if (!ObjectId.isValid(clientId)) return { ok: false, error: "Invalid client." };
    const client = await findClientById(clientId);
    if (!client) return { ok: false, error: "Selected client does not exist." };
  }

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    return { ok: false, error: "Invalid start date." };
  }
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return { ok: false, error: "Invalid due date." };
  }
  if (
    startDate &&
    dueDate &&
    new Date(dueDate).getTime() < new Date(startDate).getTime()
  ) {
    return { ok: false, error: "Due date cannot be before the start date." };
  }

  const validAssignees: string[] = [];
  for (const id of assigneeIds) {
    if (!ObjectId.isValid(id)) {
      return { ok: false, error: "Invalid assignee selection." };
    }
    const user = await findUserById(id);
    if (!user) return { ok: false, error: "Selected user no longer exists." };
    if (user.role !== "manager" && user.role !== "admin") {
      return { ok: false, error: "Only managers can be assigned to projects." };
    }
    validAssignees.push(id);
  }

  return {
    ok: true,
    data: {
      name,
      description,
      status,
      clientId,
      assigneeIds: validAssignees,
      startDate,
      dueDate,
    },
  };
}

export async function addProjectAction(
  _prev: ProjectFormState | undefined,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to add projects." };
  }

  const result = await validatePayload(formData);
  if (!result.ok) return { error: result.error };

  try {
    await createProject({
      name: result.data.name,
      description: result.data.description,
      status: result.data.status,
      clientId: result.data.clientId || undefined,
      assigneeIds: result.data.assigneeIds,
      startDate: result.data.startDate || undefined,
      dueDate: result.data.dueDate || undefined,
      createdBy: session.user.id,
    });
  } catch {
    return { error: "Could not create the project. Please try again." };
  }

  revalidatePath("/dashboard/projects");
  return { ok: true };
}

export async function updateProjectAction(
  _prev: ProjectFormState | undefined,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "manager")) {
    return { error: "You do not have permission to edit projects." };
  }

  const projectId = readField(formData, "projectId");
  if (!projectId) return { error: "Missing project id." };

  const target = await findProjectForUser(
    projectId,
    session.user.id,
    session.user.role
  );
  if (!target) return { error: "Project not found." };

  const result = await validatePayload(formData);
  if (!result.ok) return { error: result.error };

  const canManageAssignees = hasAtLeast(session.user.role, "admin");
  const assigneeIds = canManageAssignees
    ? result.data.assigneeIds
    : target.assignees.map((a) => a.id);

  try {
    const ok = await updateProject(projectId, {
      name: result.data.name,
      description: result.data.description,
      status: result.data.status,
      clientId: result.data.clientId || undefined,
      assigneeIds,
      startDate: result.data.startDate || undefined,
      dueDate: result.data.dueDate || undefined,
    });
    if (!ok) return { error: "Project could not be updated." };
  } catch {
    return { error: "Could not update the project. Please try again." };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/settings`);
  return { ok: true };
}
