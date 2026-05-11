"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { ClientNoteListItem } from "@/lib/clients/note-types";

import {
  togglePinNoteAction,
  updateNoteAction,
  type NoteFormState,
} from "../actions";

const BODY_MAX = 5000;

function initialsOf(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

function formatAbsolute(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const sec = Math.round(diff / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    if (sec < 45) return "just now";
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;
    return formatAbsolute(iso);
  } catch {
    return "";
  }
}

export function NoteCard({
  note,
  isAuthor,
  onRequestDelete,
}: {
  note: ClientNoteListItem;
  isAuthor: boolean;
  onRequestDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pinPending, startPinTransition] = useTransition();

  const authorDisplay = note.authorName || note.authorEmail || "Unknown";
  const wasEdited =
    note.updatedAt && note.updatedAt !== note.createdAt ? true : false;

  const handleTogglePin = () => {
    const fd = new FormData();
    fd.set("noteId", note.id);
    startPinTransition(async () => {
      await togglePinNoteAction(undefined, fd);
    });
  };

  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm ring-1 transition-colors ${
        note.pinned
          ? "border-amber-500/30 ring-amber-500/15"
          : "border-border/60 ring-foreground/5"
      } ${pinPending ? "opacity-70" : ""}`}
    >
      {note.pinned ? (
        <span
          aria-hidden
          className="absolute top-3 left-0 h-5 w-1 rounded-r-full bg-amber-500"
        />
      ) : null}

      <header className="flex items-start gap-3">
        <Avatar className="size-9 ring-2 ring-background">
          <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-xs font-semibold text-theme-3 dark:text-theme-1">
            {initialsOf(authorDisplay)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-sm font-semibold">
              {authorDisplay}
            </span>
            {note.pinned ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
                <Pin className="size-2.5" />
                Pinned
              </span>
            ) : null}
          </div>
          <span
            className="text-[11px] text-muted-foreground"
            title={formatAbsolute(note.createdAt)}
          >
            {formatRelative(note.createdAt)}
            {wasEdited ? (
              <span
                className="ml-1 italic opacity-80"
                title={`Edited ${formatAbsolute(note.updatedAt)}`}
              >
                · edited
              </span>
            ) : null}
          </span>
        </div>

        {!isEditing ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Note actions"
                  disabled={pinPending}
                  className="opacity-60 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={handleTogglePin}>
                {note.pinned ? (
                  <>
                    <PinOff className="size-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="size-4" />
                    Pin to top
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                disabled={!isAuthor}
                title={!isAuthor ? "Only the author can edit" : undefined}
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRequestDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      {isEditing ? (
        <NoteEditForm note={note} onCancel={() => setIsEditing(false)} />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {note.body}
        </p>
      )}
    </article>
  );
}

function NoteEditForm({
  note,
  onCancel,
}: {
  note: ClientNoteListItem;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(note.body);
  const [state, action, pending] = useActionState<
    NoteFormState | undefined,
    FormData
  >(updateNoteAction, undefined);

  useEffect(() => {
    if (state?.ok) onCancel();
  }, [state, onCancel]);

  const trimmed = body.trim();
  const canSave =
    !pending &&
    trimmed.length > 0 &&
    trimmed.length <= BODY_MAX &&
    trimmed !== note.body.trim();

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="noteId" value={note.id} />

      <Textarea
        name="body"
        rows={3}
        autoFocus
        disabled={pending}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSave) {
            (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
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

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          <X className="size-3.5" />
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!canSave}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
