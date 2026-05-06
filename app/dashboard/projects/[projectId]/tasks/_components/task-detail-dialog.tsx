"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  TASK_STATUS_LABELS,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

import {
  addCommentAction,
  changeTaskStatusAction,
  deleteTaskAction,
  updateTaskAction,
  type TaskFormState,
} from "../actions";

const NO_ASSIGNEE = "__none__";

type ProjectMemberOption = {
  id: string;
  name: string;
  email: string;
};

const STATUS_PILL_CLASS: Record<TaskStatus, string> = {
  todo: "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  in_progress:
    "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  in_review:
    "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  done: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
};

const PRIORITY_PILL_CLASS: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground ring-border",
  medium: "bg-blue-500/15 text-blue-700 ring-blue-500/20 dark:text-blue-300",
  high: "bg-rose-500/15 text-rose-700 ring-rose-500/25 dark:text-rose-300",
};

function initialsOf(nameOrEmail: string): string {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function TaskDetailDialog({
  projectId,
  task,
  open,
  onOpenChange,
  members,
  currentUserId,
  isManager,
}: {
  projectId: string;
  task: TaskListItem | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  members: ProjectMemberOption[];
  currentUserId: string;
  isManager: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        {task ? (
          <TaskDetailBody
            projectId={projectId}
            task={task}
            members={members}
            currentUserId={currentUserId}
            isManager={isManager}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailBody({
  projectId,
  task,
  members,
  currentUserId,
  isManager,
  onClose,
}: {
  projectId: string;
  task: TaskListItem;
  members: ProjectMemberOption[];
  currentUserId: string;
  isManager: boolean;
  onClose: () => void;
}) {
  const isCreator = task.createdBy === currentUserId;
  const isAssignee = task.assignee?.id === currentUserId;
  const canEditFields = isManager || isCreator;
  const canDelete = isManager;

  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader>
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <DialogTitle className="text-base leading-snug font-semibold">
              {task.title}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_PILL_CLASS[task.status]}`}
              >
                <CircleDashed className="size-3" />
                {TASK_STATUS_LABELS[task.status]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${PRIORITY_PILL_CLASS[task.priority]}`}
              >
                {TASK_PRIORITY_LABELS[task.priority]} priority
              </span>
              {task.dueDate ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="size-3" />
                  Due {formatDate(task.dueDate)}
                </span>
              ) : null}
            </DialogDescription>
          </div>
          {canEditFields && !editing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ) : null}
        </div>
      </DialogHeader>

      {editing ? (
        <EditTaskForm
          projectId={projectId}
          task={task}
          members={members}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <ReadOnlyDetails task={task} />
      )}

      <StatusActions
        projectId={projectId}
        task={task}
        isManager={isManager}
        isAssignee={isAssignee}
      />

      <CommentsSection
        projectId={projectId}
        task={task}
        currentUserId={currentUserId}
      />

      <DialogFooter className="-mx-4 -mb-4">
        {canDelete ? (
          <DeleteTaskInline
            projectId={projectId}
            taskId={task.id}
            onDeleted={onClose}
          />
        ) : null}
        <DialogClose render={<Button type="button" variant="outline" />}>
          Close
        </DialogClose>
      </DialogFooter>
    </div>
  );
}

