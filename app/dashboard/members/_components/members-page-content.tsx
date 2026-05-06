"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/roles";
import type { MemberListItem } from "@/lib/models/user";

import {
  AddMemberDialog,
  type AddMemberDialogHandle,
} from "./add-member-dialog";
import { MembersList } from "./members-list";

export function MembersPageContent({
  members,
  managers,
  currentUserId,
  currentUserRole,
  canAssignAdmin,
}: {
  members: MemberListItem[];
  managers: MemberListItem[];
  currentUserId: string;
  currentUserRole: Role;
  canAssignAdmin: boolean;
}) {
  const dialogRef = useRef<AddMemberDialogHandle>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage workspace members and their access levels.
          </p>
        </div>
        <Button
          onClick={() => dialogRef.current?.openWith({ role: "member" })}
          className="h-9 bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105"
        >
          <Plus />
          Add member
        </Button>
      </div>

      <AddMemberDialog
        ref={dialogRef}
        canAssignAdmin={canAssignAdmin}
        managers={managers}
        showTrigger={false}
      />

      <MembersList
        members={members}
        managers={managers}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onAddTeamMember={(managerId) =>
          dialogRef.current?.openWith({ role: "member", managerId })
        }
      />
    </div>
  );
}
