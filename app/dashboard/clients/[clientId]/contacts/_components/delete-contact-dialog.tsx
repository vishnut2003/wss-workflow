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

import { deleteContactAction, type ContactFormState } from "../actions";

export function DeleteContactDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  contactName: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {open && contactId ? (
          <DeleteContactForm
            contactId={contactId}
            contactName={contactName}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteContactForm({
  contactId,
  contactName,
  onSuccess,
}: {
  contactId: string;
  contactName: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<
    ContactFormState | undefined,
    FormData
  >(deleteContactAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="contents">
      <input type="hidden" name="contactId" value={contactId} />

      <AlertDialogHeader>
        <AlertDialogMedia className="bg-destructive/10 text-destructive">
          <Trash2 />
        </AlertDialogMedia>
        <AlertDialogTitle>Delete contact?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove{" "}
          <span className="font-semibold text-foreground">
            {contactName || "this contact"}
          </span>{" "}
          from this client. This action cannot be undone.
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
          {pending ? "Deleting..." : "Delete contact"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </form>
  );
}