function ReadOnlyDetails({ task }: { task: TaskListItem }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        {task.description ? (
          <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
            {task.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Assignee</Label>
          {task.assignee ? (
            <div className="inline-flex items-center gap-2 text-sm">
              <Avatar className="size-7">
                <AvatarFallback className="bg-linear-to-br from-slate-300/60 to-slate-400/30 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {initialsOf(task.assignee.name || task.assignee.email)}
                </AvatarFallback>
              </Avatar>
              <span className="flex flex-col leading-tight">
                <span className="font-medium">
                  {task.assignee.name || task.assignee.email.split("@")[0]}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {task.assignee.email}
                </span>
              </span>
            </div>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <UserIcon className="size-3.5" />
              Unassigned
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Created</Label>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            <span>
              {formatDate(task.createdAt)}
              {task.createdByName ? ` · by ${task.createdByName}` : ""}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function EditTaskForm({
  projectId,
  task,
  members,
  onCancel,
  onSaved,
}: {
  projectId: string;
  task: TaskListItem;
  members: ProjectMemberOption[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(
    task.assignee?.id ?? NO_ASSIGNEE
  );
  const [dueDate, setDueDate] = useState(toDateInput(task.dueDate));

  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(updateTaskAction, undefined);

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="priority" value={priority} />
      <input
        type="hidden"
        name="assigneeId"
        value={assigneeId === NO_ASSIGNEE ? "" : assigneeId}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-title-${task.id}`}>Title</Label>
        <Input
          id={`edit-title-${task.id}`}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          disabled={pending}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-desc-${task.id}`}>Description</Label>
        <Textarea
          id={`edit-desc-${task.id}`}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={5000}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Assignee</Label>
          <Select
            value={assigneeId}
            onValueChange={(v) => setAssigneeId(String(v))}
            disabled={pending}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-due-${task.id}`}>Due date</Label>
          <Input
            id={`edit-due-${task.id}`}
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={pending}
          />
        </div>
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

      <div className="flex flex-row justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

function StatusActions({
  projectId,
  task,
  isManager,
  isAssignee,
}: {
  projectId: string;
  task: TaskListItem;
  isManager: boolean;
  isAssignee: boolean;
}) {
  const allowedTargets = useMemo(() => {
    if (isManager) {
      return (["todo", "in_progress", "in_review", "done"] as TaskStatus[]).filter(
        (s) => s !== task.status
      );
    }
    if (!isAssignee) return [] as TaskStatus[];
    if (task.status === "todo") return ["in_progress"] as TaskStatus[];
    if (task.status === "in_progress") return ["in_review"] as TaskStatus[];
    if (task.status === "in_review") return ["in_progress"] as TaskStatus[];
    return [] as TaskStatus[];
  }, [task.status, isManager, isAssignee]);

  if (allowedTargets.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Move task
      </p>
      <div className="flex flex-wrap gap-2">
        {allowedTargets.map((target) => (
          <StatusActionButton
            key={target}
            projectId={projectId}
            taskId={task.id}
            current={task.status}
            target={target}
            isManager={isManager}
          />
        ))}
      </div>
    </div>
  );
}

function StatusActionButton({
  projectId,
  taskId,
  current,
  target,
  isManager,
}: {
  projectId: string;
  taskId: string;
  current: TaskStatus;
  target: TaskStatus;
  isManager: boolean;
}) {
  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(changeTaskStatusAction, undefined);

  const label = labelForTransition(current, target, isManager);
  const variant: "default" | "outline" =
    target === "done"
      ? "default"
      : current === "in_progress" && target === "in_review"
        ? "default"
        : "outline";

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={target} />
      <Button
        type="submit"
        size="sm"
        variant={variant}
        disabled={pending}
        className={
          variant === "default"
            ? "h-8 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
            : "h-8"
        }
      >
        {target === "done" ? <CheckCircle2 className="size-3.5" /> : null}
        {pending ? "Updating..." : label}
      </Button>
      {state?.error ? (
        <p className="text-[11px] text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

function labelForTransition(
  current: TaskStatus,
  target: TaskStatus,
  isManager: boolean
): string {
  if (!isManager) {
    if (current === "todo" && target === "in_progress") return "Start working";
    if (current === "in_progress" && target === "in_review") {
      return "Submit for review";
    }
    if (current === "in_review" && target === "in_progress") {
      return "Move back to in progress";
    }
  }
  if (target === "done") return "Mark complete";
  return `Move to ${TASK_STATUS_LABELS[target]}`;
}

function CommentsSection({
  projectId,
  task,
  currentUserId,
}: {
  projectId: string;
  task: TaskListItem;
  currentUserId: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <MessageSquare className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comments
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            ({task.comments.length})
          </span>
        </h3>
      </header>

      {task.comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No comments yet. Start the discussion below.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {task.comments.map((c) => {
            const mine = c.authorId === currentUserId;
            const displayName = c.authorName || c.authorEmail || "Someone";
            return (
              <li key={c.id} className="flex items-start gap-2.5">
                <Avatar className="size-7">
                  <AvatarFallback
                    className={`text-[10px] font-semibold ${
                      mine
                        ? "bg-linear-to-br from-theme-1/30 to-theme-3/20 text-theme-3 dark:text-theme-1"
                        : "bg-linear-to-br from-slate-300/60 to-slate-400/30 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {initialsOf(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border border-border/60 bg-card px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">
                      {displayName}
                      {mine ? (
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                          (you)
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddCommentForm projectId={projectId} taskId={task.id} />
    </section>
  );
}

function AddCommentForm({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(addCommentAction, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />
      <Textarea
        name="body"
        placeholder="Add a comment..."
        rows={2}
        maxLength={2000}
        disabled={pending}
        required
      />
      {state?.error ? (
        <p className="text-[11px] text-destructive">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="h-8 gap-1.5 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          <Send className="size-3.5" />
          {pending ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </form>
  );
}

function DeleteTaskInline({
  projectId,
  taskId,
  onDeleted,
}: {
  projectId: string;
  taskId: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<
    TaskFormState | undefined,
    FormData
  >(deleteTaskAction, undefined);

  useEffect(() => {
    if (state?.ok) onDeleted();
  }, [state, onDeleted]);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mr-auto h-9 gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-3.5" />
        Delete task
      </Button>
    );
  }

  return (
    <form action={action} className="mr-auto flex items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />
      <span className="text-xs text-muted-foreground">Sure?</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        className="h-8 gap-1.5"
        disabled={pending}
      >
        <Trash2 className="size-3.5" />
        {pending ? "Deleting..." : "Delete"}
      </Button>
      {state?.error ? (
        <span className="text-[11px] text-destructive">{state.error}</span>
      ) : null}
    </form>
  );
}
