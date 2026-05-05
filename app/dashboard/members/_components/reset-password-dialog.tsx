"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
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
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

import { resetPasswordAction, type ResetPasswordState } from "../actions";

function generatePassword(length = 14): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const out = new Uint32Array(length);
    window.crypto.getRandomValues(out);
    let pwd = "";
    for (let i = 0; i < length; i++) pwd += chars[out[i] % chars.length];
    return pwd;
  }
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  memberName: string;
  memberEmail: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new temporary password for{" "}
            <span className="font-medium text-foreground">{memberName}</span>{" "}
            <span className="text-muted-foreground">({memberEmail})</span>.
          </DialogDescription>
        </DialogHeader>

        {open && memberId ? (
          <ResetPasswordForm
            memberId={memberId}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordForm({
  memberId,
  onSuccess,
}: {
  memberId: string;
  onSuccess: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState<ResetPasswordState | undefined, FormData>(
    resetPasswordAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const handleGenerate = () => {
    const next = generatePassword();
    setPassword(next);
    setConfirm(next);
    setShowPassword(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — fall back silently
    }
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="memberId" value={memberId} />

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="reset-password"
          className="text-xs font-medium text-muted-foreground"
        >
          New password
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <Lock className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="reset-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            disabled={pending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={copied ? "Copied" : "Copy password"}
              title={copied ? "Copied!" : "Copy"}
              tabIndex={-1}
            >
              <Copy className={`size-4 ${copied ? "text-theme-3" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="reset-confirm"
          className="text-xs font-medium text-muted-foreground"
        >
          Confirm password
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <KeyRound className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="reset-confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter the password"
            minLength={8}
            required
            disabled={pending}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">
          Share the new password with the member. They can change it after signing in.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 text-xs"
          onClick={handleGenerate}
          disabled={pending}
        >
          <RefreshCw className="size-3" />
          Generate
        </Button>
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
          disabled={pending || password.length < 8 || password !== confirm}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Update password"}
        </Button>
      </DialogFooter>
    </form>
  );
}
