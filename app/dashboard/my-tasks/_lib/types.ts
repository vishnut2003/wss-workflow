import type { ClientListItem } from "@/lib/clients/types";

export type MyTaskSource = "client" | "project";

export type MyTaskItem = {
  source: MyTaskSource;
  id: string;
  parentId: string;
  parentName: string;
  parentHref: string | null;
  title: string;
  description: string;
  /** True when the task is in the *user's* terminal state (member: in_review or done; everyone else: done). */
  isMyComplete: boolean;
  /** True when the task is awaiting manager review (project tasks only). */
  isInReview: boolean;
  /** False when the user can no longer change the status (e.g. a member whose task was already marked done by a manager). */
  canToggle: boolean;
  /** Full client data — only set when source === "client". Used to render the View client popup. */
  client: ClientListItem | null;
  dueDate: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};
