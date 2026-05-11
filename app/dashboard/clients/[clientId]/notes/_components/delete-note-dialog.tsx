"use client";

import { useActionState, useEffect } from "react";
import { AlertCircle, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteNoteAction, type NoteFormState } from "../actions";

export function DeleteNoteDialog({
  open,
  onOpenChange,
  noteId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string | null;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {open && noteId ? (
          <DeleteNoteForm
            noteId={noteId}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteNoteForm({
  noteId,
  onSuccess,
}: {
  noteId: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<
    NoteFormState | undefined,
    FormData
  >(deleteNoteAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="contents">
      <input type="hidden" name="noteId" value={noteId} />

      <AlertDialogHeader>
        <AlertDialogMedia className="bg-destructive/10 text-destructive">
          <Trash2 />
        </AlertDialogMedia>
        <AlertDialogTitle>Delete note?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete this note. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          type="submit"
          disabled={pending}
          variant="destructive"
        >
          {pending ? "Deleting..." : "Delete note"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </form>
  );
}
