"use client";

import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Crown,
  ShieldCheck,
  User as UserIcon,
  UserCog,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, type Role } from "@/lib/auth/roles";

import { updateMemberRoleAction, type UpdateRoleState } from "../actions";

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_RANK: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  member: 1,
};

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  super_admin: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  member: UserIcon,
};

export function ChangeRoleDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
  currentRole,
  actorRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  memberName: string;
  memberEmail: string;
  currentRole: Role | null;
  actorRole: Role;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the workspace role for{" "}
            <span className="font-medium text-foreground">{memberName}</span>{" "}
            <span className="text-muted-foreground">({memberEmail})</span>.
          </DialogDescription>
        </DialogHeader>

        {open && memberId && currentRole ? (
          <ChangeRoleForm
            memberId={memberId}
            currentRole={currentRole}
            actorRole={actorRole}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleForm({
  memberId,
  currentRole,
  actorRole,
  onSuccess,
}: {
  memberId: string;
  currentRole: Role;
  actorRole: Role;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [state, action, pending] = useActionState<UpdateRoleState | undefined, FormData>(
    updateMemberRoleAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const assignableRoles: Role[] = ROLES.filter(
    (r) => r !== "super_admin" && ROLE_RANK[r] < ROLE_RANK[actorRole]
  );

  const CurrentIcon = ROLE_ICON[currentRole];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="role" value={role} />

      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <CurrentIcon className="size-3.5 text-theme-3 dark:text-theme-1" />
        <span>
          Current role:{" "}
          <span className="font-medium text-foreground">
            {ROLE_LABEL[currentRole]}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="change-role-select" className="text-xs font-medium text-muted-foreground">
          New role
        </Label>
        <Select
          value={role}
          onValueChange={(v) => setRole(String(v) as Role)}
          disabled={pending}
        >
          <SelectTrigger id="change-role-select" className="h-10 w-full rounded-lg">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {assignableRoles.map((r) => {
              const Icon = ROLE_ICON[r];
              return (
                <SelectItem key={r} value={r}>
                  <Icon className="size-3.5 text-muted-foreground" />
                  {ROLE_LABEL[r]}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
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
          disabled={pending || role === currentRole}
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Update role"}
        </Button>
      </DialogFooter>
    </form>
  );
}
