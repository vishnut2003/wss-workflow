"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  FolderKanban,
  Plus,
  Search,
  StickyNote,
  Tag,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_STATUSES,
  type ProjectStatus,
} from "@/lib/projects/types";
import type { ClientListItem } from "@/lib/clients/types";
import type { MemberListItem } from "@/lib/models/user";

import { addProjectAction, type ProjectFormState } from "../actions";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

export function AddProjectDialog({
  clients,
  managers,
}: {
  clients: ClientListItem[];
  managers: MemberListItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105">
            <Plus />
            Add project
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Set up the basics now — you can adjust details later.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <AddProjectForm
            clients={clients}
            managers={managers}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddProjectForm({
  clients,
  managers,
  onSuccess,
}: {
  clients: ClientListItem[];
  managers: MemberListItem[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [clientId, setClientId] = useState<string>("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [state, action, pending] = useActionState<
    ProjectFormState | undefined,
    FormData
  >(addProjectAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="clientId" value={clientId} />
      {assigneeIds.map((id) => (
        <input key={id} type="hidden" name="assigneeIds" value={id} />
      ))}

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="add-project-name"
          className="text-xs font-medium text-muted-foreground"
        >
          Project name <span className="text-destructive">*</span>
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <FolderKanban className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="add-project-name"
            name="name"
            type="text"
            placeholder="Website redesign"
            required
            disabled={pending}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Client
          </Label>
          <ClientCombobox
            value={clientId}
            onChange={setClientId}
            clients={clients}
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Status
          </Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(String(v) as ProjectStatus)}
            disabled={pending}
          >
            <SelectTrigger className="h-10 w-full rounded-lg">
              <SelectValue placeholder="Select status">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="size-3.5 text-muted-foreground" />
                  {STATUS_LABEL[status]}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Assign to managers
        </Label>
        <AssigneesPicker
          managers={managers}
          value={assigneeIds}
          onChange={setAssigneeIds}
          disabled={pending}
        />
        <p className="text-[11px] text-muted-foreground">
          Only users with the Manager or Admin role can be assigned.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="add-project-start"
            className="text-xs font-medium text-muted-foreground"
          >
            Start date
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <CalendarIcon className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="add-project-start"
              name="startDate"
              type="date"
              disabled={pending}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="add-project-due"
            className="text-xs font-medium text-muted-foreground"
          >
            Due date
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <CalendarIcon className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="add-project-due"
              name="dueDate"
              type="date"
              disabled={pending}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={startDate || undefined}
            />
          </InputGroup>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="add-project-description"
          className="text-xs font-medium text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <StickyNote className="size-3.5 text-theme-3" />
            Description
          </span>
        </Label>
        <Textarea
          id="add-project-description"
          name="description"
          placeholder="Goals, scope, anything worth remembering..."
          rows={3}
          disabled={pending}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Creating..." : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ClientCombobox({
  value,
  onChange,
  clients,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  clients: ClientListItem[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => clients.find((c) => c.id === value) ?? null,
    [clients, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q)
    );
  }, [clients, query]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) setQuery("");
    setOpen(next);
  };

  const label = selected
    ? selected.company
      ? `${selected.name} · ${selected.company}`
      : selected.name
    : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          />
        }
      >
        <Building2 className="size-4 shrink-0 text-theme-3" />
        <span
          className={`truncate ${selected ? "" : "text-muted-foreground"}`}
        >
          {selected ? label : "No client"}
        </span>
        {selected ? (
          <span
            role="button"
            aria-label="Clear client"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }
            }}
            className="ml-auto cursor-pointer rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </span>
        ) : (
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
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
            placeholder="Search clients..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="flex max-h-64 flex-col overflow-y-auto overscroll-contain p-1">
          {clients.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No clients on file yet
            </li>
          ) : filtered.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No matches
            </li>
          ) : (
            filtered.map((c) => {
              const isSelected = c.id === value;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(isSelected ? "" : c.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isSelected ? "bg-accent/60 text-accent-foreground" : ""
                    }`}
                  >
                    <Building2 className="mt-0.5 size-3.5 shrink-0 text-theme-3 opacity-80" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{c.name}</span>
                      {c.company ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {c.company}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check className="mt-0.5 size-3.5 shrink-0 text-theme-3" />
                    ) : null}
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

function AssigneesPicker({
  managers,
  value,
  onChange,
  disabled,
}: {
  managers: MemberListItem[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedManagers = useMemo(
    () => managers.filter((m) => selectedSet.has(m.id)),
    [managers, selectedSet]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter((m) =>
      `${m.name} ${m.email}`.toLowerCase().includes(q)
    );
  }, [managers, query]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) setQuery("");
    setOpen(next);
  };

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          />
        }
      >
        <Users className="size-4 shrink-0 text-theme-3" />
        {selectedManagers.length === 0 ? (
          <span className="text-muted-foreground">No managers selected</span>
        ) : (
          <span className="flex flex-1 flex-wrap items-center gap-1">
            {selectedManagers.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 rounded-md bg-theme-1/15 px-1.5 py-0.5 text-[11px] font-medium text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1"
              >
                {m.name || m.email}
                <span
                  role="button"
                  aria-label={`Remove ${m.name || m.email}`}
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(m.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(m.id);
                    }
                  }}
                  className="cursor-pointer rounded-sm transition-colors hover:bg-theme-1/25"
                >
                  <X className="size-3" />
                </span>
              </span>
            ))}
          </span>
        )}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
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
            placeholder="Search managers..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="flex max-h-64 flex-col overflow-y-auto overscroll-contain p-1">
          {managers.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No managers available
            </li>
          ) : filtered.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No matches
            </li>
          ) : (
            filtered.map((m) => {
              const isSelected = selectedSet.has(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
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
                        {m.name || m.email}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.email}
                        {m.role === "admin" ? " · Admin" : " · Manager"}
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
