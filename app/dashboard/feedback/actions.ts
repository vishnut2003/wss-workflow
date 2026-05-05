"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createFeedback } from "@/lib/models/feedback";
import { isFeedbackCategory } from "@/lib/feedback/categories";

export type SubmitFeedbackState = {
  error?: string;
  ok?: boolean;
};

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 5000;

export async function submitFeedbackAction(
  _prev: SubmitFeedbackState | undefined,
  formData: FormData
): Promise<SubmitFeedbackState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in to submit feedback." };
  }

  const categoryRaw = String(formData.get("category") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!isFeedbackCategory(categoryRaw)) {
    return { error: "Please choose a category." };
  }
  if (!subject) return { error: "Subject is required." };
  if (subject.length > SUBJECT_MAX) {
    return { error: `Subject is too long (max ${SUBJECT_MAX} characters).` };
  }
  if (!message) return { error: "Message is required." };
  if (message.length > MESSAGE_MAX) {
    return { error: `Message is too long (max ${MESSAGE_MAX} characters).` };
  }

  try {
    await createFeedback({
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      userName: session.user.name ?? session.user.email ?? "Anonymous",
      category: categoryRaw,
      subject,
      message,
    });
  } catch {
    return { error: "Could not submit feedback. Please try again." };
  }

  revalidatePath("/dashboard/feedback/view");
  return { ok: true };
}
