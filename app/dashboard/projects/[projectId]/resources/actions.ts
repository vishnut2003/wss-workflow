"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { hasAtLeast, type Role } from "@/lib/auth/roles";
import { findProjectForUser } from "@/lib/models/project";
import {
  createFileResource,
  createLinkResource,
  deleteResource,
  findResourceById,
} from "@/lib/models/resource";
import {
  WORDPRESS_UPLOAD_MAX_BYTES,
  uploadFileToWordPress,
} from "@/lib/wordpress";

export type ResourceFormState = {
  error?: string;
  ok?: boolean;
};

const TITLE_MAX = 200;
const DESC_MAX = 2000;
const URL_MAX = 2000;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type AuthorizedProject = NonNullable<
  Awaited<ReturnType<typeof findProjectForUser>>
>;

type AuthResult =
  | { ok: true; userId: string; userRole: Role; project: AuthorizedProject }
  | { ok: false; error: string };

async function authorizeProject(projectId: string): Promise<AuthResult> {
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
  return {
    ok: true,
    userId: session.user.id,
    userRole: session.user.role,
    project,
  };
}

export async function uploadFileResourceAction(
  _prev: ResourceFormState | undefined,
  formData: FormData
): Promise<ResourceFormState> {
  const projectId = readField(formData, "projectId");
  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };

  const title = readField(formData, "title");
  const description = readField(formData, "description");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > WORDPRESS_UPLOAD_MAX_BYTES) {
    return { error: "File too large. Maximum upload size is 10 MB." };
  }
  if (title.length > TITLE_MAX) {
    return { error: `Title is too long (max ${TITLE_MAX} characters).` };
  }
  if (description.length > DESC_MAX) {
    return { error: `Description is too long (max ${DESC_MAX} characters).` };
  }

  let media;
  try {
    media = await uploadFileToWordPress(file, { filename: file.name });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : "Upload failed.",
    };
  }

  try {
    await createFileResource({
      projectId,
      title: title || file.name,
      description,
      url: media.source_url,
      fileName: file.name,
      mimeType: file.type || media.mime_type || "application/octet-stream",
      sizeBytes: file.size,
      wordpressMediaId: media.id,
      createdBy: guard.userId,
    });
  } catch {
    return { error: "Could not save the resource. Please try again." };
  }

  revalidatePath(`/dashboard/projects/${projectId}/resources`);
  return { ok: true };
}

export async function addLinkResourceAction(
  _prev: ResourceFormState | undefined,
  formData: FormData
): Promise<ResourceFormState> {
  const projectId = readField(formData, "projectId");
  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };

  const title = readField(formData, "title");
  const description = readField(formData, "description");
  const url = readField(formData, "url");

  if (!title) return { error: "Title is required." };
  if (title.length > TITLE_MAX) {
    return { error: `Title is too long (max ${TITLE_MAX} characters).` };
  }
  if (!url) return { error: "URL is required." };
  if (url.length > URL_MAX) {
    return { error: `URL is too long (max ${URL_MAX} characters).` };
  }
  if (!isValidHttpUrl(url)) {
    return { error: "Enter a valid http(s) URL." };
  }
  if (description.length > DESC_MAX) {
    return { error: `Description is too long (max ${DESC_MAX} characters).` };
  }

  try {
    await createLinkResource({
      projectId,
      title,
      description,
      url,
      createdBy: guard.userId,
    });
  } catch {
    return { error: "Could not save the resource. Please try again." };
  }

  revalidatePath(`/dashboard/projects/${projectId}/resources`);
  return { ok: true };
}

export async function deleteResourceAction(
  _prev: ResourceFormState | undefined,
  formData: FormData
): Promise<ResourceFormState> {
  const projectId = readField(formData, "projectId");
  const resourceId = readField(formData, "resourceId");
  const guard = await authorizeProject(projectId);
  if (!guard.ok) return { error: guard.error };

  const resource = await findResourceById(resourceId);
  if (!resource) return { error: "Resource not found." };
  if (resource.projectId.toHexString() !== projectId) {
    return { error: "Resource does not belong to this project." };
  }

  const isCreator = resource.createdBy === guard.userId;
  const isAdmin = hasAtLeast(guard.userRole, "admin");
  const isAssignedManager =
    guard.userRole === "manager" &&
    guard.project.assignees.some((a) => a.id === guard.userId);
  if (!isCreator && !isAdmin && !isAssignedManager) {
    return { error: "You can only remove resources you added." };
  }

  try {
    await deleteResource(resourceId);
  } catch {
    return { error: "Could not remove the resource." };
  }

  revalidatePath(`/dashboard/projects/${projectId}/resources`);
  return { ok: true };
}
