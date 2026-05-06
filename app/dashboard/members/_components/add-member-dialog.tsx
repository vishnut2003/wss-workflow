"use client";

import { useActionState, useEffect, useImperativeHandle, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Plus,
  User as UserIcon,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import type { MemberListItem } from "@/lib/models/user";

import { addMemberAction, type AddMemberState } from "../actions";

const NO_MANAGER_VALUE = "__none__";

export type AddMemberDialogHandle = {
  openWith: (opts: { role?: "member" | "manager"; managerId?: string }) => void;
};

export function AddMemberDialog({
  canAssignAdmin,
  managers,
  ref,
  showTrigger = true,
}: {
  canAssignAdmin: boolean;
  managers: MemberListItem[];
  ref?: React.Ref<AddMemberDialogHandle>;
  showTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [initialRole, setInitialRole] = useState<"member" | "manager">("member");
  const [initialManagerId, setInitialManagerId] = useState<string>("");

  useImperativeHandle(ref, () => ({
    openWith: ({ role, managerId }) => {
      setInitialRole(role ?? "member");
      setInitialManagerId(managerId ?? "");
      setOpen(true);
    },
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button
              onClick={() => {
                setInitialRole("member");
                setInitialManagerId("");
              }}
              className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105"
            >
              <Plus />
              Add member
            </Button>
          }
        />
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new member</DialogTitle>
          <DialogDescription>
            Create an account so they can sign in to the workspace.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <AddMemberForm
            canAssignAdmin={canAssignAdmin}
            managers={managers}
            initialRole={initialRole}
            initialManagerId={initialManagerId}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddMemberForm({
  canAssignAdmin,
  managers,
  initialRole,
  initialManagerId,
  onSuccess,
}: {
  canAssignAdmin: boolean;
  managers: MemberListItem[];
  initialRole: "member" | "manager";
  initialManagerId: string;
  onSuccess: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>(initialRole);
  const [managerId, setManagerId] = useState<string>(
    initialManagerId || NO_MANAGER_VALUE
  );
  const [state, action, pending] = useActionState<AddMemberState | undefined, FormData>(
    addMemberAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />
      <input
        type="hidden"
        name="managerId"
        value={role === "member" && managerId !== NO_MANAGER_VALUE ? managerId : ""}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-name" className="text-xs font-medium text-muted-foreground">
          Full name
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <UserIcon className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="member-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            required
            disabled={pending}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-email" className="text-xs font-medium text-muted-foreground">
          Email
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <Mail className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="member-email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="jane@example.com"
            required
            disabled={pending}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="member-password"
          className="text-xs font-medium text-muted-foreground"
        >
          Temporary password
        </Label>
        <InputGroup className="h-10 rounded-lg">
          <InputGroupAddon>
            <Lock className="text-theme-3" />
          </InputGroupAddon>
          <InputGroupInput
            id="member-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
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
        <p className="text-[11px] text-muted-foreground">
          Share this with the new member. They can change it after signing in.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(String(v))} disabled={pending}>
          <SelectTrigger className="h-10 w-full rounded-lg">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            {canAssignAdmin ? (
              <SelectItem value="admin">Admin</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
        {!canAssignAdmin ? (
          <p className="text-[11px] text-muted-foreground">
            Only a super admin can assign the Admin role.
          </p>
        ) : null}
      </div>

      {role === "member" ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Reports to
          </Label>
          <Select
            value={managerId}
            onValueChange={(v) => setManagerId(String(v))}
            disabled={pending}
          >
            <SelectTrigger className="h-10 w-full rounded-lg">
              <SelectValue placeholder="No manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MANAGER_VALUE}>
                <UserCog className="size-3.5 text-muted-foreground" />
                No manager
              </SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <UserCog className="size-3.5 text-muted-foreground" />
                  {m.name?.trim() || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Optional — assign this team member to a manager.
          </p>
        </div>
      ) : null}

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
          {pending ? "Adding..." : "Add member"}
        </Button>
      </DialogFooter>
    </form>
  );
}
