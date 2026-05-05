"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/feedback/categories";

import { submitFeedbackAction, type SubmitFeedbackState } from "../actions";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 5000;

const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  general: "General",
  bug: "Bug report",
  feature: "Feature request",
  other: "Other",
};

const CATEGORY_ICON: Record<
  FeedbackCategory,
  React.ComponentType<{ className?: string }>
> = {
  general: MessageSquare,
  bug: Bug,
  feature: Lightbulb,
  other: Sparkles,
};

export function FeedbackForm() {
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState<
    SubmitFeedbackState | undefined,
    FormData
  >(submitFeedbackAction, undefined);

  useEffect(() => {
    if (state?.ok) {
      setSubject("");
      setMessage("");
      setCategory("general");
    }
  }, [state]);

  const subjectRemaining = SUBJECT_MAX - subject.length;
  const messageRemaining = MESSAGE_MAX - message.length;
  const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6"
    >
      <input type="hidden" name="category" value={category} />

      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Category
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as FeedbackCategory)}
            disabled={pending}
          >
            <SelectTrigger className="h-10 w-full rounded-lg">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c];
                return (
                  <SelectItem key={c} value={c}>
                    <Icon className="text-theme-3" />
                    {CATEGORY_LABEL[c]}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="feedback-subject"
            className="text-xs font-medium text-muted-foreground"
          >
            Subject
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <MessageSquare className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="feedback-subject"
              name="subject"
              type="text"
              placeholder="A short summary"
              required
              maxLength={SUBJECT_MAX}
              disabled={pending}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </InputGroup>
          <p className="text-right text-[11px] text-muted-foreground tabular-nums">
            {subjectRemaining} characters left
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="feedback-message"
          className="text-xs font-medium text-muted-foreground"
        >
          Message
        </Label>
        <Textarea
          id="feedback-message"
          name="message"
          placeholder="Tell us what&apos;s on your mind..."
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          disabled={pending}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-32"
        />
        <p className="text-right text-[11px] text-muted-foreground tabular-nums">
          {messageRemaining} characters left
        </p>
      </div>

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state?.ok ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>Thanks! Your feedback has been submitted.</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button
          type="submit"
          disabled={pending || !canSubmit}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          <Send />
          {pending ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
