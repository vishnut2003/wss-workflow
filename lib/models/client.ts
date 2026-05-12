import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { hasAtLeast, type Role } from "@/lib/auth/roles";
import {
  isClientStatus,
  type ClientAssignee,
  type ClientListItem,
  type ClientStatus,
} from "@/lib/clients/types";
import type { UserDoc } from "@/lib/models/user";

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
  assignedMemberIds?: ObjectId[];
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
  assignedMemberIds?: string[];
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
    await col.createIndex({ assignedMemberIds: 1 });
    indexEnsured = true;
  }
  return col;
}

function trimOrUndef(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeAssignedIds(ids: string[] | undefined): ObjectId[] {
  if (!ids) return [];
  const seen = new Set<string>();
  const out: ObjectId[] = [];
  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    const hex = raw.trim();
    if (!hex || !ObjectId.isValid(hex) || seen.has(hex)) continue;
    seen.add(hex);
    out.push(new ObjectId(hex));
  }
  return out;
}

function assignmentHexList(doc: ClientDoc): string[] {
  const list = doc.assignedMemberIds ?? [];
  return list
    .filter((v): v is ObjectId => v instanceof ObjectId)
    .map((v) => v.toHexString());
}

function toListItem(
  d: WithId<ClientDoc>,
  memberMap?: Map<string, WithId<UserDoc>>
): ClientListItem {
  const ids = assignmentHexList(d);
  const assignedMembers: ClientAssignee[] = memberMap
    ? ids
        .map((id) => {
          const u = memberMap.get(id);
          if (!u) return null;
          return {
            id,
            name: (u.name ?? "").trim() || u.email,
            email: u.email,
          };
        })
        .filter((v): v is ClientAssignee => v !== null)
    : [];

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
    assignedMemberIds: ids,
    assignedMembers,
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
    updatedAt: (d.updatedAt instanceof Date ? d.updatedAt : new Date()).toISOString(),
  };
}

async function buildMemberMap(
  docs: WithId<ClientDoc>[]
): Promise<Map<string, WithId<UserDoc>>> {
  const ids = new Set<string>();
  for (const d of docs) {
    for (const hex of assignmentHexList(d)) ids.add(hex);
  }
  if (ids.size === 0) return new Map();
  const db = await getDb();
  const docsOut = await db
    .collection<UserDoc>("users")
    .find(
      { _id: { $in: Array.from(ids).map((hex) => new ObjectId(hex)) } },
      { projection: { password: 0 } }
    )
    .toArray();
  const map = new Map<string, WithId<UserDoc>>();
  for (const u of docsOut) map.set(u._id.toHexString(), u);
  return map;
}

export async function listClients(): Promise<ClientListItem[]> {
  const col = await clientsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  const memberMap = await buildMemberMap(docs);
  return docs.map((d) => toListItem(d, memberMap));
}

export async function listClientsForUser(
  userId: string,
  role: Role
): Promise<ClientListItem[]> {
  if (hasAtLeast(role, "manager")) {
    return listClients();
  }
  if (!ObjectId.isValid(userId)) return [];
  const col = await clientsCollection();
  const docs = await col
    .find({ assignedMemberIds: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();
  const memberMap = await buildMemberMap(docs);
  return docs.map((d) => toListItem(d, memberMap));
}

export function isAssignedToMember(
  doc: ClientDoc,
  userId: string
): boolean {
  if (!ObjectId.isValid(userId)) return false;
  return assignmentHexList(doc).includes(userId);
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
  const memberMap = await buildMemberMap([doc as WithId<ClientDoc>]);
  return toListItem(doc as WithId<ClientDoc>, memberMap);
}

export async function findClientListItemForUser(
  id: string,
  userId: string,
  role: Role
): Promise<ClientListItem | null> {
  const doc = await findClientById(id);
  if (!doc) return null;
  if (!hasAtLeast(role, "manager") && !isAssignedToMember(doc, userId)) {
    return null;
  }
  const memberMap = await buildMemberMap([doc as WithId<ClientDoc>]);
  return toListItem(doc as WithId<ClientDoc>, memberMap);
}

export async function canUserAccessClient(
  id: string,
  userId: string,
  role: Role
): Promise<boolean> {
  if (hasAtLeast(role, "manager")) return true;
  const doc = await findClientById(id);
  if (!doc) return false;
  return isAssignedToMember(doc, userId);
}

export async function createClient(input: CreateClientInput): Promise<{ id: string }> {
  const col = await clientsCollection();
  const now = new Date();
  const assignedMemberIds = normalizeAssignedIds(input.assignedMemberIds);
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
    assignedMemberIds,
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  });
  return { id: result.insertedId.toString() };
}

export async function updateClient(
  id: string,
  input: UpdateClientInput,
  options?: { updateAssignments?: boolean }
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await clientsCollection();
  const $set: Partial<ClientDoc> = {
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
  };
  if (options?.updateAssignments) {
    $set.assignedMemberIds = normalizeAssignedIds(input.assignedMemberIds);
  }
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set });
  return res.matchedCount === 1;
}

export async function setClientAssignments(
  id: string,
  memberIds: string[]
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await clientsCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        assignedMemberIds: normalizeAssignedIds(memberIds),
        updatedAt: new Date(),
      },
    }
  );
  return res.matchedCount === 1;
}
