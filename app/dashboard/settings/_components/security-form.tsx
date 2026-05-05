"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

import { updatePasswordAction, type UpdatePasswordState } from "../actions";

export function SecurityForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [state, action, pending] = useActionState<UpdatePasswordState | undefined, FormData>(
    updatePasswordAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
  }, [state]);

  const ready =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirm.length >= 8 &&
    newPassword === confirm;

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="current-password"
          className="text-xs font-medium text-muted-foreground"
        >
          Current password
        </Label>
        <InputGroup className="h-10 rounded-lg sm:max-w-md">
          <InputGroupAddon>
            <Lock className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="current-password"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your current password"
            required
            disabled={pending}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showCurrent ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="new-password"
            className="text-xs font-medium text-muted-foreground"
          >
            New password
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <KeyRound className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="new-password"
              name="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              disabled={pending}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={showNew ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="confirm-password"
            className="text-xs font-medium text-muted-foreground"
          >
            Confirm new password
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <KeyRound className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id="confirm-password"
              name="confirm"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              minLength={8}
              required
              disabled={pending}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </InputGroup>
          {confirm.length > 0 && newPassword !== confirm ? (
            <p className="text-[11px] text-destructive">Passwords do not match.</p>
          ) : null}
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

      {state?.ok ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>Your password has been updated.</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button
          type="submit"
          disabled={pending || !ready}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          <Save />
          {pending ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
