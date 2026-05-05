"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(
    loginAction,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          Email
        </Label>
        <InputGroup className="h-11 rounded-xl bg-background/60 backdrop-blur-sm transition-shadow has-[input:focus-visible]:shadow-md has-[input:focus-visible]:shadow-theme-1/10">
          <InputGroupAddon>
            <Mail className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={pending}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className="text-xs font-medium text-muted-foreground"
          >
            Password
          </Label>
          <Link
            href="#"
            className="text-xs font-medium text-theme-3 transition-colors hover:text-theme-2"
          >
            Forgot password?
          </Link>
        </div>
        <InputGroup className="h-11 rounded-xl bg-background/60 backdrop-blur-sm transition-shadow has-[input:focus-visible]:shadow-md has-[input:focus-visible]:shadow-theme-1/10">
          <InputGroupAddon>
            <Lock className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={pending}
          />
          <InputGroupAddon align="inline-end">
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

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        size="lg"
        className="group/cta mt-2 h-11 w-full rounded-xl bg-linear-to-br from-theme-1 to-theme-3 text-sm font-semibold text-white shadow-lg shadow-theme-2/30 ring-1 ring-white/20 transition-all hover:shadow-xl hover:shadow-theme-2/40 hover:brightness-105 disabled:opacity-70"
      >
        {pending ? (
          "Signing in..."
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}
