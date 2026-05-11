export const CLIENT_TASK_STATUSES = ["pending", "done"] as const;
export type ClientTaskStatus = (typeof CLIENT_TASK_STATUSES)[number];

export function isClientTaskStatus(value: unknown): value is ClientTaskStatus {
  return (
    typeof value === "string" &&
    (CLIENT_TASK_STATUSES as readonly string[]).includes(value)
  );
}

export type ClientTaskAssignee = {
  id: string;
  name: string;
  email: string;
};

export type ClientTaskListItem = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: ClientTaskStatus;
  dueDate: string;
  assignee: ClientTaskAssignee | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
};
