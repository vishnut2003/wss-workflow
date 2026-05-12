import { notFound } from "next/navigation";

import { requireCan } from "@/lib/permissions/check";
import { findClientListItemForUser } from "@/lib/models/client";
import { listNotesForClient } from "@/lib/models/client-note";

import { NoteComposer } from "./_components/note-composer";
import { NotesFeed } from "./_components/notes-feed";

export default async function ClientNotesPage({
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

  const notes = await listNotesForClient(clientId);
  const clientLabel = client.company || client.name || "this client";
  const currentUserId = session.user.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Notes
        </h1>
        <p className="text-sm text-muted-foreground">
          Internal journal for {clientLabel}. {notes.length}{" "}
          {notes.length === 1 ? "note" : "notes"} on file.
        </p>
      </div>

      <NoteComposer clientId={clientId} />
      <NotesFeed notes={notes} currentUserId={currentUserId} />
    </div>
  );
}
