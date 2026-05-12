import { requireCan } from "@/lib/permissions/check";
import { listFeedback } from "@/lib/models/feedback";
import { FeedbackList } from "./_components/feedback-list";

export default async function FeedbackViewPage() {
  await requireCan("pages.feedback.inbox");
  const feedback = await listFeedback();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Feedback inbox
        </h1>
        <p className="text-sm text-muted-foreground">
          All feedback submitted by workspace users.
        </p>
      </div>

      <FeedbackList feedback={feedback} />
    </div>
  );
}
