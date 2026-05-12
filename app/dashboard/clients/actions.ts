"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions/check";
import {
  createClient,
  findClientById,
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

  try {
    await createClient({ ...result.data, createdBy: session.user.id });
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

  const result = validatePayload(formData);
  if (!result.ok) return { error: result.error };

  try {
    const ok = await updateClient(clientId, result.data);
    if (!ok) return { error: "Client could not be updated." };
  } catch {
    return { error: "Could not update the client. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  return { ok: true };
}
