"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Mail, Save, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

import { updateProfileAction, type UpdateProfileState } from "../actions";

type Props = {
  initial: { name: string; email: string };
};

export function AccountForm({ initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [state, action, pending] = useActionState<UpdateProfileState | undefined, FormData>(
    updateProfileAction,
    undefined
  );

  useEffect(() => {
    setName(initial.name);
    setEmail(initial.email);
  }, [initial.name, initial.email]);

  const dirty = name.trim() !== initial.name.trim() || email.trim() !== initial.email.trim();

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-name" className="text-xs font-medium text-muted-foreground">
            Full name
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <UserIcon className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="account-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              required
              disabled={pending}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-email" className="text-xs font-medium text-muted-foreground">
            Email address
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <Mail className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={pending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputGroup>
          <p className="text-[11px] text-muted-foreground">
            Used for sign in and important account notifications.
          </p>
        </div>
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
          <span>Your profile has been updated.</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={pending || !dirty}
          onClick={() => {
            setName(initial.name);
            setEmail(initial.email);
          }}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={pending || !dirty || !name.trim() || !email.trim()}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          <Save />
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
