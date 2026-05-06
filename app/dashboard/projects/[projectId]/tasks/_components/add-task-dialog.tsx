"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskPriority,
} from "@/lib/tasks/types";

import { createTaskAction, type TaskFormState } from "../actions";

const NO_ASSIGNEE = "__none__";

type ProjectMemberOption = {
  id: string;
  name: string;
  email: string;
};

export function AddTaskDialog({
  projectId,
  members,
}: {
  projectId: string;
  members: ProjectMemberOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105">
            <Plus />
            New task
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a task</DialogTitle>
          <DialogDescription>
            Add a task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <AddTaskForm
            projectId={projectId}
            members={members}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddTaskForm({
  projectId,
  members,
  onSuccess,
}: {
  projectId: string;
  members: ProjectMemberOption[];
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>(NO_ASSIGNEE);
  const [dueDate, setDueDate] = useState("");

  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(createTaskAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="priority" value={priority} />
      <input
        type="hidden"
        name="assigneeId"
        value={assigneeId === NO_ASSIGNEE ? "" : assigneeId}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Wire up the login form"
          maxLength={200}
          disabled={pending}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — what needs to happen?"
          rows={3}
          maxLength={5000}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Assignee</Label>
          <Select
            value={assigneeId}
            onValueChange={(v) => setAssigneeId(String(v))}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ASSIGNEE}>Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name?.trim() || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {members.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No team members on this project yet — add them in the Team tab.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(String(v) as TaskPriority)}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-due-date">Due date</Label>
        <Input
          id="task-due-date"
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={pending}
        />
      </div>

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
          {pending ? "Creating..." : "Create task"}
        </Button>
      </DialogFooter>
    </form>
  );
}
