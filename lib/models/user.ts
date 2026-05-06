import "server-only";
import { ObjectId, type Collection, type UpdateFilter, type WithId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/mongodb";
import { isRole, type Role } from "@/lib/auth/roles";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  password: string;
  name?: string;
  role: Role;
  managerId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
};

export type MemberListItem = {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId: string | null;
  managerName: string | null;
  createdAt: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role: Role;
  managerId?: string;
  createdBy?: string;
};

let indexEnsured = false;

async function usersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  const col = db.collection<UserDoc>("users");
  if (!indexEnsured) {
    await col.createIndex({ email: 1 }, { unique: true });
    await col.createIndex({ managerId: 1 });
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

export async function findUserById(id: string): Promise<UserDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await usersCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function deleteUserById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await usersCollection();
  const objectId = new ObjectId(id);
  const res = await col.deleteOne({ _id: objectId });
  if (res.deletedCount === 1) {
    await col.updateMany(
      { managerId: objectId },
      { $unset: { managerId: "" }, $set: { updatedAt: new Date() } }
    );
  }
  return res.deletedCount === 1;
}

export async function updateUserRole(id: string, role: Role): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await usersCollection();
  const objectId = new ObjectId(id);
  const update: UpdateFilter<UserDoc> =
    role !== "member"
      ? {
          $set: { role, updatedAt: new Date() },
          $unset: { managerId: "" },
        }
      : { $set: { role, updatedAt: new Date() } };
  const res = await col.updateOne({ _id: objectId }, update);
  if (res.matchedCount === 1 && role === "member") {
    await col.updateMany(
      { managerId: objectId },
      { $unset: { managerId: "" }, $set: { updatedAt: new Date() } }
    );
  }
  return res.matchedCount === 1;
}

export async function updateUserPassword(id: string, password: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await usersCollection();
  const hashed = await bcrypt.hash(password, 12);
  const res = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { password: hashed, updatedAt: new Date() } }
  );
  return res.matchedCount === 1;
}

export async function verifyUserPassword(id: string, password: string): Promise<boolean> {
  const user = await findUserById(id);
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}

export type UpdateUserProfileInput = {
  name?: string;
  email?: string;
};

export async function updateUserProfile(
  id: string,
  data: UpdateUserProfileInput
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const update: Partial<Pick<UserDoc, "name" | "email" | "updatedAt">> = {
    updatedAt: new Date(),
  };
  if (typeof data.name === "string") update.name = data.name.trim();
  if (typeof data.email === "string") update.email = data.email.trim().toLowerCase();
  const col = await usersCollection();
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
  return res.matchedCount === 1;
}

export async function emailExists(email: string): Promise<boolean> {
  const col = await usersCollection();
  const found = await col.findOne(
    { email: email.trim().toLowerCase() },
    { projection: { _id: 1 } }
  );
  return found !== null;
}

type RawMember = WithId<Omit<UserDoc, "password">>;

function toMemberListItem(
  d: RawMember,
  managerNameById: Map<string, string>
): MemberListItem {
  const managerHex = d.managerId instanceof ObjectId ? d.managerId.toHexString() : null;
  return {
    id: d._id.toString(),
    email: d.email,
    name: d.name ?? "",
    role: isRole(d.role) ? d.role : "member",
    managerId: managerHex,
    managerName: managerHex ? managerNameById.get(managerHex) ?? null : null,
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date()).toISOString(),
  };
}

async function buildManagerNameMap(
  col: Collection<UserDoc>,
  docs: RawMember[]
): Promise<Map<string, string>> {
  const ids = new Set<string>();
  for (const d of docs) {
    if (d.managerId instanceof ObjectId) ids.add(d.managerId.toHexString());
  }
  if (ids.size === 0) return new Map();
  const managers = await col
    .find(
      { _id: { $in: Array.from(ids).map((hex) => new ObjectId(hex)) } },
      { projection: { name: 1, email: 1 } }
    )
    .toArray();
  const map = new Map<string, string>();
  for (const m of managers) {
    const label = (m.name ?? "").trim() || m.email;
    map.set(m._id.toHexString(), label);
  }
  return map;
}

export async function listMembers(): Promise<MemberListItem[]> {
  const col = await usersCollection();
  const docs = await col
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const managerNameById = await buildManagerNameMap(col, docs);
  return docs.map((d) => toMemberListItem(d, managerNameById));
}

export async function listMembersForManager(
  managerId: string
): Promise<MemberListItem[]> {
  if (!ObjectId.isValid(managerId)) return [];
  const col = await usersCollection();
  const docs = await col
    .find(
      { managerId: new ObjectId(managerId), role: "member" },
      { projection: { password: 0 } }
    )
    .sort({ createdAt: -1 })
    .toArray();

  const managerNameById = await buildManagerNameMap(col, docs);
  return docs.map((d) => toMemberListItem(d, managerNameById));
}

export async function listManagers(): Promise<MemberListItem[]> {
  const col = await usersCollection();
  const managerRoles: Role[] = ["manager", "admin"];
  const docs = await col
    .find(
      { role: { $in: managerRoles } },
      { projection: { password: 0 } }
    )
    .sort({ name: 1 })
    .toArray();

  const managerNameById = await buildManagerNameMap(col, docs);
  return docs.map((d) => toMemberListItem(d, managerNameById));
}

export async function isManagerId(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await usersCollection();
  const doc = await col.findOne(
    { _id: new ObjectId(id), role: "manager" },
    { projection: { _id: 1 } }
  );
  return doc !== null;
}

export async function setMemberManager(
  memberId: string,
  managerId: string | null
): Promise<boolean> {
  if (!ObjectId.isValid(memberId)) return false;
  const col = await usersCollection();
  const update: UpdateFilter<UserDoc> =
    managerId && ObjectId.isValid(managerId)
      ? { $set: { managerId: new ObjectId(managerId), updatedAt: new Date() } }
      : { $set: { updatedAt: new Date() }, $unset: { managerId: "" } };
  const res = await col.updateOne({ _id: new ObjectId(memberId) }, update);
  return res.matchedCount === 1;
}

export async function createUser(input: CreateUserInput): Promise<{ id: string }> {
  const col = await usersCollection();
  const email = input.email.trim().toLowerCase();
  const now = new Date();
  const hashed = await bcrypt.hash(input.password, 12);

  const managerId =
    input.role === "member" && input.managerId && ObjectId.isValid(input.managerId)
      ? new ObjectId(input.managerId)
      : undefined;

  const result = await col.insertOne({
    _id: new ObjectId(),
    email,
    password: hashed,
    name: input.name.trim(),
    role: input.role,
    ...(managerId ? { managerId } : {}),
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  });

  return { id: result.insertedId.toString() };
}
