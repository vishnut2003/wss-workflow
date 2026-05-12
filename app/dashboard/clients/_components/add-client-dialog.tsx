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

import type { MemberListItem } from "@/lib/models/user";

import { addClientAction, type ClientFormState } from "../actions";
import {
  ClientFormFields,
  EMPTY_CLIENT_VALUES,
  type ClientFormValues,
} from "./client-form-fields";

export function AddClientDialog({
  canAssign = false,
  assignableMembers = [],
}: {
  canAssign?: boolean;
  assignableMembers?: MemberListItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105">
            <Plus />
            Add client
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a new client</DialogTitle>
          <DialogDescription>
            Capture the basics now — you can always edit details later.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <AddClientForm
            onSuccess={() => setOpen(false)}
            canAssign={canAssign}
            assignableMembers={assignableMembers}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddClientForm({
  onSuccess,
  canAssign,
  assignableMembers,
}: {
  onSuccess: () => void;
  canAssign: boolean;
  assignableMembers: MemberListItem[];
}) {
  const [values, setValues] = useState<ClientFormValues>(EMPTY_CLIENT_VALUES);
  const [state, action, pending] = useActionState<ClientFormState | undefined, FormData>(
    addClientAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const update = <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <ClientFormFields
        values={values}
        onChange={update}
        disabled={pending}
        idPrefix="add-client"
        canAssign={canAssign}
        assignableMembers={assignableMembers}
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
        <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Adding..." : "Add client"}
        </Button>
      </DialogFooter>
    </form>
  );
}
