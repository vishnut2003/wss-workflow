import "server-only";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/config";
import { hasAtLeast, type Role } from "@/lib/auth/roles";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  return session;
}

export async function requireRole(required: Role) {
  const session = await requireSession();
  if (!hasAtLeast(session.user.role, required)) redirect("/forbidden");
  return session;
}

export async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/auth/login" });
}
