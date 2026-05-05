import { requireRole } from "@/lib/auth/session";
import { listMembers } from "@/lib/models/user";
import { AddMemberDialog } from "./_components/add-member-dialog";
import { MembersList } from "./_components/members-list";

export default async function MembersPage() {
  const session = await requireRole("admin");
  const members = await listMembers();
  const canAssignAdmin = session.user.role === "super_admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage workspace members and their access levels.
          </p>
        </div>
        <AddMemberDialog canAssignAdmin={canAssignAdmin} />
      </div>

      <MembersList
        members={members}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
