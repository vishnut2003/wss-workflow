"use client";

import {
  CalendarDays,
  ListChecks,
  StickyNote,
  UserCog,
} from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type TaskAssigneeOption = {
  id: string;
  name: string;
  email: string;
};

export type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
};

export const EMPTY_TASK_VALUES: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  assigneeId: "",
};

const NO_ASSIGNEE = "__none__";

export function TaskFormFields({
  values,
  onChange,
  assignees,
  disabled,
  idPrefix,
}: {
  values: TaskFormValues;
  onChange: <K extends keyof TaskFormValues>(
    key: K,
    value: TaskFormValues[K]
  ) => void;
  assignees: TaskAssigneeOption[];
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="assigneeId" value={values.assigneeId} />

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${idPrefix}-title`}
          className="text-xs font-medium text-muted-foreground"
        >
          Title <span className="text-destructive">*</span>
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <ListChecks className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${idPrefix}-title`}
            name="title"
            type="text"
            placeholder="e.g. Send proposal by Friday"
            required
            maxLength={200}
            disabled={disabled}
            value={values.title}
            onChange={(e) => onChange("title", e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Assignee
          </Label>
          <Select
            value={values.assigneeId === "" ? NO_ASSIGNEE : values.assigneeId}
            onValueChange={(v) => {
              const next = String(v);
              onChange("assigneeId", next === NO_ASSIGNEE ? "" : next);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-10 w-full rounded-lg">
              <SelectValue placeholder="Unassigned">
                <span className="inline-flex items-center gap-1.5">
                  <UserCog className="size-3.5 text-muted-foreground" />
                  {values.assigneeId
                    ? assignees.find((m) => m.id === values.assigneeId)?.name?.trim() ||
                      assignees.find((m) => m.id === values.assigneeId)?.email ||
                      "Unknown"
                    : "Unassigned"}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ASSIGNEE}>Unassigned</SelectItem>
              {assignees.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name?.trim() || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-due`}
            className="text-xs font-medium text-muted-foreground"
          >
            Due date
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <CalendarDays className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-due`}
              name="dueDate"
              type="date"
              disabled={disabled}
              value={values.dueDate}
              onChange={(e) => onChange("dueDate", e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${idPrefix}-description`}
          className="text-xs font-medium text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <StickyNote className="size-3.5 text-theme-3" />
            Description
          </span>
        </Label>
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          placeholder="Context, links, what success looks like..."
          rows={3}
          maxLength={5000}
          disabled={disabled}
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}
