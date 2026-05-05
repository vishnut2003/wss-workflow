"use server";

import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/lib/auth";
import {
  emailExists,
  findUserById,
  updateUserPassword,
  updateUserProfile,
  verifyUserPassword,
} from "@/lib/models/user";

export type UpdateProfileState = {
  error?: string;
  ok?: boolean;
};

export type UpdatePasswordState = {
  error?: string;
  ok?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateProfileAction(
  _prev: UpdateProfileState | undefined,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  if (session.user.role === "super_admin") {
    return { error: "Super admin profile cannot be edited from here." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name) return { error: "Name is required." };
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "A valid email is required." };
  }

  const me = await findUserById(session.user.id);
  if (!me) return { error: "User not found." };

  if (email !== me.email && (await emailExists(email))) {
    return { error: "That email is already in use." };
  }

  try {
    const ok = await updateUserProfile(session.user.id, { name, email });
    if (!ok) return { error: "Could not update your profile." };
  } catch {
    return { error: "Could not update your profile. Please try again." };
  }

  try {
    await unstable_update({ user: { name, email } });
  } catch {
    // Session refresh is best-effort; the page revalidation below will
    // still pick up the new values on the next server render.
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updatePasswordAction(
  _prev: UpdatePasswordState | undefined,
  formData: FormData
): Promise<UpdatePasswordState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  if (session.user.role === "super_admin") {
    return { error: "Super admin password cannot be reset from here." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!currentPassword) return { error: "Current password is required." };
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirm) return { error: "Passwords do not match." };
  if (newPassword === currentPassword) {
    return { error: "New password must be different from the current password." };
  }

  const valid = await verifyUserPassword(session.user.id, currentPassword);
  if (!valid) return { error: "Current password is incorrect." };

  try {
    const ok = await updateUserPassword(session.user.id, newPassword);
    if (!ok) return { error: "Could not update your password." };
  } catch {
    return { error: "Could not update your password. Please try again." };
  }

  return { ok: true };
}
