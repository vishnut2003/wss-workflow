"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Mail,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ProjectMember } from "@/lib/projects/types";

import {
  updateProjectTeamAction,
  type ProjectTeamFormState,
} from "../actions";

type EligibleMember = {
  id: string;
  name: string;
  email: string;
};

function initialsOf(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

export function ProjectTeamPanel({
  projectId,
  managerId,
  currentMembers,
  eligible,
}: {
  projectId: string;
  managerId: string;
  currentMembers: ProjectMember[];
  eligible: EligibleMember[];
}) {
  const myInitialIds = useMemo(
    () =>
      currentMembers
        .filter((m) => m.managerId === managerId)
        .map((m) => m.id),
    [currentMembers, managerId]
  );
  const otherManagersMembers = useMemo(
    () => currentMembers.filter((m) => m.managerId !== managerId),
    [currentMembers, managerId]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(myInitialIds);
  const [seenInitialIds, setSeenInitialIds] = useState(myInitialIds);
  if (seenInitialIds !== myInitialIds) {
    setSeenInitialIds(myInitialIds);
    setSelectedIds(myInitialIds);
  }

  const [state, action, pending] = useActionState<
    ProjectTeamFormState | undefined,
    FormData
  >(updateProjectTeamAction, undefined);

  const dirty = useMemo(() => {
    if (selectedIds.length !== myInitialIds.length) return true;
    const initial = new Set(myInitialIds);
    return selectedIds.some((id) => !initial.has(id));
  }, [selectedIds, myInitialIds]);

  const eligibleById = useMemo(
    () => new Map(eligible.map((m) => [m.id, m])),
    [eligible]
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedMembers = useMemo(
    () =>
      selectedIds
        .map((id) => eligibleById.get(id))
        .filter((m): m is EligibleMember => Boolean(m)),
    [selectedIds, eligibleById]
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const removeOne = (id: string) => {
    setSelectedIds((prev) => prev.filter((v) => v !== id));
  };

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="projectId" value={projectId} />
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="memberIds" value={id} />
        ))}

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-linear-to-br from-theme-1/8 via-card to-card px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 ring-1 ring-violet-500/20">
                <Users className="size-4 text-violet-700 dark:text-violet-300" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-heading text-sm font-semibold leading-tight">
                  My team on this project
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedMembers.length === 0
                    ? "Pick people from your team to add"
                    : `${selectedMembers.length} ${selectedMembers.length === 1 ? "person" : "people"} from your team`}
                </p>
              </div>
            </div>
            <AddMemberPicker
              eligible={eligible}
              selectedSet={selectedSet}
              onToggle={toggle}
              disabled={pending}
            />
          </div>

          {selectedMembers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/15">
                <UserPlus className="size-5 text-violet-700 dark:text-violet-300" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">
                  No one from your team yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Use the &ldquo;Add member&rdquo; button to assign people from
                  your direct reports.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {selectedMembers.map((m) => {
                const displayName = m.name?.trim() || m.email.split("@")[0];
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
                  >
                    <Avatar className="size-10 ring-2 ring-background">
                      <AvatarFallback className="bg-linear-to-br from-slate-300/60 to-slate-400/30 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {initialsOf(m.name || m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {displayName}
                      </span>
                      <a
                        href={`mailto:${m.email}`}
                        className="group/email inline-flex w-fit max-w-full items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Mail className="size-3 shrink-0 opacity-60 group-hover/email:opacity-100" />
                        <span className="truncate">{m.email}</span>
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOne(m.id)}
                      disabled={pending}
                      aria-label={`Remove ${displayName}`}
                    >
                      <UserMinus className="size-3.5" />
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
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

        {state?.ok && !dirty ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>Project team updated.</span>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={pending || !dirty}
            onClick={() => setSelectedIds(myInitialIds)}
          >
            Reset changes
          </Button>
          <Button
            type="submit"
            disabled={pending || !dirty}
            className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
          >
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      {otherManagersMembers.length > 0 ? (
        <OtherManagersSection members={otherManagersMembers} />
      ) : null}
    </div>
  );
}

function OtherManagersSection({ members }: { members: ProjectMember[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-5 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted ring-1 ring-border">
          <Users className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold leading-tight">
            Added by other managers
          </h2>
          <p className="text-[11px] text-muted-foreground">
            You can&rsquo;t change these &mdash; they&rsquo;re managed by their
            own manager.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {members.map((m) => {
          const displayName = m.name?.trim() || m.email.split("@")[0];
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 px-5 py-3"
            >
              <Avatar className="size-9 ring-2 ring-background">
                <AvatarFallback className="bg-linear-to-br from-slate-300/60 to-slate-400/30 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {initialsOf(m.name || m.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {m.email}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddMemberPicker({
  eligible,
  selectedSet,
  onToggle,
  disabled,
}: {
  eligible: EligibleMember[];
  selectedSet: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) setQuery("");
    setOpen(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter((m) =>
      `${m.name} ${m.email}`.toLowerCase().includes(q)
    );
  }, [eligible, query]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || eligible.length === 0}
            className="h-9 gap-1.5"
          >
            <UserPlus className="size-4" />
            Add member
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={6}
        className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-0 p-0"
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your team..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <ul className="flex max-h-72 flex-col overflow-y-auto overscroll-contain p-1">
          {eligible.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No team members report to you yet
            </li>
          ) : filtered.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No matches
            </li>
          ) : (
            filtered.map((m) => {
              const isSelected = selectedSet.has(m.id);
              const displayName = m.name?.trim() || m.email.split("@")[0];
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(m.id)}
                    className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isSelected ? "bg-accent/60 text-accent-foreground" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-theme-3 bg-theme-3 text-white dark:border-theme-1 dark:bg-theme-1 dark:text-foreground"
                          : "border-input bg-background"
                      }`}
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
