import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import type { Role } from "@/lib/auth/roles";
import {
  getPermissionOverrides,
  type PermissionOverrides,
} from "@/lib/models/permission";
import { CAPABILITIES, defaultFor } from "./registry";

const loadOverrides = cache(
  async (): Promise<PermissionOverrides> => getPermissionOverrides()
);

export function resolveCapability(
  overrides: PermissionOverrides,
  role: Role,
  capabilityId: string
): boolean {
  if (role === "super_admin") return true;
  const explicit = overrides[role]?.[capabilityId];
  if (typeof explicit === "boolean") return explicit;
  return defaultFor(capabilityId, role);
}

export async function can(role: Role, capabilityId: string): Promise<boolean> {
  if (role === "super_admin") return true;
  const overrides = await loadOverrides();
  return resolveCapability(overrides, role, capabilityId);
}

export async function getEffectiveCapabilities(
  role: Role
): Promise<Set<string>> {
  if (role === "super_admin") {
    return new Set(CAPABILITIES.map((c) => c.id));
  }
  const overrides = await loadOverrides();
  const out = new Set<string>();
  for (const cap of CAPABILITIES) {
    if (resolveCapability(overrides, role, cap.id)) out.add(cap.id);
  }
  return out;
}

export async function requireCan(capabilityId: string) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const allowed = await can(session.user.role, capabilityId);
  if (!allowed) redirect("/forbidden");
  return session;
}

export async function sessionCan(capabilityId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  return can(session.user.role, capabilityId);
}
