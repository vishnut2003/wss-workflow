"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasAtLeast, isRole, type Role } from "@/lib/auth/roles";
import { createUser, emailExists } from "@/lib/models/user";

export type AddMemberState = {
  error?: string;
  ok?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addMemberAction(
  _prev: AddMemberState | undefined,
  formData: FormData
): Promise<AddMemberState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to add members." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "");

  if (!name) return { error: "Name is required." };
  if (!email || !EMAIL_RE.test(email)) return { error: "A valid email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!isRole(roleRaw)) return { error: "Invalid role." };
  const role: Role = roleRaw;

  const actorRole = session.user.role;
  // Only super_admin can create admins or other super_admins.
  if ((role === "admin" || role === "super_admin") && actorRole !== "super_admin") {
    return { error: "Only a super admin can assign that role." };
  }

  if (await emailExists(email)) {
    return { error: "A user with that email already exists." };
  }

  try {
    await createUser({
      name,
      email,
      password,
      role,
      createdBy: session.user.id,
    });
  } catch {
    return { error: "Could not create the member. Please try again." };
  }

  revalidatePath("/dashboard/members");
  return { ok: true };
}
