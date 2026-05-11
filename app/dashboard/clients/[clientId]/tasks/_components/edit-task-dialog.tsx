"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientTaskListItem } from "@/lib/clients/task-types";

import { updateTaskAction, type TaskFormState } from "../actions";
import {
  TaskFormFields,
  type TaskAssigneeOption,
  type TaskFormValues,
} from "./task-form-fields";

function taskToValues(task: ClientTaskListItem): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    assigneeId: task.assignee?.id ?? "",
  };
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  assignees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ClientTaskListItem | null;
  assignees: TaskAssigneeOption[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update title, due date, or assignee.
          </DialogDescription>
        </DialogHeader>

        {open && task ? (
          <EditTaskForm
            task={task}
            assignees={assignees}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditTaskForm({
  task,
  assignees,
  onSuccess,
}: {
  task: ClientTaskListItem;
  assignees: TaskAssigneeOption[];
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<TaskFormValues>(() => taskToValues(task));
  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(updateTaskAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const update = <K extends keyof TaskFormValues>(
    key: K,
    value: TaskFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="taskId" value={task.id} />

      <TaskFormFields
        values={values}
        onChange={update}
        assignees={assignees}
        disabled={pending}
        idPrefix="edit-task"
      />

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
