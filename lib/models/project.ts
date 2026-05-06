import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { hasAtLeast, type Role } from "@/lib/auth/roles";
import {
  isProjectStatus,
  type ProjectListItem,
  type ProjectMember,
  type ProjectStatus,
} from "@/lib/projects/types";
import type { ClientDoc } from "@/lib/models/client";
import type { UserDoc } from "@/lib/models/user";

export type ProjectDoc = {
  _id: ObjectId;
  name: string;
  description?: string;
  status: ProjectStatus;
  clientId?: ObjectId;
  assigneeIds: ObjectId[];
  memberIds?: ObjectId[];
  startDate?: Date;
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  status: ProjectStatus;
  clientId?: string;
  assigneeIds: string[];
  startDate?: string;
  dueDate?: string;
  createdBy: string;
};

export type UpdateProjectInput = Omit<CreateProjectInput, "createdBy">;

let indexEnsured = false;

async function projectsCollection(): Promise<Collection<ProjectDoc>> {
  const db = await getDb();
  const col = db.collection<ProjectDoc>("projects");
  if (!indexEnsured) {
    await col.createIndex({ createdAt: -1 });
    await col.createIndex({ assigneeIds: 1 });
    await col.createIndex({ memberIds: 1 });
    await col.createIndex({ createdBy: 1 });
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
  return d instanceof Date && !Number.isNaN(d.getTime())
    ? d.toISOString()
    : "";
}

type EnrichedProject = WithId<ProjectDoc> & {
  clientDoc?: WithId<ClientDoc> | null;
  assigneeDocs?: WithId<UserDoc>[];
  memberDocs?: WithId<UserDoc>[];
};

function toListItem(doc: EnrichedProject): ProjectListItem {
  const client = doc.clientDoc
    ? {
        id: doc.clientDoc._id.toString(),
        name: doc.clientDoc.name ?? "",
        company: doc.clientDoc.company ?? "",
      }
    : null;

  const assignees = (doc.assigneeDocs ?? []).map((u) => ({
    id: u._id.toString(),
    name: u.name ?? "",
    email: u.email,
  }));

  const members: ProjectMember[] = (doc.memberDocs ?? []).map((u) => ({
    id: u._id.toString(),
    name: u.name ?? "",
    email: u.email,
    managerId: u.managerId instanceof ObjectId ? u.managerId.toHexString() : null,
  }));

  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    status: isProjectStatus(doc.status) ? doc.status : "planned",
    client,
    assignees,
    members,
    startDate: toIsoOrEmpty(doc.startDate),
    dueDate: toIsoOrEmpty(doc.dueDate),
    createdBy: doc.createdBy,
    createdAt: (doc.createdAt instanceof Date
      ? doc.createdAt
      : new Date()
    ).toISOString(),
    updatedAt: (doc.updatedAt instanceof Date
      ? doc.updatedAt
      : new Date()
    ).toISOString(),
  };
}

async function enrichProjects(
  docs: WithId<ProjectDoc>[]
): Promise<ProjectListItem[]> {
  if (docs.length === 0) return [];

  const db = await getDb();
  const clientIds = Array.from(
    new Set(
      docs
        .map((d) => d.clientId)
        .filter((v): v is ObjectId => v instanceof ObjectId)
        .map((v) => v.toHexString())
    )
  ).map((hex) => new ObjectId(hex));

  const userIdSet = new Set<string>();
  for (const d of docs) {
    for (const a of d.assigneeIds ?? []) {
      if (a instanceof ObjectId) userIdSet.add(a.toHexString());
    }
    for (const m of d.memberIds ?? []) {
      if (m instanceof ObjectId) userIdSet.add(m.toHexString());
    }
  }
  const userIds = Array.from(userIdSet).map((hex) => new ObjectId(hex));

  const [clientsArr, usersArr] = await Promise.all([
    clientIds.length
      ? db
          .collection<ClientDoc>("clients")
          .find({ _id: { $in: clientIds } })
          .toArray()
      : Promise.resolve([] as WithId<ClientDoc>[]),
    userIds.length
      ? db
          .collection<UserDoc>("users")
          .find(
            { _id: { $in: userIds } },
            { projection: { password: 0 } }
          )
          .toArray()
      : Promise.resolve([] as WithId<UserDoc>[]),
  ]);

  const clientMap = new Map<string, WithId<ClientDoc>>();
  for (const c of clientsArr) clientMap.set(c._id.toHexString(), c);
  const userMap = new Map<string, WithId<UserDoc>>();
  for (const u of usersArr) userMap.set(u._id.toHexString(), u);

  return docs.map((d) =>
    toListItem({
      ...d,
      clientDoc: d.clientId ? clientMap.get(d.clientId.toHexString()) ?? null : null,
      assigneeDocs: (d.assigneeIds ?? [])
        .map((a) => userMap.get(a.toHexString()))
        .filter((u): u is WithId<UserDoc> => Boolean(u)),
      memberDocs: (d.memberIds ?? [])
        .map((m) => userMap.get(m.toHexString()))
        .filter((u): u is WithId<UserDoc> => Boolean(u)),
    })
  );
}

