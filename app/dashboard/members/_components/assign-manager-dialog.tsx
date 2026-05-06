"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, UserCog } from "lucide-react";

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
import type { MemberListItem } from "@/lib/models/user";

import { assignManagerAction, type AssignManagerState } from "../actions";

const NO_MANAGER_VALUE = "__none__";

export function AssignManagerDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
  currentManagerId,
  managers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  memberName: string;
  memberEmail: string;
  currentManagerId: string | null;
  managers: MemberListItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign manager</DialogTitle>
          <DialogDescription>
            Set the reporting manager for{" "}
            <span className="font-medium text-foreground">{memberName}</span>{" "}
            <span className="text-muted-foreground">({memberEmail})</span>.
          </DialogDescription>
        </DialogHeader>

        {open && memberId ? (
          <AssignManagerForm
            memberId={memberId}
            currentManagerId={currentManagerId}
            managers={managers}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AssignManagerForm({
  memberId,
  currentManagerId,
  managers,
  onSuccess,
}: {
  memberId: string;
  currentManagerId: string | null;
  managers: MemberListItem[];
  onSuccess: () => void;
}) {
  const [managerId, setManagerId] = useState<string>(
    currentManagerId ?? NO_MANAGER_VALUE
  );
  const [state, action, pending] = useActionState<
    AssignManagerState | undefined,
    FormData
  >(assignManagerAction, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const selectableManagers = managers.filter((m) => m.id !== memberId);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="memberId" value={memberId} />
      <input
        type="hidden"
        name="managerId"
        value={managerId === NO_MANAGER_VALUE ? "" : managerId}
      />

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
            {selectableManagers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <UserCog className="size-3.5 text-muted-foreground" />
                {m.name?.trim() || m.email}
              </SelectItem>
            ))}
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
          disabled={
            pending ||
            (managerId === NO_MANAGER_VALUE
              ? currentManagerId === null
              : managerId === currentManagerId)
          }
          className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105 disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
