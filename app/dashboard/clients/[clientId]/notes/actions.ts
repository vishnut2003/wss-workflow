"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions/check";
import { findClientById } from "@/lib/models/client";
import {
  createNote,
  deleteNote,
  findNoteById,
  setNotePinned,
  updateNoteBody,
} from "@/lib/models/client-note";

export type NoteFormState = {
  error?: string;
  ok?: boolean;
};

const BODY_MAX = 5000;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function addNoteAction(
  _prev: NoteFormState | undefined,
  formData: FormData
): Promise<NoteFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.notes.manage"))) {
    return { error: "You do not have permission to add notes." };
  }

  const clientId = readField(formData, "clientId");
  if (!clientId) return { error: "Missing client id." };
  const client = await findClientById(clientId);
  if (!client) return { error: "Client not found." };

  const body = readField(formData, "body");
  if (!body) return { error: "Note cannot be empty." };
  if (body.length > BODY_MAX) {
    return { error: `Note is too long (max ${BODY_MAX} characters).` };
  }

  try {
    const created = await createNote({
      clientId,
      body,
      authorId: session.user.id,
      authorName: session.user.name ?? "",
      authorEmail: session.user.email ?? "",
    });
    if (!created) return { error: "Could not save the note." };
  } catch {
    return { error: "Could not save the note. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${clientId}/notes`);
  return { ok: true };
}

export async function updateNoteAction(
  _prev: NoteFormState | undefined,
  formData: FormData
): Promise<NoteFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.notes.manage"))) {
    return { error: "You do not have permission to edit notes." };
  }

  const noteId = readField(formData, "noteId");
  if (!noteId) return { error: "Missing note id." };
  const existing = await findNoteById(noteId);
  if (!existing) return { error: "Note not found." };

  const body = readField(formData, "body");
  if (!body) return { error: "Note cannot be empty." };
  if (body.length > BODY_MAX) {
    return { error: `Note is too long (max ${BODY_MAX} characters).` };
  }

  try {
    const ok = await updateNoteBody(noteId, body);
    if (!ok) return { error: "Note could not be updated." };
  } catch {
    return { error: "Could not update the note. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId.toString()}/notes`);
  return { ok: true };
}

export async function deleteNoteAction(
  _prev: NoteFormState | undefined,
  formData: FormData
): Promise<NoteFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.notes.manage"))) {
    return { error: "You do not have permission to delete notes." };
  }

  const noteId = readField(formData, "noteId");
  if (!noteId) return { error: "Missing note id." };
  const existing = await findNoteById(noteId);
  if (!existing) return { error: "Note not found." };

  try {
    const ok = await deleteNote(noteId);
    if (!ok) return { error: "Note could not be deleted." };
  } catch {
    return { error: "Could not delete the note. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId.toString()}/notes`);
  return { ok: true };
}

export async function togglePinNoteAction(
  _prev: NoteFormState | undefined,
  formData: FormData
): Promise<NoteFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.notes.manage"))) {
    return { error: "You do not have permission to pin notes." };
  }

  const noteId = readField(formData, "noteId");
  if (!noteId) return { error: "Missing note id." };
  const existing = await findNoteById(noteId);
  if (!existing) return { error: "Note not found." };

  try {
    const ok = await setNotePinned(noteId, !existing.pinned);
    if (!ok) return { error: "Could not update pin state." };
  } catch {
    return { error: "Could not update pin state. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${existing.clientId.toString()}/notes`);
  return { ok: true };
}
