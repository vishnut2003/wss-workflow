export type MyTaskItem = {
  id: string;
  parentId: string;
  parentName: string;
  parentHref: string | null;
  title: string;
  description: string;
  /** True when the task is in the *user's* terminal state (member: in_review or done; everyone else: done). */
  isMyComplete: boolean;
  /** True when the task is awaiting manager review. */
  isInReview: boolean;
  /** False when the user can no longer change the status (e.g. a member whose task was already marked done by a manager). */
  canToggle: boolean;
  dueDate: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};
