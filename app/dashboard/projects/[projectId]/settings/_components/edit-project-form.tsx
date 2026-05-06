"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ClientListItem } from "@/lib/clients/types";
import type { MemberListItem } from "@/lib/models/user";
import type { ProjectListItem } from "@/lib/projects/types";

import { updateProjectAction, type ProjectFormState } from "../../../actions";
import {
  ProjectFormFields,
  type ProjectFormValues,
} from "../../../_components/project-form-fields";

function toDateInput(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function projectToValues(project: ProjectListItem): ProjectFormValues {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    clientId: project.client?.id ?? "",
    assigneeIds: project.assignees.map((a) => a.id),
    startDate: toDateInput(project.startDate),
    dueDate: toDateInput(project.dueDate),
  };
}

export function EditProjectForm({
  project,
  clients,
  managers,
  canManageAssignees,
}: {
  project: ProjectListItem;
  clients: ClientListItem[];
  managers: MemberListItem[];
  canManageAssignees: boolean;
}) {
  const initialValues = useMemo(() => projectToValues(project), [project]);
  const [values, setValues] = useState<ProjectFormValues>(initialValues);

  const [state, action, pending] = useActionState<
    ProjectFormState | undefined,
    FormData
  >(updateProjectAction, undefined);

  const update = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const dirty = useMemo(() => {
    if (values.name !== initialValues.name) return true;
    if (values.description !== initialValues.description) return true;
    if (values.status !== initialValues.status) return true;
    if (values.clientId !== initialValues.clientId) return true;
    if (values.startDate !== initialValues.startDate) return true;
    if (values.dueDate !== initialValues.dueDate) return true;
    if (values.assigneeIds.length !== initialValues.assigneeIds.length)
      return true;
    const initialSet = new Set(initialValues.assigneeIds);
    return values.assigneeIds.some((id) => !initialSet.has(id));
  }, [values, initialValues]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="projectId" value={project.id} />

      <ProjectFormFields
        values={values}
        onChange={update}
        clients={clients}
        managers={managers}
        disabled={pending}
        idPrefix="edit-project"
        canManageAssignees={canManageAssignees}
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

      {state?.ok && !dirty ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>Project updated.</span>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/dashboard/projects/${project.id}`} />}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending || !dirty}
          onClick={() => setValues(initialValues)}
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
  );
}
