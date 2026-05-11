import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import type { ClientContactListItem } from "@/lib/clients/contact-types";

export type ClientContactDoc = {
  _id: ObjectId;
  clientId: ObjectId;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateClientContactInput = {
  clientId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  isPrimary?: boolean;
  notes?: string;
};

export type UpdateClientContactInput = Omit<CreateClientContactInput, "clientId">;

let indexEnsured = false;

async function contactsCollection(): Promise<Collection<ClientContactDoc>> {
  const db = await getDb();
  const col = db.collection<ClientContactDoc>("clientContacts");
  if (!indexEnsured) {
    await col.createIndex({ clientId: 1, createdAt: -1 });
    await col.createIndex({ clientId: 1, isPrimary: 1 });
    indexEnsured = true;
  }
  return col;
}

function trimOrUndef(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toListItem(d: WithId<ClientContactDoc>): ClientContactListItem {
  return {
    id: d._id.toString(),
    clientId: d.clientId.toString(),
    name: d.name,
    title: d.title ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    phoneCountry: d.phoneCountry ?? "",
    isPrimary: Boolean(d.isPrimary),
    notes: d.notes ?? "",
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
    updatedAt: (d.updatedAt instanceof Date ? d.updatedAt : new Date()).toISOString(),
  };
}

export async function listContactsForClient(
  clientId: string
): Promise<ClientContactListItem[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const col = await contactsCollection();
  const docs = await col
    .find({ clientId: new ObjectId(clientId) })
    .sort({ isPrimary: -1, createdAt: -1 })
    .toArray();
  return docs.map(toListItem);
}

export async function findContactById(
  id: string
): Promise<ClientContactDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await contactsCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createContact(
  input: CreateClientContactInput
): Promise<{ id: string } | null> {
  if (!ObjectId.isValid(input.clientId)) return null;
  const col = await contactsCollection();
  const clientOid = new ObjectId(input.clientId);
  const now = new Date();
  const wantsPrimary = Boolean(input.isPrimary);

  if (wantsPrimary) {
    await col.updateMany(
      { clientId: clientOid, isPrimary: true },
      { $set: { isPrimary: false, updatedAt: now } }
    );
  }

  const result = await col.insertOne({
    _id: new ObjectId(),
    clientId: clientOid,
    name: input.name.trim(),
    title: trimOrUndef(input.title),
    email: trimOrUndef(input.email)?.toLowerCase(),
    phone: trimOrUndef(input.phone),
    phoneCountry: trimOrUndef(input.phoneCountry),
    isPrimary: wantsPrimary,
    notes: trimOrUndef(input.notes),
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString() };
}

export async function updateContact(
  id: string,
  input: UpdateClientContactInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await contactsCollection();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) return false;

  const now = new Date();
  const wantsPrimary = Boolean(input.isPrimary);

  if (wantsPrimary && !existing.isPrimary) {
    await col.updateMany(
      { clientId: existing.clientId, isPrimary: true },
      { $set: { isPrimary: false, updatedAt: now } }
    );
  }

  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        title: trimOrUndef(input.title),
        email: trimOrUndef(input.email)?.toLowerCase(),
        phone: trimOrUndef(input.phone),
        phoneCountry: trimOrUndef(input.phoneCountry),
        isPrimary: wantsPrimary,
        notes: trimOrUndef(input.notes),
        updatedAt: now,
      },
    }
  );
  return res.matchedCount === 1;
}

export async function deleteContact(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await contactsCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

export async function setPrimaryContact(
  contactId: string
): Promise<ClientContactDoc | null> {
  if (!ObjectId.isValid(contactId)) return null;
  const col = await contactsCollection();
  const target = await col.findOne({ _id: new ObjectId(contactId) });
  if (!target) return null;

  const now = new Date();
  await col.updateMany(
    { clientId: target.clientId, isPrimary: true },
    { $set: { isPrimary: false, updatedAt: now } }
  );
  await col.updateOne(
    { _id: target._id },
    { $set: { isPrimary: true, updatedAt: now } }
  );
  return { ...target, isPrimary: true, updatedAt: now };
}
