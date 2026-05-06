import { requireRole } from "@/lib/auth/session";
import { listManagers, listMembers } from "@/lib/models/user";
import { MembersPageContent } from "./_components/members-page-content";

export default async function MembersPage() {
  const session = await requireRole("admin");
  const [members, managers] = await Promise.all([listMembers(), listManagers()]);
  const canAssignAdmin = session.user.role === "super_admin";

  return (
    <MembersPageContent
      members={members}
      managers={managers}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      canAssignAdmin={canAssignAdmin}
    />
  );
}
