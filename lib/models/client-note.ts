import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import type { ClientNoteListItem } from "@/lib/clients/note-types";
import type { UserDoc } from "@/lib/models/user";

export type ClientNoteDoc = {
  _id: ObjectId;
  clientId: ObjectId;
  body: string;
  pinned?: boolean;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateClientNoteInput = {
  clientId: string;
  body: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
};

let indexEnsured = false;

async function notesCollection(): Promise<Collection<ClientNoteDoc>> {
  const db = await getDb();
  const col = db.collection<ClientNoteDoc>("clientNotes");
  if (!indexEnsured) {
    await col.createIndex({ clientId: 1, createdAt: -1 });
    await col.createIndex({ clientId: 1, pinned: 1, createdAt: -1 });
    indexEnsured = true;
  }
  return col;
}

function toListItem(d: WithId<ClientNoteDoc>): ClientNoteListItem {
  return {
    id: d._id.toString(),
    clientId: d.clientId.toString(),
    body: d.body ?? "",
    pinned: Boolean(d.pinned),
    authorId: d.authorId,
    authorName: d.authorName ?? "",
    authorEmail: d.authorEmail ?? "",
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
    updatedAt: (d.updatedAt instanceof Date ? d.updatedAt : new Date()).toISOString(),
  };
}

export async function listNotesForClient(
  clientId: string
): Promise<ClientNoteListItem[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const col = await notesCollection();
  const docs = await col
    .find({ clientId: new ObjectId(clientId) })
    .sort({ pinned: -1, createdAt: -1 })
    .toArray();

  if (docs.length === 0) return [];

  const missingAuthor = docs.filter((d) => !d.authorName && !d.authorEmail);
  if (missingAuthor.length > 0) {
    const userIds = Array.from(
      new Set(
        missingAuthor
          .map((d) => d.authorId)
          .filter((id) => ObjectId.isValid(id))
      )
    ).map((hex) => new ObjectId(hex));

    if (userIds.length > 0) {
      const db = await getDb();
      const users = await db
        .collection<UserDoc>("users")
        .find(
          { _id: { $in: userIds } },
          { projection: { password: 0 } }
        )
        .toArray();
      const userMap = new Map<string, WithId<UserDoc>>();
      for (const u of users) userMap.set(u._id.toHexString(), u);
      for (const d of missingAuthor) {
        const u = userMap.get(d.authorId);
        if (u) {
          d.authorName = u.name ?? "";
          d.authorEmail = u.email;
        }
      }
    }
  }

  return docs.map(toListItem);
}

export async function findNoteById(id: string): Promise<ClientNoteDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await notesCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createNote(
  input: CreateClientNoteInput
): Promise<{ id: string } | null> {
  if (!ObjectId.isValid(input.clientId)) return null;
  const col = await notesCollection();
  const now = new Date();
  const result = await col.insertOne({
    _id: new ObjectId(),
    clientId: new ObjectId(input.clientId),
    body: input.body.trim(),
    pinned: false,
    authorId: input.authorId,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString() };
}

export async function updateNoteBody(
  id: string,
  body: string
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await notesCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { body: body.trim(), updatedAt: new Date() } }
  );
  return res.matchedCount === 1;
}

export async function setNotePinned(
  id: string,
  pinned: boolean
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await notesCollection();
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { pinned, updatedAt: new Date() } }
  );
  return res.matchedCount === 1;
}

export async function deleteNote(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await notesCollection();
  const res = await col.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount === 1;
}
