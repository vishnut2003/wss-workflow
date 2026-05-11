import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import {
  isClientTaskStatus,
  type ClientTaskListItem,
  type ClientTaskStatus,
} from "@/lib/clients/task-types";
import { isClientStatus, type ClientListItem } from "@/lib/clients/types";
import type { ClientDoc } from "@/lib/models/client";
import type { UserDoc } from "@/lib/models/user";

function clientDocToListItem(d: WithId<ClientDoc>): ClientListItem {
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

export type ClientTaskDoc = {
  _id: ObjectId;
  clientId: ObjectId;
  title: string;
  description?: string;
  status: ClientTaskStatus;
  dueDate?: Date;
  assigneeId?: ObjectId;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};

export type CreateClientTaskInput = {
  clientId: string;
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string;
  createdBy: string;
  createdByName?: string;
};

export type UpdateClientTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string;
};

let indexEnsured = false;

async function tasksCollection(): Promise<Collection<ClientTaskDoc>> {
  const db = await getDb();
  const col = db.collection<ClientTaskDoc>("clientTasks");
  if (!indexEnsured) {
    await col.createIndex({ clientId: 1, status: 1, dueDate: 1 });
    await col.createIndex({ clientId: 1, createdAt: -1 });
    await col.createIndex({ assigneeId: 1 });
    indexEnsured = true;
  }
  return col;
}

function trimOrUndef(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseDate(value: string | undefined): Date | undefined {
  const v = trimOrUndef(value);
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function toIsoOrEmpty(d: Date | undefined): string {
  if (!d) return "";
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : "";
}

type EnrichedTask = WithId<ClientTaskDoc> & {
  assigneeDoc?: WithId<UserDoc> | null;
};

function toListItem(doc: EnrichedTask): ClientTaskListItem {
  const assignee = doc.assigneeDoc
    ? {
        id: doc.assigneeDoc._id.toString(),
        name: doc.assigneeDoc.name ?? "",
        email: doc.assigneeDoc.email,
      }
    : null;

  return {
    id: doc._id.toString(),
    clientId: doc.clientId.toString(),
    title: doc.title,
    description: doc.description ?? "",
    status: isClientTaskStatus(doc.status) ? doc.status : "pending",
    dueDate: toIsoOrEmpty(doc.dueDate),
    assignee,
    createdBy: doc.createdBy,
    createdByName: doc.createdByName ?? "",
    createdAt: (doc.createdAt instanceof Date ? doc.createdAt : new Date()).toISOString(),
    updatedAt: (doc.updatedAt instanceof Date ? doc.updatedAt : new Date()).toISOString(),
    completedAt: toIsoOrEmpty(doc.completedAt),
  };
}

async function enrichTasks(
  docs: WithId<ClientTaskDoc>[]
): Promise<ClientTaskListItem[]> {
  if (docs.length === 0) return [];

  const assigneeIds = Array.from(
    new Set(
      docs
        .map((d) => d.assigneeId)
        .filter((v): v is ObjectId => v instanceof ObjectId)
        .map((v) => v.toHexString())
    )
  ).map((hex) => new ObjectId(hex));

  let userMap = new Map<string, WithId<UserDoc>>();
  if (assigneeIds.length > 0) {
    const db = await getDb();
    const users = await db
      .collection<UserDoc>("users")
      .find({ _id: { $in: assigneeIds } }, { projection: { password: 0 } })
      .toArray();
    userMap = new Map(users.map((u) => [u._id.toHexString(), u]));
  }

  return docs.map((d) =>
    toListItem({
      ...d,
      assigneeDoc: d.assigneeId
        ? userMap.get(d.assigneeId.toHexString()) ?? null
        : null,
    })
  );
}

export async function listTasksForClient(
  clientId: string
): Promise<ClientTaskListItem[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const col = await tasksCollection();
  const docs = await col
    .find({ clientId: new ObjectId(clientId) })
    .sort({ status: 1, dueDate: 1, createdAt: -1 })
    .toArray();
  return enrichTasks(docs);
}

export type AssignedClientTask = ClientTaskListItem & {
  client: ClientListItem | null;
};

export async function listClientTasksForAssignee(
  userId: string
): Promise<AssignedClientTask[]> {
  if (!ObjectId.isValid(userId)) return [];
  const col = await tasksCollection();
  const docs = await col
    .find({ assigneeId: new ObjectId(userId) })
    .sort({ status: 1, dueDate: 1, createdAt: -1 })
    .toArray();
  if (docs.length === 0) return [];

  const enriched = await enrichTasks(docs);

  const clientIds = Array.from(
    new Set(docs.map((d) => d.clientId.toHexString()))
  ).map((hex) => new ObjectId(hex));

  const db = await getDb();
  const clients = await db
    .collection<ClientDoc>("clients")
    .find({ _id: { $in: clientIds } })
    .toArray();
  const clientMap = new Map<string, ClientListItem>();
  for (const c of clients) {
    clientMap.set(c._id.toHexString(), clientDocToListItem(c));
  }

  return enriched.map((task) => ({
    ...task,
    client: clientMap.get(task.clientId) ?? null,
  }));
}

export async function findTaskById(id: string): Promise<ClientTaskDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await tasksCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createTask(
  input: CreateClientTaskInput
): Promise<{ id: string } | null> {
  if (!ObjectId.isValid(input.clientId)) return null;
  const col = await tasksCollection();
  const now = new Date();

  const assigneeId =
    input.assigneeId && ObjectId.isValid(input.assigneeId)
      ? new ObjectId(input.assigneeId)
      : undefined;

  const result = await col.insertOne({
    _id: new ObjectId(),
    clientId: new ObjectId(input.clientId),
    title: input.title.trim(),
    description: trimOrUndef(input.description),
    status: "pending",
    dueDate: parseDate(input.dueDate),
    assigneeId,
    createdBy: input.createdBy,
    createdByName: trimOrUndef(input.createdByName),
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString() };
}

export async function updateTask(
  id: string,
  input: UpdateClientTaskInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await tasksCollection();
  const assigneeId =
    input.assigneeId && ObjectId.isValid(input.assigneeId)
      ? new ObjectId(input.assigneeId)
      : undefined;

  const description = trimOrUndef(input.description);
  const dueDate = parseDate(input.dueDate);

  const $set: Partial<ClientTaskDoc> = {
    title: input.title.trim(),
    updatedAt: new Date(),
  };
  const $unset: Record<string, ""> = {};

  if (assigneeId) $set.assigneeId = assigneeId;
  else $unset.assigneeId = "";

  if (description) $set.description = description;
  else $unset.description = "";

  if (dueDate) $set.dueDate = dueDate;
  else $unset.dueDate = "";

  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set, $unset }
  );
  return res.matchedCount === 1;
}

export async function setTaskStatus(
  id: string,
  status: ClientTaskStatus
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await tasksCollection();
  const now = new Date();

  const $set: Partial<ClientTaskDoc> = {
    status,
    updatedAt: now,
  };
  const $unset: Record<string, ""> = {};

  if (status === "done") $set.completedAt = now;
  else $unset.completedAt = "";

  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set, $unset }
  );
  return res.matchedCount === 1;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await tasksCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}
