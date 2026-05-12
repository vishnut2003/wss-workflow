import "server-only";
import { type Collection } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { ROLES, isRole, type Role } from "@/lib/auth/roles";

export type RoleOverrideMap = Partial<Record<string, boolean>>;
export type PermissionOverrides = Partial<Record<Role, RoleOverrideMap>>;

type PermissionDoc = {
  _id: string;
  overrides: PermissionOverrides;
  updatedAt: Date;
  updatedBy?: string;
};

const DOC_ID = "global";

async function permissionsCollection(): Promise<Collection<PermissionDoc>> {
  const db = await getDb();
  return db.collection<PermissionDoc>("permissions");
}

/**
 * Capability ids contain dots (e.g. "pages.dashboard"). MongoDB interprets dots
 * in field paths as nested object keys, so a naive `$set: {"overrides.admin.pages.dashboard": true}`
 * stores a nested tree instead of a flat `{ "pages.dashboard": true }`. To stay
 * safe in either case, this normalizer walks whatever shape the doc has and
 * flattens it back into `{ role: { capabilityId: boolean } }`.
 */
function flatten(input: unknown): RoleOverrideMap {
  const out: RoleOverrideMap = {};
  function walk(node: unknown, prefix: string[]) {
    if (typeof node === "boolean") {
      if (prefix.length > 0) out[prefix.join(".")] = node;
      return;
    }
    if (node && typeof node === "object" && !Array.isArray(node)) {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        walk(value, [...prefix, key]);
      }
    }
  }
  walk(input, []);
  return out;
}

function normalizeOverrides(raw: unknown): PermissionOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: PermissionOverrides = {};
  for (const [role, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isRole(role)) continue;
    out[role] = flatten(value);
  }
  return out;
}

export async function getPermissionOverrides(): Promise<PermissionOverrides> {
  const col = await permissionsCollection();
  const doc = await col.findOne({ _id: DOC_ID });
  return normalizeOverrides(doc?.overrides);
}

export async function setRoleCapabilityOverride(
  role: Role,
  capabilityId: string,
  value: boolean | null,
  updatedBy: string | undefined
): Promise<PermissionOverrides> {
  const col = await permissionsCollection();

  // Read–modify–write the whole overrides object. This avoids dot-path
  // interpretation issues for capability ids that contain ".".
  const existing = await col.findOne({ _id: DOC_ID });
  const overrides = normalizeOverrides(existing?.overrides);

  const roleMap: RoleOverrideMap = { ...(overrides[role] ?? {}) };
  if (value === null) {
    delete roleMap[capabilityId];
  } else {
    roleMap[capabilityId] = value;
  }
  if (Object.keys(roleMap).length === 0) {
    delete overrides[role];
  } else {
    overrides[role] = roleMap;
  }

  // Ensure every known role key is at least present-or-absent — clear any
  // stale nested junk by replacing the field wholesale.
  const sanitized: PermissionOverrides = {};
  for (const r of ROLES) {
    if (overrides[r] && Object.keys(overrides[r]!).length > 0) {
      sanitized[r] = overrides[r];
    }
  }

  await col.updateOne(
    { _id: DOC_ID },
    {
      $set: {
        overrides: sanitized,
        updatedAt: new Date(),
        updatedBy,
      },
      $setOnInsert: { _id: DOC_ID },
    },
    { upsert: true }
  );

  return sanitized;
}

export async function resetAllOverrides(
  updatedBy: string | undefined
): Promise<void> {
  const col = await permissionsCollection();
  await col.updateOne(
    { _id: DOC_ID },
    {
      $set: {
        overrides: {},
        updatedAt: new Date(),
        updatedBy,
      },
      $setOnInsert: { _id: DOC_ID },
    },
    { upsert: true }
  );
}
