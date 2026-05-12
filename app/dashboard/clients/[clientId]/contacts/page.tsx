import { notFound } from "next/navigation";

import { requireCan } from "@/lib/permissions/check";
import { findClientListItemForUser } from "@/lib/models/client";
import { listContactsForClient } from "@/lib/models/client-contact";

import { AddContactDialog } from "./_components/add-contact-dialog";
import { ContactsList } from "./_components/contacts-list";

export default async function ClientContactsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await requireCan("pages.clients");
  const { clientId } = await params;
  const client = await findClientListItemForUser(
    clientId,
    session.user.id,
    session.user.role
  );
  if (!client) notFound();

  const contacts = await listContactsForClient(clientId);
  const clientLabel = client.company || client.name || "this client";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Contacts
          </h1>
          <p className="text-sm text-muted-foreground">
            People at {clientLabel}. {contacts.length}{" "}
            {contacts.length === 1 ? "contact" : "contacts"} on file.
          </p>
        </div>
        <AddContactDialog clientId={clientId} />
      </div>

      <ContactsList contacts={contacts} />
    </div>
  );
}
