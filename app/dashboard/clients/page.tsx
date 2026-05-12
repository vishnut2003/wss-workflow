import { can, requireCan } from "@/lib/permissions/check";
import { listClientsForUser } from "@/lib/models/client";
import { listAssignableMembers } from "@/lib/models/user";
import { AddClientDialog } from "./_components/add-client-dialog";
import { ClientsList } from "./_components/clients-list";

export default async function ClientsPage() {
  const session = await requireCan("pages.clients");
  const role = session.user.role;
  const [clients, canManage, canAssign] = await Promise.all([
    listClientsForUser(session.user.id, role),
    can(role, "clients.create"),
    can(role, "clients.assign"),
  ]);
  const assignableMembers = canAssign ? await listAssignableMembers() : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the companies and people you work with.
          </p>
        </div>
        {canManage ? (
          <AddClientDialog
            canAssign={canAssign}
            assignableMembers={assignableMembers}
          />
        ) : null}
      </div>

      <ClientsList
        clients={clients}
        canManage={canManage}
        canAssign={canAssign}
        assignableMembers={assignableMembers}
      />
    </div>
  );
}
