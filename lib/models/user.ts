import "server-only";
import { ObjectId, type Collection, type WithId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/mongodb";
import { isRole, type Role } from "@/lib/auth/roles";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  password: string;
  name?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
};

export type MemberListItem = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
  createdBy?: string;
};

let indexEnsured = false;

async function usersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  const col = db.collection<UserDoc>("users");
  if (!indexEnsured) {
    await col.createIndex({ email: 1 }, { unique: true });
    indexEnsured = true;
  }
  return col;
}

export async function findUserByEmail(emailRaw: string): Promise<UserDoc | null> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return null;
  const col = await usersCollection();
  return col.findOne({ email });
}

export async function emailExists(email: string): Promise<boolean> {
  const col = await usersCollection();
  const found = await col.findOne(
    { email: email.trim().toLowerCase() },
    { projection: { _id: 1 } }
  );
  return found !== null;
}

export async function listMembers(): Promise<MemberListItem[]> {
  const col = await usersCollection();
  const docs = await col
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((d: WithId<Omit<UserDoc, "password">>) => ({
    id: d._id.toString(),
    email: d.email,
    name: d.name ?? "",
    role: isRole(d.role) ? d.role : "member",
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
  }));
}

export async function createUser(input: CreateUserInput): Promise<{ id: string }> {
  const col = await usersCollection();
  const email = input.email.trim().toLowerCase();
  const now = new Date();
  const hashed = await bcrypt.hash(input.password, 12);

  const result = await col.insertOne({
    _id: new ObjectId(),
    email,
    password: hashed,
    name: input.name.trim(),
    role: input.role,
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  });

  return { id: result.insertedId.toString() };
}
