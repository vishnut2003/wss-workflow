"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle, NotebookPen, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { addNoteAction, type NoteFormState } from "../actions";

const BODY_MAX = 5000;

export function NoteComposer({ clientId }: { clientId: string }) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const wrappedAction = async (
    prev: NoteFormState | undefined,
    formData: FormData
  ): Promise<NoteFormState | undefined> => {
    const result = await addNoteAction(prev, formData);
    if (result?.ok) {
      setBody("");
      textareaRef.current?.focus();
    }
    return result;
  };

  const [state, action, pending] = useActionState<
    NoteFormState | undefined,
    FormData
  >(wrappedAction, undefined);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= BODY_MAX && !pending;
  const counterTone =
    body.length > BODY_MAX
      ? "text-destructive"
      : body.length > BODY_MAX * 0.9
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground/70";

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm ring-1 ring-foreground/5"
    >
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
          <NotebookPen className="size-4" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold leading-tight">
            New note
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Visible to everyone with admin access to this client.
          </p>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        name="body"
        placeholder="What did you learn? Decisions, follow-ups, blockers..."
        rows={3}
        disabled={pending}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
            (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          }
        }}
        className="min-h-24 resize-y"
        maxLength={BODY_MAX + 1}
      />

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-[11px] tabular-nums ${counterTone}`}>
          {body.length} / {BODY_MAX}
          <span className="ml-2 hidden text-muted-foreground/60 sm:inline">
            ⌘/Ctrl + Enter to post
          </span>
        </span>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-9 gap-1.5 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          <Send className="size-3.5" />
          {pending ? "Posting..." : "Post note"}
        </Button>
      </div>
    </form>
  );
}
