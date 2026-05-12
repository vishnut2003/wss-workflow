"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions/check";
import {
  createContact,
  deleteContact,
  findContactById,
  setPrimaryContact,
  updateContact,
} from "@/lib/models/client-contact";
import { findClientById, updateClient } from "@/lib/models/client";
import { isCountryCode } from "@/lib/clients/countries";
import { isClientStatus } from "@/lib/clients/types";

export type ContactFormState = {
  error?: string;
  ok?: boolean;
};

const NAME_MAX = 120;
const FIELD_MAX = 200;
const NOTES_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readFlag(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (value === null) return false;
  const str = String(value);
  return str === "true" || str === "on" || str === "1";
}

type ValidatedPayload = {
  name: string;
  title: string;
  email: string;
  phone: string;
  phoneCountry: string;
  isPrimary: boolean;
  notes: string;
};

function validatePayload(
  formData: FormData
):
  | { ok: true; data: ValidatedPayload }
  | { ok: false; error: string } {
  const name = readField(formData, "name");
  const title = readField(formData, "title");
  const email = readField(formData, "email");
  const phone = readField(formData, "phone");
  const phoneCountryRaw = readField(formData, "phoneCountry");
  const isPrimary = readFlag(formData, "isPrimary");
  const notes = readField(formData, "notes");

  if (!name) return { ok: false, error: "Contact name is required." };
  if (name.length > NAME_MAX)
    return { ok: false, error: `Name is too long (max ${NAME_MAX} characters).` };

  if (email && !EMAIL_RE.test(email))
    return { ok: false, error: "Please enter a valid email address." };
  if (phoneCountryRaw && !isCountryCode(phoneCountryRaw))
    return { ok: false, error: "Invalid phone country." };
  const phoneCountry = phone ? phoneCountryRaw : "";

  for (const [label, value] of Object.entries({
    title,
    phone,
  })) {
    if (value.length > FIELD_MAX) {
      return { ok: false, error: `${label} is too long (max ${FIELD_MAX} characters).` };
    }
  }
  if (notes.length > NOTES_MAX) {
    return { ok: false, error: `Notes are too long (max ${NOTES_MAX} characters).` };
  }

  return {
    ok: true,
    data: { name, title, email, phone, phoneCountry, isPrimary, notes },
  };
}

async function mirrorPrimaryToClient(
  clientId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    phoneCountry: string;
  }
): Promise<void> {
  const client = await findClientById(clientId);
  if (!client) return;
  await updateClient(clientId, {
    name: data.name || client.name,
    company: client.company ?? "",
    email: data.email || client.email || "",
    phone: data.phone || client.phone || "",
    phoneCountry: data.phoneCountry || client.phoneCountry || "",
    website: client.website ?? "",
    industry: client.industry ?? "",
    status: isClientStatus(client.status) ? client.status : "active",
    address: client.address ?? "",
    city: client.city ?? "",
    country: client.country ?? "",
    notes: client.notes ?? "",
  });
}

export async function addContactAction(
  _prev: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.contacts.manage"))) {
    return { error: "You do not have permission to add contacts." };
  }

  const clientId = readField(formData, "clientId");
  if (!clientId) return { error: "Missing client id." };
  const client = await findClientById(clientId);
  if (!client) return { error: "Client not found." };

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  try {
    const created = await createContact({ clientId, ...result.data });
    if (!created) return { error: "Could not create the contact." };

    if (result.data.isPrimary) {
      await mirrorPrimaryToClient(clientId, result.data);
    }
  } catch {
    return { error: "Could not create the contact. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${clientId}/contacts`);
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}

export async function updateContactAction(
  _prev: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.contacts.manage"))) {
    return { error: "You do not have permission to update contacts." };
  }

  const contactId = readField(formData, "contactId");
  if (!contactId) return { error: "Missing contact id." };
  const existing = await findContactById(contactId);
  if (!existing) return { error: "Contact not found." };

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  const clientId = existing.clientId.toString();

  try {
    const ok = await updateContact(contactId, result.data);
    if (!ok) return { error: "Contact could not be updated." };

    if (result.data.isPrimary) {
      await mirrorPrimaryToClient(clientId, result.data);
    }
  } catch {
    return { error: "Could not update the contact. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${clientId}/contacts`);
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}

export async function deleteContactAction(
  _prev: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.contacts.manage"))) {
    return { error: "You do not have permission to delete contacts." };
  }

  const contactId = readField(formData, "contactId");
  if (!contactId) return { error: "Missing contact id." };
  const existing = await findContactById(contactId);
  if (!existing) return { error: "Contact not found." };
  const clientId = existing.clientId.toString();

  try {
    const ok = await deleteContact(contactId);
    if (!ok) return { error: "Contact could not be deleted." };
  } catch {
    return { error: "Could not delete the contact. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${clientId}/contacts`);
  return { ok: true };
}

export async function setPrimaryContactAction(
  _prev: ContactFormState | undefined,
  formData: FormData
): Promise<ContactFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.contacts.manage"))) {
    return { error: "You do not have permission to update contacts." };
  }

  const contactId = readField(formData, "contactId");
  if (!contactId) return { error: "Missing contact id." };

  let updated;
  try {
    updated = await setPrimaryContact(contactId);
  } catch {
    return { error: "Could not update the contact. Please try again." };
  }
  if (!updated) return { error: "Contact not found." };

  const clientId = updated.clientId.toString();
  await mirrorPrimaryToClient(clientId, {
    name: updated.name,
    email: updated.email ?? "",
    phone: updated.phone ?? "",
    phoneCountry: updated.phoneCountry ?? "",
  });

  revalidatePath(`/dashboard/clients/${clientId}/contacts`);
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}