export async function listAllProjects(): Promise<ProjectListItem[]> {
  const col = await projectsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return enrichProjects(docs);
}

export async function listProjectsForUser(
  userId: string
): Promise<ProjectListItem[]> {
  const col = await projectsCollection();
  const filter: Record<string, unknown> = {
    $or: [{ createdBy: userId }] as Record<string, unknown>[],
  };
  if (ObjectId.isValid(userId)) {
    const oid = new ObjectId(userId);
    (filter.$or as Record<string, unknown>[]).push({ assigneeIds: oid });
    (filter.$or as Record<string, unknown>[]).push({ memberIds: oid });
  }
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return enrichProjects(docs);
}

export async function findProjectForUser(
  id: string,
  userId: string,
  role: Role
): Promise<ProjectListItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await projectsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  const canSeeAll = hasAtLeast(role, "admin");
  if (!canSeeAll) {
    const isCreator = doc.createdBy === userId;
    const isAssignee = ObjectId.isValid(userId)
      ? doc.assigneeIds.some((a) => a.toHexString() === userId)
      : false;
    const isMember = ObjectId.isValid(userId)
      ? (doc.memberIds ?? []).some((m) => m.toHexString() === userId)
      : false;
    if (!isCreator && !isAssignee && !isMember) return null;
  }

  const [enriched] = await enrichProjects([doc]);
  return enriched ?? null;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await projectsCollection();

  const clientId =
    input.clientId && ObjectId.isValid(input.clientId)
      ? new ObjectId(input.clientId)
      : undefined;
  const assigneeIds = (input.assigneeIds ?? [])
    .filter((aid) => ObjectId.isValid(aid))
    .map((aid) => new ObjectId(aid));

  const description = trimOrUndef(input.description);
  const startDate = parseDate(input.startDate);
  const dueDate = parseDate(input.dueDate);

  const $set: Partial<ProjectDoc> = {
    name: input.name.trim(),
    status: input.status,
    assigneeIds,
    updatedAt: new Date(),
  };
  const $unset: Record<string, ""> = {};

  if (clientId) $set.clientId = clientId;
  else $unset.clientId = "";

  if (description) $set.description = description;
  else $unset.description = "";

  if (startDate) $set.startDate = startDate;
  else $unset.startDate = "";

  if (dueDate) $set.dueDate = dueDate;
  else $unset.dueDate = "";

  const update: Record<string, unknown> = { $set, $unset };

  const res = await col.updateOne({ _id: new ObjectId(id) }, update);
  return res.matchedCount === 1;
}

export async function setProjectMembers(
  projectId: string,
  memberIds: string[]
): Promise<boolean> {
  if (!ObjectId.isValid(projectId)) return false;
  const col = await projectsCollection();
  const ids = Array.from(
    new Set(memberIds.filter((id) => ObjectId.isValid(id)))
  ).map((id) => new ObjectId(id));

  const res = await col.updateOne(
    { _id: new ObjectId(projectId) },
    {
      $set: { memberIds: ids, updatedAt: new Date() },
    }
  );
  return res.matchedCount === 1;
}

export async function createProject(
  input: CreateProjectInput
): Promise<{ id: string }> {
  const col = await projectsCollection();
  const now = new Date();

  const clientId =
    input.clientId && ObjectId.isValid(input.clientId)
      ? new ObjectId(input.clientId)
      : undefined;
  const assigneeIds = (input.assigneeIds ?? [])
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const result = await col.insertOne({
    _id: new ObjectId(),
    name: input.name.trim(),
    description: trimOrUndef(input.description),
    status: input.status,
    clientId,
    assigneeIds,
    startDate: parseDate(input.startDate),
    dueDate: parseDate(input.dueDate),
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString() };
}
