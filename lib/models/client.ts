import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import {
  isClientStatus,
  type ClientListItem,
  type ClientStatus,
} from "@/lib/clients/types";

export type ClientDoc = {
  _id: ObjectId;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  website?: string;
  industry?: string;
  status: ClientStatus;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
};

export type CreateClientInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  website?: string;
  industry?: string;
  status: ClientStatus;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdBy?: string;
};

export type UpdateClientInput = Omit<CreateClientInput, "createdBy">;

let indexEnsured = false;

async function clientsCollection(): Promise<Collection<ClientDoc>> {
  const db = await getDb();
  const col = db.collection<ClientDoc>("clients");
  if (!indexEnsured) {
    await col.createIndex({ createdAt: -1 });
    await col.createIndex({ name: 1 });
    indexEnsured = true;
  }
  return col;
}

function trimOrUndef(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toListItem(d: WithId<ClientDoc>): ClientListItem {
  return {
    id: d._id.toString(),
    name: d.name,
    company: d.company ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    phoneCountry: d.phoneCountry ?? "",
    website: d.website ?? "",
    industry: d.industry ?? "",
    status: isClientStatus(d.status) ? d.status : "active",
    address: d.address ?? "",
    city: d.city ?? "",
    country: d.country ?? "",
    notes: d.notes ?? "",
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
    updatedAt: (d.updatedAt instanceof Date ? d.updatedAt : new Date()).toISOString(),
  };
}

export async function listClients(): Promise<ClientListItem[]> {
  const col = await clientsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(toListItem);
}

export async function findClientById(id: string): Promise<ClientDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await clientsCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function findClientListItemById(
  id: string
): Promise<ClientListItem | null> {
  const doc = await findClientById(id);
  if (!doc) return null;
  return toListItem(doc);
}

export async function createClient(input: CreateClientInput): Promise<{ id: string }> {
  const col = await clientsCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    name: input.name.trim(),
    company: trimOrUndef(input.company),
    email: trimOrUndef(input.email)?.toLowerCase(),
    phone: trimOrUndef(input.phone),
    phoneCountry: trimOrUndef(input.phoneCountry),
    website: trimOrUndef(input.website),
    industry: trimOrUndef(input.industry),
    status: input.status,
    address: trimOrUndef(input.address),
    city: trimOrUndef(input.city),
    country: trimOrUndef(input.country),
    notes: trimOrUndef(input.notes),
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  });
  return { id: result.insertedId.toString() };
}

export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await clientsCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        company: trimOrUndef(input.company),
        email: trimOrUndef(input.email)?.toLowerCase(),
        phone: trimOrUndef(input.phone),
        phoneCountry: trimOrUndef(input.phoneCountry),
        website: trimOrUndef(input.website),
        industry: trimOrUndef(input.industry),
        status: input.status,
        address: trimOrUndef(input.address),
        city: trimOrUndef(input.city),
        country: trimOrUndef(input.country),
        notes: trimOrUndef(input.notes),
        updatedAt: new Date(),
      },
    }
  );
  return res.matchedCount === 1;
}

