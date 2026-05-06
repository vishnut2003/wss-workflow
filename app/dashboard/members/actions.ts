"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasAtLeast, isRole, type Role } from "@/lib/auth/roles";
import {
  createUser,
  deleteUserById,
  emailExists,
  findUserById,
  isManagerId,
  setMemberManager,
  updateUserPassword,
  updateUserRole,
} from "@/lib/models/user";

export type AddMemberState = {
  error?: string;
  ok?: boolean;
};

export type DeleteMemberState = {
  error?: string;
  ok?: boolean;
};

export type ResetPasswordState = {
  error?: string;
  ok?: boolean;
};

export type UpdateRoleState = {
  error?: string;
  ok?: boolean;
};

export type AssignManagerState = {
  error?: string;
  ok?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_RANK: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  member: 1,
};

function canManage(actorRole: Role, targetRole: Role): boolean {
  if (!hasAtLeast(actorRole, "admin")) return false;
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

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
  const managerIdRaw = String(formData.get("managerId") ?? "").trim();

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

  let managerId: string | undefined;
  if (managerIdRaw) {
    if (role !== "member") {
      return { error: "Only team members can be assigned to a manager." };
    }
    if (!(await isManagerId(managerIdRaw))) {
      return { error: "Selected manager is invalid." };
    }
    managerId = managerIdRaw;
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
      managerId,
      createdBy: session.user.id,
    });
  } catch {
    return { error: "Could not create the member. Please try again." };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function assignManagerAction(
  _prev: AssignManagerState | undefined,
  formData: FormData
): Promise<AssignManagerState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to change a member's manager." };
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  const managerIdRaw = String(formData.get("managerId") ?? "").trim();
  if (!memberId) return { error: "Missing member id." };

  const target = await findUserById(memberId);
  if (!target) return { error: "Member not found." };
  if (target.role !== "member") {
    return { error: "Only team members can be assigned to a manager." };
  }

  let managerId: string | null = null;
  if (managerIdRaw) {
    if (managerIdRaw === memberId) {
      return { error: "A member cannot be their own manager." };
    }
    if (!(await isManagerId(managerIdRaw))) {
      return { error: "Selected manager is invalid." };
    }
    managerId = managerIdRaw;
  }

  try {
    const ok = await setMemberManager(memberId, managerId);
    if (!ok) return { error: "Could not update the manager." };
  } catch {
    return { error: "Could not update the manager. Please try again." };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function deleteMemberAction(
  _prev: DeleteMemberState | undefined,
  formData: FormData
): Promise<DeleteMemberState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to delete members." };
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) return { error: "Missing member id." };

  if (memberId === session.user.id) {
    return { error: "You cannot delete your own account." };
  }

  const target = await findUserById(memberId);
  if (!target) return { error: "Member not found." };

  const targetRole: Role = isRole(target.role) ? target.role : "member";
  if (!canManage(session.user.role, targetRole)) {
    return { error: "You do not have permission to delete this member." };
  }

  try {
    const ok = await deleteUserById(memberId);
    if (!ok) return { error: "Member could not be deleted." };
  } catch {
    return { error: "Could not delete the member. Please try again." };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function resetPasswordAction(
  _prev: ResetPasswordState | undefined,
  formData: FormData
): Promise<ResetPasswordState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to reset passwords." };
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!memberId) return { error: "Missing member id." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  if (memberId === session.user.id) {
    return { error: "Use your account settings to change your own password." };
  }

  const target = await findUserById(memberId);
  if (!target) return { error: "Member not found." };

  const targetRole: Role = isRole(target.role) ? target.role : "member";
  if (!canManage(session.user.role, targetRole)) {
    return { error: "You do not have permission to reset this member's password." };
  }

  try {
    const ok = await updateUserPassword(memberId, password);
    if (!ok) return { error: "Password could not be updated." };
  } catch {
    return { error: "Could not update the password. Please try again." };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function updateMemberRoleAction(
  _prev: UpdateRoleState | undefined,
  formData: FormData
): Promise<UpdateRoleState> {
  const session = await auth();
  if (!session?.user || !hasAtLeast(session.user.role, "admin")) {
    return { error: "You do not have permission to change roles." };
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "");
  if (!memberId) return { error: "Missing member id." };
  if (!isRole(roleRaw)) return { error: "Invalid role." };
  const newRole: Role = roleRaw;

  if (newRole === "super_admin") {
    return { error: "Super admin cannot be assigned." };
  }

  if (memberId === session.user.id) {
    return { error: "You cannot change your own role." };
  }

  const target = await findUserById(memberId);
  if (!target) return { error: "Member not found." };
  const targetRole: Role = isRole(target.role) ? target.role : "member";

  if (!canManage(session.user.role, targetRole)) {
    return { error: "You do not have permission to change this member's role." };
  }

  if (ROLE_RANK[newRole] >= ROLE_RANK[session.user.role]) {
    return { error: "You can only assign roles below your own." };
  }

  if (newRole === targetRole) {
    return { error: "Member already has that role." };
  }

  try {
    const ok = await updateUserRole(memberId, newRole);
    if (!ok) return { error: "Role could not be updated." };
  } catch {
    return { error: "Could not update the role. Please try again." };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/team");
  return { ok: true };
}
