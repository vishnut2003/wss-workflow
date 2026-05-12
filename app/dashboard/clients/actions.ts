"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions/check";
import {
  canUserAccessClient,
  createClient,
  findClientById,
  setClientAssignments,
  updateClient,
} from "@/lib/models/client";
import { isClientStatus, type ClientStatus } from "@/lib/clients/types";
import { isCountryCode } from "@/lib/clients/countries";

export type ClientFormState = {
  error?: string;
  ok?: boolean;
};

const NAME_MAX = 120;
const FIELD_MAX = 200;
const NOTES_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readAssignedMemberIds(formData: FormData): string[] {
  const raw = formData.getAll("assignedMemberIds");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const hex = value.trim();
    if (!hex || !ObjectId.isValid(hex) || seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
  }
  return out;
}

function validatePayload(formData: FormData):
  | { ok: true; data: Parameters<typeof createClient>[0] }
  | { ok: false; error: string } {
  const name = readField(formData, "name");
  const company = readField(formData, "company");
  const email = readField(formData, "email");
  const phone = readField(formData, "phone");
  const phoneCountryRaw = readField(formData, "phoneCountry");
  const website = readField(formData, "website");
  const industry = readField(formData, "industry");
  const statusRaw = readField(formData, "status");
  const address = readField(formData, "address");
  const city = readField(formData, "city");
  const country = readField(formData, "country");
  const notes = readField(formData, "notes");

  if (!name) return { ok: false, error: "Client name is required." };
  if (name.length > NAME_MAX)
    return { ok: false, error: `Name is too long (max ${NAME_MAX} characters).` };
  if (!isClientStatus(statusRaw)) return { ok: false, error: "Invalid status." };
  const status: ClientStatus = statusRaw;

  if (email && !EMAIL_RE.test(email))
    return { ok: false, error: "Please enter a valid email address." };
  if (website && !URL_RE.test(website))
    return { ok: false, error: "Please enter a valid website URL." };
  if (phoneCountryRaw && !isCountryCode(phoneCountryRaw))
    return { ok: false, error: "Invalid phone country." };
  const phoneCountry = phone ? phoneCountryRaw : "";

  for (const [label, value] of Object.entries({
    company,
    phone,
    website,
    industry,
    address,
    city,
    country,
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
    data: {
      name,
      company,
      email,
      phone,
      phoneCountry,
      website,
      industry,
      status,
      address,
      city,
      country,
      notes,
    },
  };
}

export async function addClientAction(
  _prev: ClientFormState | undefined,
  formData: FormData
): Promise<ClientFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.create"))) {
    return { error: "You do not have permission to add clients." };
  }

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  const canAssign = await can(session.user.role, "clients.assign");
  const submittedAssignments = canAssign
    ? readAssignedMemberIds(formData)
    : [];

  // Auto-assign member creators so they can see what they just created.
  const isMember = session.user.role === "member";
  const finalAssignments =
    isMember && ObjectId.isValid(session.user.id)
      ? Array.from(new Set([session.user.id, ...submittedAssignments]))
      : submittedAssignments;

  try {
    await createClient({
      ...result.data,
      assignedMemberIds:
        canAssign || isMember ? finalAssignments : undefined,
      createdBy: session.user.id,
    });
  } catch {
    return { error: "Could not create the client. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  return { ok: true };
}

export async function updateClientAction(
  _prev: ClientFormState | undefined,
  formData: FormData
): Promise<ClientFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.edit"))) {
    return { error: "You do not have permission to update clients." };
  }

  const clientId = readField(formData, "clientId");
  if (!clientId) return { error: "Missing client id." };

  const target = await findClientById(clientId);
  if (!target) return { error: "Client not found." };

  if (
    !(await canUserAccessClient(clientId, session.user.id, session.user.role))
  ) {
    return { error: "You can only edit clients assigned to you." };
  }

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  const canAssign = await can(session.user.role, "clients.assign");

  try {
    const ok = await updateClient(
      clientId,
      {
        ...result.data,
        assignedMemberIds: canAssign
          ? readAssignedMemberIds(formData)
          : undefined,
      },
      { updateAssignments: canAssign }
    );
    if (!ok) return { error: "Client could not be updated." };
  } catch {
    return { error: "Could not update the client. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}

export async function assignClientMembersAction(
  _prev: ClientFormState | undefined,
  formData: FormData
): Promise<ClientFormState> {
  const session = await auth();
  if (!session?.user || !(await can(session.user.role, "clients.assign"))) {
    return { error: "You do not have permission to assign members." };
  }

  const clientId = readField(formData, "clientId");
  if (!clientId) return { error: "Missing client id." };

  const target = await findClientById(clientId);
  if (!target) return { error: "Client not found." };

  try {
    const ok = await setClientAssignments(
      clientId,
      readAssignedMemberIds(formData)
    );
    if (!ok) return { error: "Assignments could not be saved." };
  } catch {
    return { error: "Could not save assignments. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}
