import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import {
  isTaskPriority,
  isTaskStatus,
  type TaskAssignee,
  type TaskCommentItem,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";
import type { ProjectDoc } from "@/lib/models/project";
import type { UserDoc } from "@/lib/models/user";

export type TaskCommentDoc = {
  _id: ObjectId;
  authorId: string;
  body: string;
  createdAt: Date;
};

export type TaskDoc = {
  _id: ObjectId;
  projectId: ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: ObjectId;
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  comments: TaskCommentDoc[];
};

export type CreateTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string;
  createdBy: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

let indexEnsured = false;

async function tasksCollection(): Promise<Collection<TaskDoc>> {
  const db = await getDb();
  const col = db.collection<TaskDoc>("tasks");
  if (!indexEnsured) {
    await col.createIndex({ projectId: 1, status: 1, createdAt: -1 });
    await col.createIndex({ assigneeId: 1 });
    indexEnsured = true;
  }
  return col;
}

function trimOrUndef(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function parseDate(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function userLabel(u: WithId<UserDoc>): string {
  const name = u.name?.trim();
  return name && name.length > 0 ? name : u.email;
}

function toListItem(
  doc: WithId<TaskDoc>,
  userMap: Map<string, WithId<UserDoc>>
): TaskListItem {
  const assigneeHex =
    doc.assigneeId instanceof ObjectId ? doc.assigneeId.toHexString() : null;
  const assigneeUser = assigneeHex ? userMap.get(assigneeHex) : null;
  const assignee: TaskAssignee | null = assigneeUser
    ? {
        id: assigneeUser._id.toHexString(),
        name: assigneeUser.name ?? "",
        email: assigneeUser.email,
      }
    : null;

  const creatorUser = ObjectId.isValid(doc.createdBy)
    ? userMap.get(doc.createdBy)
    : undefined;
  const createdByName = creatorUser
    ? userLabel(creatorUser)
    : doc.createdBy === "super_admin"
      ? "Super Admin"
      : "";

  const comments: TaskCommentItem[] = (doc.comments ?? []).map((c) => {
    const author = ObjectId.isValid(c.authorId)
      ? userMap.get(c.authorId)
      : undefined;
    return {
      id: c._id.toHexString(),
      authorId: c.authorId,
      authorName: author
        ? userLabel(author)
        : c.authorId === "super_admin"
          ? "Super Admin"
          : "",
      authorEmail: author?.email ?? "",
      body: c.body,
      createdAt: (c.createdAt instanceof Date
        ? c.createdAt
        : new Date()
      ).toISOString(),
    };
  });

  return {
    id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    title: doc.title,
    description: doc.description ?? "",
    status: isTaskStatus(doc.status) ? doc.status : "todo",
    priority: isTaskPriority(doc.priority) ? doc.priority : "medium",
    assignee,
    dueDate: doc.dueDate instanceof Date ? doc.dueDate.toISOString() : "",
    createdBy: doc.createdBy,
    createdByName,
    createdAt: (doc.createdAt instanceof Date
      ? doc.createdAt
      : new Date()
    ).toISOString(),
    updatedAt: (doc.updatedAt instanceof Date
      ? doc.updatedAt
      : new Date()
    ).toISOString(),
    comments,
  };
}

async function buildUserMap(
  docs: WithId<TaskDoc>[]
): Promise<Map<string, WithId<UserDoc>>> {
  const ids = new Set<string>();
  for (const d of docs) {
    if (d.assigneeId instanceof ObjectId) ids.add(d.assigneeId.toHexString());
    if (ObjectId.isValid(d.createdBy)) ids.add(d.createdBy);
    for (const c of d.comments ?? []) {
      if (ObjectId.isValid(c.authorId)) ids.add(c.authorId);
    }
  }
  if (ids.size === 0) return new Map();

  const db = await getDb();
  const arr = await db
    .collection<UserDoc>("users")
    .find(
      { _id: { $in: Array.from(ids).map((hex) => new ObjectId(hex)) } },
      { projection: { password: 0 } }
    )
    .toArray();
  const map = new Map<string, WithId<UserDoc>>();
  for (const u of arr) map.set(u._id.toHexString(), u);
  return map;
}

export async function listTasksForProject(
  projectId: string
): Promise<TaskListItem[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const col = await tasksCollection();
  const docs = await col
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: 1 })
    .toArray();
  const userMap = await buildUserMap(docs);
  return docs.map((d) => toListItem(d, userMap));
}

export type AssignedProjectTask = TaskListItem & {
  projectName: string;
};

export async function listProjectTasksForAssignee(
  userId: string
): Promise<AssignedProjectTask[]> {
  if (!ObjectId.isValid(userId)) return [];
  const col = await tasksCollection();
  const docs = await col
    .find({ assigneeId: new ObjectId(userId) })
    .sort({ status: 1, dueDate: 1, createdAt: -1 })
    .toArray();
  if (docs.length === 0) return [];

  const userMap = await buildUserMap(docs);
  const tasks = docs.map((d) => toListItem(d, userMap));

  const projectIds = Array.from(
    new Set(docs.map((d) => d.projectId.toHexString()))
  ).map((hex) => new ObjectId(hex));

  const db = await getDb();
  const projects = await db
    .collection<ProjectDoc>("projects")
    .find({ _id: { $in: projectIds } }, { projection: { name: 1 } })
    .toArray();
  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p._id.toHexString(), p.name);

  return tasks.map((task) => ({
    ...task,
    projectName: projectMap.get(task.projectId) ?? "Unknown project",
  }));
}

