"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

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
import type { ClientListItem } from "@/lib/clients/types";
import type { MemberListItem } from "@/lib/models/user";

import { updateClientAction, type ClientFormState } from "../actions";
import {
  ClientFormFields,
  type ClientFormValues,
} from "./client-form-fields";

function clientToValues(client: ClientListItem): ClientFormValues {
  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    phoneCountry: client.phoneCountry || "IN",
    website: client.website,
    industry: client.industry,
    status: client.status,
    address: client.address,
    city: client.city,
    country: client.country,
    notes: client.notes,
    assignedMemberIds: client.assignedMemberIds ?? [],
  };
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
  canAssign = false,
  assignableMembers = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientListItem | null;
  canAssign?: boolean;
  assignableMembers?: MemberListItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>
            Update details for{" "}
            <span className="font-medium text-foreground">
              {client?.name || "this client"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {open && client ? (
          <EditClientForm
            client={client}
            onSuccess={() => onOpenChange(false)}
            canAssign={canAssign}
            assignableMembers={assignableMembers}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditClientForm({
  client,
  onSuccess,
  canAssign,
  assignableMembers,
}: {
  client: ClientListItem;
  onSuccess: () => void;
  canAssign: boolean;
  assignableMembers: MemberListItem[];
}) {
  const [values, setValues] = useState<ClientFormValues>(() => clientToValues(client));
  const [state, action, pending] = useActionState<ClientFormState | undefined, FormData>(
    updateClientAction,
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
      <input type="hidden" name="clientId" value={client.id} />

      <ClientFormFields
        values={values}
        onChange={update}
        disabled={pending}
        idPrefix="edit-client"
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
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
