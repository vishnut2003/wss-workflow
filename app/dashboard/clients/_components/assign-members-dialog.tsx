"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ChevronDown, Search, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ClientListItem } from "@/lib/clients/types";
import type { MemberListItem } from "@/lib/models/user";

import { assignClientMembersAction, type ClientFormState } from "../actions";

function memberInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (label.slice(0, 2) || "??").toUpperCase();
}

export function AssignMembersDialog({
  open,
  onOpenChange,
  client,
  assignableMembers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientListItem | null;
  assignableMembers: MemberListItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign members</DialogTitle>
          <DialogDescription>
            Choose which members can access{" "}
            <span className="font-medium text-foreground">
              {client?.company || client?.name || "this client"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {open && client ? (
          <AssignMembersForm
            client={client}
            assignableMembers={assignableMembers}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AssignMembersForm({
  client,
  assignableMembers,
  onSuccess,
}: {
  client: ClientListItem;
  assignableMembers: MemberListItem[];
  onSuccess: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(client.assignedMemberIds);
  const [state, action, pending] = useActionState<ClientFormState | undefined, FormData>(
    assignClientMembersAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const byId = useMemo(() => {
    const map = new Map<string, MemberListItem>();
    for (const m of assignableMembers) map.set(m.id, m);
    return map;
  }, [assignableMembers]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignableMembers;
    return assignableMembers.filter((m) => {
      const label = `${m.name} ${m.email}`.toLowerCase();
      return label.includes(q);
    });
  }, [assignableMembers, query]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="clientId" value={client.id} />
      {selected.length > 0 ? (
        selected.map((id) => (
          <input
            key={id}
            type="hidden"
            name="assignedMemberIds"
            value={id}
          />
        ))
      ) : (
        <input type="hidden" name="assignedMemberIds" value="" />
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-theme-3" />
            Members
          </span>
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                disabled={pending}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
              />
            }
          >
            <div className="flex flex-1 flex-wrap items-center gap-1.5 text-left">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">
                  {assignableMembers.length === 0
                    ? "No members available"
                    : "Select members..."}
                </span>
              ) : (
                selected.map((id) => {
                  const m = byId.get(id);
                  const label = m ? (m.name || m.email) : "Unknown";
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-theme-1/15 px-2 py-0.5 text-[11px] font-medium text-theme-3 ring-1 ring-theme-1/30 dark:text-theme-1"
                    >
                      {label}
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Remove ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            toggle(id);
                          }
                        }}
                        className="ml-0.5 inline-flex size-3.5 cursor-pointer items-center justify-center rounded-full hover:bg-theme-1/25"
                      >
                        <X className="size-2.5" />
                      </span>
                    </span>
                  );
                })
              )}
            </div>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-0 p-0"
          >
            <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {selected.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <ul className="flex max-h-64 flex-col overflow-y-auto overscroll-contain p-1">
              {filtered.length === 0 ? (
                <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
                  {assignableMembers.length === 0
                    ? "No members available."
                    : "No members match."}
                </li>
              ) : (
                filtered.map((member) => {
                  const isSelected = selectedSet.has(member.id);
                  const label = member.name || member.email;
                  return (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => toggle(member.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                          isSelected ? "bg-accent/60 text-accent-foreground" : ""
                        }`}
                      >
                        <span
                          aria-hidden
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[10px] font-semibold text-theme-3 ring-1 ring-theme-1/25 dark:text-theme-1"
                        >
                          {memberInitials(label)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {label}
                          </span>
                          {member.name ? (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {member.email}
                            </span>
                          ) : null}
                        </span>
                        {isSelected ? (
                          <Check className="size-3.5 shrink-0 text-theme-3 dark:text-theme-1" />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </PopoverContent>
        </Popover>
        <p className="text-[11px] text-muted-foreground">
          Members can only see clients they&apos;re assigned to.
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

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save assignments"}
        </Button>
      </DialogFooter>
    </form>
  );
}
