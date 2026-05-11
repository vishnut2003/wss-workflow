"use client";

import { useState } from "react";

import type { ClientNoteListItem } from "@/lib/clients/note-types";

import { DeleteNoteDialog } from "./delete-note-dialog";
import { NoteCard } from "./note-card";

export function NotesFeed({
  notes,
  currentUserId,
}: {
  notes: ClientNoteListItem[];
  currentUserId: string;
}) {
  const [deleteTarget, setDeleteTarget] = useState<ClientNoteListItem | null>(
    null
  );

  const closeDelete = (open: boolean) => {
    if (!open) {
      window.setTimeout(() => setDeleteTarget(null), 150);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
          <span aria-hidden className="text-2xl">
            📝
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">No notes yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Capture context as it happens — decisions, follow-ups, things to
            remember for next time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {notes.map((n) => (
          <li key={n.id}>
            <NoteCard
              note={n}
              isAuthor={n.authorId === currentUserId}
              onRequestDelete={() => setDeleteTarget(n)}
            />
          </li>
        ))}
      </ul>

      <DeleteNoteDialog
        open={deleteTarget !== null}
        onOpenChange={closeDelete}
        noteId={deleteTarget?.id ?? null}
      />
    </>
  );
}
