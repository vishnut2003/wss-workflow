export const FEEDBACK_CATEGORIES = ["general", "bug", "feature", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return (
    typeof value === "string" &&
    (FEEDBACK_CATEGORIES as readonly string[]).includes(value)
  );
}

export type FeedbackListItem = {
  id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  createdAt: string;
};
