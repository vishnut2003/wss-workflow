"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isRole } from "@/lib/auth/roles";
import { isCapabilityId } from "@/lib/permissions/registry";
import {
  resetAllOverrides,
  setRoleCapabilityOverride,
  type PermissionOverrides,
} from "@/lib/models/permission";

export type PermissionActionState = {
  error?: string;
  ok?: boolean;
  overrides?: PermissionOverrides;
};

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in." as const };
  }
  if (session.user.role !== "super_admin") {
    return { error: "Only a super admin can manage permissions." as const };
  }
  return { session };
}

export async function toggleCapabilityAction(
  input: { role: string; capabilityId: string; value: "true" | "false" | "default" }
): Promise<PermissionActionState> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error };

  const roleRaw = input.role.trim();
  const capabilityId = input.capabilityId.trim();
  const valueRaw = input.value;

  if (!isRole(roleRaw)) return { error: "Invalid role." };
  if (roleRaw === "super_admin") {
    return { error: "Super admin permissions cannot be modified." };
  }
  if (!isCapabilityId(capabilityId)) {
    return { error: "Unknown capability." };
  }

  let next: boolean | null;
  if (valueRaw === "true") next = true;
  else if (valueRaw === "false") next = false;
  else if (valueRaw === "default") next = null;
  else return { error: "Invalid value." };

  let overrides: PermissionOverrides;
  try {
    overrides = await setRoleCapabilityOverride(
      roleRaw,
      capabilityId,
      next,
      auth.session.user.id
    );
  } catch {
    return { error: "Could not save the change. Please try again." };
  }

  revalidatePath("/dashboard/permissions");
  revalidatePath("/dashboard", "layout");
  return { ok: true, overrides };
}

export async function resetPermissionsAction(): Promise<PermissionActionState> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error };

  try {
    await resetAllOverrides(auth.session.user.id);
  } catch {
    return { error: "Could not reset permissions. Please try again." };
  }

  revalidatePath("/dashboard/permissions");
  revalidatePath("/dashboard", "layout");
  return { ok: true, overrides: {} };
}
