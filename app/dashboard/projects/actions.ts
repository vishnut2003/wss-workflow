"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { hasAtLeast } from "@/lib/auth/roles";
import { createProject } from "@/lib/models/project";
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

export async function addProjectAction(
  _prev: ProjectFormState | undefined,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "manager")) {
    return { error: "You do not have permission to add projects." };
  }

  const name = readField(formData, "name");
  const description = readField(formData, "description");
  const statusRaw = readField(formData, "status");
  const clientId = readField(formData, "clientId");
  const startDate = readField(formData, "startDate");
  const dueDate = readField(formData, "dueDate");
  const assigneeIds = readMany(formData, "assigneeIds");

  if (!name) return { error: "Project name is required." };
  if (name.length > NAME_MAX) {
    return { error: `Name is too long (max ${NAME_MAX} characters).` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      error: `Description is too long (max ${DESCRIPTION_MAX} characters).`,
    };
  }
  if (!isProjectStatus(statusRaw)) return { error: "Invalid status." };
  const status: ProjectStatus = statusRaw;

  if (clientId) {
    if (!ObjectId.isValid(clientId)) return { error: "Invalid client." };
    const client = await findClientById(clientId);
    if (!client) return { error: "Selected client does not exist." };
  }

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    return { error: "Invalid start date." };
  }
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return { error: "Invalid due date." };
  }
  if (
    startDate &&
    dueDate &&
    new Date(dueDate).getTime() < new Date(startDate).getTime()
  ) {
    return { error: "Due date cannot be before the start date." };
  }

  const validAssignees: string[] = [];
  for (const id of assigneeIds) {
    if (!ObjectId.isValid(id)) {
      return { error: "Invalid assignee selection." };
    }
    const user = await findUserById(id);
    if (!user) return { error: "Selected user no longer exists." };
    if (user.role !== "manager" && user.role !== "admin") {
      return { error: "Only managers can be assigned to projects." };
    }
    validAssignees.push(id);
  }

  try {
    await createProject({
      name,
      description,
      status,
      clientId: clientId || undefined,
      assigneeIds: validAssignees,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      createdBy: session.user.id,
    });
  } catch {
    return { error: "Could not create the project. Please try again." };
  }

  revalidatePath("/dashboard/projects");
  return { ok: true };
}
