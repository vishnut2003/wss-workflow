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

import { deleteTaskAction, type TaskFormState } from "../actions";

export function DeleteTaskDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  taskTitle: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {open && taskId ? (
          <DeleteTaskForm
            taskId={taskId}
            taskTitle={taskTitle}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteTaskForm({
  taskId,
  taskTitle,
  onSuccess,
}: {
  taskId: string;
  taskTitle: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(deleteTaskAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="contents">
      <input type="hidden" name="taskId" value={taskId} />

      <AlertDialogHeader>
        <AlertDialogMedia className="bg-destructive/10 text-destructive">
          <Trash2 />
        </AlertDialogMedia>
        <AlertDialogTitle>Delete task?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete{" "}
          <span className="font-semibold text-foreground">
            {taskTitle || "this task"}
          </span>
          . This action cannot be undone.
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
          {pending ? "Deleting..." : "Delete task"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </form>
  );
}
