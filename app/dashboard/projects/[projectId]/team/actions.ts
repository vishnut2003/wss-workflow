"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { findProjectForUser, setProjectMembers } from "@/lib/models/project";
import { findUserById, listMembersForManager } from "@/lib/models/user";

export type ProjectTeamFormState = {
  error?: string;
  ok?: boolean;
};

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readMany(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function updateProjectTeamAction(
  _prev: ProjectTeamFormState | undefined,
  formData: FormData
): Promise<ProjectTeamFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in." };
  }

  const projectId = readField(formData, "projectId");
  if (!projectId || !ObjectId.isValid(projectId)) {
    return { error: "Missing project id." };
  }

  if (session.user.role !== "manager") {
    return {
      error: "Only managers can change a project's team members.",
    };
  }

  const project = await findProjectForUser(
    projectId,
    session.user.id,
    session.user.role
  );
  if (!project) return { error: "Project not found." };

  const isAssignedManager = project.assignees.some(
    (a) => a.id === session.user.id
  );
  if (!isAssignedManager) {
    return {
      error: "Only managers assigned to this project can manage its team.",
    };
  }

  const submittedIds = readMany(formData, "memberIds");
  const eligible = await listMembersForManager(session.user.id);
  const eligibleIds = new Set(eligible.map((m) => m.id));

  const existingFromOtherManagers = project.members
    .filter(
      (m) =>
        m.managerId !== null &&
        m.managerId !== session.user.id
    )
    .map((m) => m.id);

  const cleaned = new Set<string>(existingFromOtherManagers);
  for (const id of submittedIds) {
    if (!ObjectId.isValid(id)) continue;
    if (!eligibleIds.has(id)) continue;
    const user = await findUserById(id);
    if (!user) continue;
    if (user.role !== "member") continue;
    cleaned.add(id);
  }

  try {
    const ok = await setProjectMembers(projectId, Array.from(cleaned));
    if (!ok) return { error: "Project team could not be updated." };
  } catch {
    return { error: "Could not update the project team. Please try again." };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/team`);
  return { ok: true };
}