export async function findTaskForProject(
  taskId: string,
  projectId: string
): Promise<TaskListItem | null> {
  if (!ObjectId.isValid(taskId) || !ObjectId.isValid(projectId)) return null;
  const col = await tasksCollection();
  const doc = await col.findOne({
    _id: new ObjectId(taskId),
    projectId: new ObjectId(projectId),
  });
  if (!doc) return null;
  const userMap = await buildUserMap([doc]);
  return toListItem(doc, userMap);
}

export async function findTaskRaw(taskId: string): Promise<WithId<TaskDoc> | null> {
  if (!ObjectId.isValid(taskId)) return null;
  const col = await tasksCollection();
  return col.findOne({ _id: new ObjectId(taskId) });
}

export async function createTask(
  input: CreateTaskInput
): Promise<{ id: string }> {
  const col = await tasksCollection();
  const now = new Date();
  const assigneeId =
    input.assigneeId && ObjectId.isValid(input.assigneeId)
      ? new ObjectId(input.assigneeId)
      : undefined;
  const result = await col.insertOne({
    _id: new ObjectId(),
    projectId: new ObjectId(input.projectId),
    title: input.title.trim(),
    description: trimOrUndef(input.description),
    status: input.status,
    priority: input.priority,
    assigneeId,
    dueDate: parseDate(input.dueDate),
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    comments: [],
  });
  return { id: result.insertedId.toString() };
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await tasksCollection();
  const $set: Partial<TaskDoc> = { updatedAt: new Date() };
  const $unset: Record<string, ""> = {};

  if (typeof input.title === "string") $set.title = input.title.trim();
  if (typeof input.priority === "string" && isTaskPriority(input.priority)) {
    $set.priority = input.priority;
  }

  if (typeof input.description !== "undefined") {
    const desc = trimOrUndef(input.description);
    if (desc) $set.description = desc;
    else $unset.description = "";
  }

  if (typeof input.assigneeId !== "undefined") {
    if (input.assigneeId && ObjectId.isValid(input.assigneeId)) {
      $set.assigneeId = new ObjectId(input.assigneeId);
    } else {
      $unset.assigneeId = "";
    }
  }

  if (typeof input.dueDate !== "undefined") {
    const due = parseDate(input.dueDate);
    if (due) $set.dueDate = due;
    else $unset.dueDate = "";
  }

  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set, $unset }
  );
  return res.matchedCount === 1;
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await tasksCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );
  return res.matchedCount === 1;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await tasksCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}

export async function addTaskComment(
  taskId: string,
  authorId: string,
  body: string
): Promise<{ id: string } | null> {
  if (!ObjectId.isValid(taskId)) return null;
  const col = await tasksCollection();
  const commentId = new ObjectId();
  const comment: TaskCommentDoc = {
    _id: commentId,
    authorId,
    body: body.trim(),
    createdAt: new Date(),
  };
  const res = await col.updateOne(
    { _id: new ObjectId(taskId) },
    {
      $push: { comments: comment },
      $set: { updatedAt: new Date() },
    }
  );
  return res.matchedCount === 1 ? { id: commentId.toHexString() } : null;
}
