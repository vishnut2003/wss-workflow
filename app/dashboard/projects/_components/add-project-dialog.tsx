"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";

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
import type { ClientListItem } from "@/lib/clients/types";
import type { MemberListItem } from "@/lib/models/user";
import type { Role } from "@/lib/auth/roles";

import { addProjectAction, type ProjectFormState } from "../actions";
import {
  ProjectFormFields,
  type ProjectFormValues,
} from "./project-form-fields";

function buildInitialValues(
  clientId?: string,
  initialAssigneeIds: string[] = []
): ProjectFormValues {
  return {
    name: "",
    description: "",
    status: "planned",
    clientId: clientId ?? "",
    assigneeIds: initialAssigneeIds,
    startDate: "",
    dueDate: "",
  };
}

export function AddProjectDialog({
  clients,
  managers,
  initialClientId,
  triggerLabel,
  currentUserId,
  currentUserRole,
}: {
  clients: ClientListItem[];
  managers: MemberListItem[];
  initialClientId?: string;
  triggerLabel?: string;
  currentUserId: string;
  currentUserRole: Role;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105">
            <Plus />
            {triggerLabel ?? "Add project"}
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
            initialClientId={initialClientId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
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
  initialClientId,
  currentUserId,
  currentUserRole,
  onSuccess,
}: {
  clients: ClientListItem[];
  managers: MemberListItem[];
  initialClientId?: string;
  currentUserId: string;
  currentUserRole: Role;
  onSuccess: () => void;
}) {
  const isManagerCreator = currentUserRole === "manager";
  const [values, setValues] = useState<ProjectFormValues>(() =>
    buildInitialValues(
      initialClientId,
      isManagerCreator ? [currentUserId] : []
    )
  );

  const [state, action, pending] = useActionState<
    ProjectFormState | undefined,
    FormData
  >(addProjectAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const update = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <ProjectFormFields
        values={values}
        onChange={update}
        clients={clients}
        managers={managers}
        disabled={pending}
        idPrefix="add-project"
        canManageAssignees={!isManagerCreator}
        lockedAssigneeNote={
          isManagerCreator
            ? "You'll be set as the project manager. Only an admin can reassign this later."
            : undefined
        }
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
