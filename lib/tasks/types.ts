export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    (TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type TaskAssignee = {
  id: string;
  name: string;
  email: string;
};

export type TaskCommentItem = {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  createdAt: string;
};

export type TaskListItem = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TaskAssignee | null;
  dueDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskCommentItem[];
};
