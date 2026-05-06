export const PROJECT_STATUSES = [
  "planned",
  "in_progress",
  "on_hold",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    (PROJECT_STATUSES as readonly string[]).includes(value)
  );
}

export type ProjectAssignee = {
  id: string;
  name: string;
  email: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  managerId: string | null;
};

export type ProjectClientRef = {
  id: string;
  name: string;
  company: string;
};

export type ProjectListItem = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  client: ProjectClientRef | null;
  assignees: ProjectAssignee[];
  members: ProjectMember[];
  startDate: string;
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SidebarProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  clientLabel: string;
};
