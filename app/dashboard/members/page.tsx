import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listMembers } from "@/lib/models/user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMemberDialog } from "./_components/add-member-dialog";
import { RoleBadge } from "./_components/role-badge";

function initialsOf(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function MembersPage() {
  const session = await requireRole("admin");
  const members = await listMembers();
  const canAssignAdmin = session.user.role === "super_admin";

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
        <AddMemberDialog canAssignAdmin={canAssignAdmin} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold">
              All members
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {members.length}
              </span>
            </h2>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Users className="size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">No members yet</p>
            <p className="text-xs text-muted-foreground">
              Add your first teammate to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-5">Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-linear-to-br from-theme-1/30 to-theme-3/30 text-xs font-semibold text-theme-3">
                          {initialsOf(m.name || m.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {m.name || m.email.split("@")[0]}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={m.role} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {formatDate(m.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
