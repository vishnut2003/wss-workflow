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

import { deleteMemberAction, type DeleteMemberState } from "../actions";

export function DeleteMemberDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  memberName: string;
  memberEmail: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {open && memberId ? (
          <DeleteMemberForm
            memberId={memberId}
            memberName={memberName}
            memberEmail={memberEmail}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteMemberForm({
  memberId,
  memberName,
  memberEmail,
  onSuccess,
}: {
  memberId: string;
  memberName: string;
  memberEmail: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<DeleteMemberState | undefined, FormData>(
    deleteMemberAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="contents">
      <input type="hidden" name="memberId" value={memberId} />

      <AlertDialogHeader>
        <AlertDialogMedia className="bg-destructive/10 text-destructive">
          <Trash2 />
        </AlertDialogMedia>
        <AlertDialogTitle>Delete member?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove{" "}
          <span className="font-semibold text-foreground">{memberName}</span>{" "}
          <span className="text-muted-foreground">({memberEmail})</span> from the
          workspace. They will lose access immediately. This action cannot be undone.
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
          {pending ? "Deleting..." : "Delete member"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </form>
  );
}
