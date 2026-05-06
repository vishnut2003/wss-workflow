import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import {
  isResourceKind,
  type ResourceKind,
  type ResourceListItem,
} from "@/lib/resources/types";

export type ResourceDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  kind: ResourceKind;
  title: string;
  description?: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  wordpressMediaId?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateLinkResourceInput = {
  projectId: string;
  title: string;
  description?: string;
  url: string;
  createdBy: string;
};

export type CreateFileResourceInput = {
  projectId: string;
  title: string;
  description?: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  wordpressMediaId: number;
  createdBy: string;
};

let indexEnsured = false;

async function resourcesCollection(): Promise<Collection<ResourceDoc>> {
  const db = await getDb();
  const col = db.collection<ResourceDoc>("resources");
  if (!indexEnsured) {
    await col.createIndex({ projectId: 1, createdAt: -1 });
    indexEnsured = true;
  }
  return col;
}

function trimOrUndef(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function toListItem(d: WithId<ResourceDoc>): ResourceListItem {
  return {
    id: d._id.toString(),
    projectId: d.projectId.toHexString(),
    kind: isResourceKind(d.kind) ? d.kind : "link",
    title: d.title,
    description: d.description ?? "",
    url: d.url,
    fileName: d.fileName ?? "",
    mimeType: d.mimeType ?? "",
    sizeBytes: typeof d.sizeBytes === "number" ? d.sizeBytes : 0,
    wordpressMediaId:
      typeof d.wordpressMediaId === "number" ? d.wordpressMediaId : null,
    createdBy: d.createdBy,
    createdAt: (d.createdAt instanceof Date
      ? d.createdAt
      : new Date()
    ).toISOString(),
    updatedAt: (d.updatedAt instanceof Date
      ? d.updatedAt
      : new Date()
    ).toISOString(),
  };
}

export async function listResourcesForProject(
  projectId: string
): Promise<ResourceListItem[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const col = await resourcesCollection();
  const docs = await col
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toListItem);
}

export async function findResourceById(
  id: string
): Promise<WithId<ResourceDoc> | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await resourcesCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createLinkResource(
  input: CreateLinkResourceInput
): Promise<{ id: string }> {
  const col = await resourcesCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    projectId: new ObjectId(input.projectId),
    kind: "link",
    title: input.title.trim(),
    description: trimOrUndef(input.description),
    url: input.url.trim(),
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString() };
}

export async function createFileResource(
  input: CreateFileResourceInput
): Promise<{ id: string }> {
  const col = await resourcesCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    projectId: new ObjectId(input.projectId),
    kind: "file",
    title: input.title.trim(),
    description: trimOrUndef(input.description),
    url: input.url,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    wordpressMediaId: input.wordpressMediaId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString() };
}

export async function deleteResource(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await resourcesCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}
