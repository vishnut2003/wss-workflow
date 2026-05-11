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
import type { ClientContactListItem } from "@/lib/clients/contact-types";

import { updateContactAction, type ContactFormState } from "../actions";
import {
  ContactFormFields,
  type ContactFormValues,
} from "./contact-form-fields";

function contactToValues(contact: ClientContactListItem): ContactFormValues {
  return {
    name: contact.name,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    phoneCountry: contact.phoneCountry || "IN",
    isPrimary: contact.isPrimary,
    notes: contact.notes,
  };
}

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ClientContactListItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
          <DialogDescription>
            Update details for{" "}
            <span className="font-medium text-foreground">
              {contact?.name || "this contact"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {open && contact ? (
          <EditContactForm
            contact={contact}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditContactForm({
  contact,
  onSuccess,
}: {
  contact: ClientContactListItem;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<ContactFormValues>(() =>
    contactToValues(contact)
  );
  const [state, action, pending] = useActionState<
    ContactFormState | undefined,
    FormData
  >(updateContactAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const update = <K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="contactId" value={contact.id} />

      <ContactFormFields
        values={values}
        onChange={update}
        disabled={pending}
        idPrefix="edit-contact"
        primaryLocked={contact.isPrimary}
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
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
