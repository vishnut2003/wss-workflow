import { MessageSquarePlus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { FeedbackForm } from "./_components/feedback-form";

export default async function FeedbackPage() {
  await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 p-6 text-white shadow-lg shadow-theme-3/20 sm:p-8">
        <div
          aria-hidden
          className="absolute -top-20 -right-10 size-72 rounded-full bg-white/15 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-3">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium tracking-wide ring-1 ring-white/25 backdrop-blur-md">
            <MessageSquarePlus className="size-3" />
            <span>We&apos;re listening</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Share your feedback
          </h1>
          <p className="max-w-xl text-sm text-white/85">
            Tell us what&apos;s working, what&apos;s broken, or what you&apos;d
            love to see next. Every note reaches the team.
          </p>
        </div>
      </div>

      <FeedbackForm />
    </div>
  );
}
