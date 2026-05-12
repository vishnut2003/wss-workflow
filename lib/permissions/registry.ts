import type { Role } from "@/lib/auth/roles";

export type CapabilityCategory =
  | "pages"
  | "clients"
  | "projects"
  | "members"
  | "feedback";

export type Capability = {
  id: string;
  label: string;
  description: string;
  category: CapabilityCategory;
  /**
   * Defaults applied when no override exists.
   * super_admin is always granted regardless of this map — see `can()`.
   * Any role missing from this map defaults to false (deny by default), so new
   * roles added in the future stay safely locked until explicitly granted.
   */
  defaults: Partial<Record<Role, boolean>>;
};

export const CATEGORY_META: Record<
  CapabilityCategory,
  { label: string; description: string }
> = {
  pages: {
    label: "Pages",
    description:
      "Which top-level pages a role can open. Hiding a page also strips it from the sidebar.",
  },
  clients: {
    label: "Clients",
    description: "Add, edit, and curate client records, contacts, and notes.",
  },
  projects: {
    label: "Projects",
    description:
      "Create projects, manage tasks and resources, and adjust the project team.",
  },
  members: {
    label: "Members",
    description: "Workspace user administration.",
  },
  feedback: {
    label: "Feedback",
    description: "Submit feedback and review the inbox.",
  },
};

export const CAPABILITIES: Capability[] = [
  // --- Pages ---
  {
    id: "pages.dashboard",
    label: "Dashboard page",
    description: "Open the main workspace dashboard.",
    category: "pages",
    defaults: { admin: true, manager: true, member: true },
  },
  {
    id: "pages.my-tasks",
    label: "My tasks page",
    description: "See tasks assigned to you across projects.",
    category: "pages",
    defaults: { admin: true, manager: true, member: true },
  },
  {
    id: "pages.projects",
    label: "Projects page",
    description: "Browse the projects list.",
    category: "pages",
    defaults: { admin: true, manager: true, member: true },
  },
  {
    id: "pages.clients",
    label: "Clients page",
    description: "Browse and open client records.",
    category: "pages",
    defaults: { admin: true },
  },
  {
    id: "pages.members",
    label: "Members page",
    description: "Open the workspace members directory.",
    category: "pages",
    defaults: { admin: true },
  },
  {
    id: "pages.team",
    label: "My team page",
    description: "Managers' view of their direct reports.",
    category: "pages",
    defaults: { manager: true },
  },
  {
    id: "pages.feedback.inbox",
    label: "Feedback inbox page",
    description: "Read inbound feedback from teammates.",
    category: "pages",
    defaults: {},
  },

  // --- Clients ---
  {
    id: "clients.create",
    label: "Create client",
    description: "Add a brand-new client record.",
    category: "clients",
    defaults: { admin: true },
  },
  {
    id: "clients.edit",
    label: "Edit client",
    description: "Update an existing client's details.",
    category: "clients",
    defaults: { admin: true },
  },
  {
    id: "clients.contacts.manage",
    label: "Manage client contacts",
    description: "Add, edit, or remove the people listed under a client.",
    category: "clients",
    defaults: { admin: true },
  },
  {
    id: "clients.notes.manage",
    label: "Manage client notes",
    description: "Add, edit, pin, or delete notes on a client.",
    category: "clients",
    defaults: { admin: true },
  },
  {
    id: "clients.invoices.view",
    label: "View client invoices",
    description: "See the invoices list and individual invoices on a client.",
    category: "clients",
    defaults: { admin: true },
  },
  {
    id: "clients.invoices.manage",
    label: "Manage client invoices",
    description: "Create, edit, and change the status of invoices.",
    category: "clients",
    defaults: { admin: true },
  },
  {
    id: "clients.invoices.delete",
    label: "Delete client invoices",
    description: "Permanently remove an invoice.",
    category: "clients",
    defaults: { admin: true },
  },

  // --- Projects ---
  {
    id: "projects.create",
    label: "Create project",
    description: "Spin up a new project.",
    category: "projects",
    defaults: { admin: true },
  },
  {
    id: "projects.edit",
    label: "Edit project",
    description: "Update a project's name, dates, status, or assignees.",
    category: "projects",
    defaults: { admin: true, manager: true },
  },
  {
    id: "projects.tasks.manage",
    label: "Manage project tasks",
    description: "Create, edit, and delete tasks inside a project.",
    category: "projects",
    defaults: { admin: true, manager: true },
  },
  {
    id: "projects.resources.manage",
    label: "Manage project resources",
    description: "Upload, link, or delete resources attached to a project.",
    category: "projects",
    defaults: { admin: true, manager: true },
  },
  {
    id: "projects.team.manage",
    label: "Manage project team",
    description: "Add or remove members from a specific project.",
    category: "projects",
    defaults: { admin: true, manager: true },
  },

  // --- Members ---
  {
    id: "members.add",
    label: "Add member",
    description: "Invite a new user into the workspace.",
    category: "members",
    defaults: { admin: true },
  },
  {
    id: "members.delete",
    label: "Delete member",
    description: "Remove a user account from the workspace.",
    category: "members",
    defaults: { admin: true },
  },
  {
    id: "members.changeRole",
    label: "Change member role",
    description: "Promote or demote teammates (within your authority).",
    category: "members",
    defaults: { admin: true },
  },
  {
    id: "members.resetPassword",
    label: "Reset member password",
    description: "Force-set a teammate's password.",
    category: "members",
    defaults: { admin: true },
  },
  {
    id: "members.assignManager",
    label: "Assign manager",
    description: "Link members to a manager.",
    category: "members",
    defaults: { admin: true },
  },

  // --- Feedback ---
  {
    id: "feedback.submit",
    label: "Submit feedback",
    description: "Send feedback through the share-feedback widget.",
    category: "feedback",
    defaults: { admin: true, manager: true, member: true },
  },
];

export const CAPABILITY_BY_ID: ReadonlyMap<string, Capability> = new Map(
  CAPABILITIES.map((c) => [c.id, c])
);

export function isCapabilityId(value: unknown): value is string {
  return typeof value === "string" && CAPABILITY_BY_ID.has(value);
}

export function defaultFor(capabilityId: string, role: Role): boolean {
  const cap = CAPABILITY_BY_ID.get(capabilityId);
  if (!cap) return false;
  return cap.defaults[role] ?? false;
}
