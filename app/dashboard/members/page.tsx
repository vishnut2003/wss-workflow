import { requireCan } from "@/lib/permissions/check";
import { listManagers, listMembers } from "@/lib/models/user";
import { MembersPageContent } from "./_components/members-page-content";

export default async function MembersPage() {
  const session = await requireCan("pages.members");
  const [members, allManagers] = await Promise.all([listMembers(), listManagers()]);
  const managers = allManagers.filter((m) => m.role === "manager");
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
