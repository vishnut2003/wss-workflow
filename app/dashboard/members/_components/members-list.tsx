"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  KeyRound,
  Mail,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  UserCog,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLES, type Role } from "@/lib/auth/roles";
import type { MemberListItem } from "@/lib/models/user";

import { DeleteMemberDialog } from "./delete-member-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { RoleBadge } from "./role-badge";

type RoleFilter = "all" | Role;

const PAGE_SIZE = 10;

const ROLE_RANK: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  member: 1,
};

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_AVATAR_GRADIENT: Record<Role, string> = {
  super_admin: "from-amber-400/40 to-orange-500/30 text-amber-700 dark:text-amber-300",
  admin: "from-theme-1/40 to-theme-3/30 text-theme-3 dark:text-theme-1",
  manager: "from-violet-400/40 to-fuchsia-500/30 text-violet-700 dark:text-violet-300",
  member: "from-slate-300/60 to-slate-400/30 text-slate-700 dark:text-slate-300",
};

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  super_admin: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  member: UserIcon,
};

const ROLE_CHIP_ACTIVE: Record<Role, string> = {
  super_admin: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  admin: "bg-theme-1/20 text-theme-3 ring-theme-1/30 dark:text-theme-1",
  manager: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
  member: "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300",
};

function initialsOf(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

function formatAbsoluteDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatRelativeDate(iso: string) {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const sec = Math.round(diffMs / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const wk = Math.round(day / 7);
    const mo = Math.round(day / 30);
    const yr = Math.round(day / 365);

    if (sec < 45) return "just now";
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;
    if (wk < 5) return `${wk}w ago`;
    if (mo < 12) return `${mo}mo ago`;
    return `${yr}y ago`;
  } catch {
    return "";
  }
}

function countByRole(members: MemberListItem[]): Record<Role, number> {
  const counts: Record<Role, number> = {
    super_admin: 0,
    admin: 0,
    manager: 0,
    member: 0,
  };
  for (const m of members) counts[m.role] += 1;
  return counts;
}

export function MembersList({
  members,
  currentUserId,
  currentUserRole,
}: {
  members: MemberListItem[];
  currentUserId?: string;
  currentUserRole: Role;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);

  const [actionTarget, setActionTarget] = useState<MemberListItem | null>(null);
  const [dialog, setDialog] = useState<"none" | "delete" | "reset">("none");

  const totalCounts = useMemo(() => countByRole(members), [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = `${m.name} ${m.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [members, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filtered.length);

  const isFiltering = query.trim().length > 0 || roleFilter !== "all";

  const canManage = (target: MemberListItem): boolean => {
    if (!currentUserId) return false;
    if (target.id === currentUserId) return false;
    return ROLE_RANK[currentUserRole] > ROLE_RANK[target.role];
  };

  const openDelete = (m: MemberListItem) => {
    setActionTarget(m);
    setDialog("delete");
  };
  const openReset = (m: MemberListItem) => {
    setActionTarget(m);
    setDialog("reset");
  };
  const closeDialog = (open: boolean) => {
    if (!open) {
      setDialog("none");
      window.setTimeout(() => setActionTarget(null), 150);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-linear-to-br from-theme-1/8 via-card to-card px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/20 ring-1 ring-theme-1/20">
                <Users className="size-4 text-theme-3 dark:text-theme-1" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-heading text-sm font-semibold leading-tight">
                  All members
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isFiltering
                    ? `${filtered.length} of ${members.length} ${members.length === 1 ? "person" : "people"}`
                    : `${members.length} ${members.length === 1 ? "person" : "people"} in this workspace`}
                </p>
              </div>
            </div>

            <InputGroup className="h-9 w-full sm:w-72">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search members"
              />
              {query && (
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip
              active={roleFilter === "all"}
              onClick={() => setRoleFilter("all")}
              label="All"
              count={members.length}
              activeClass="bg-foreground/10 text-foreground ring-foreground/20"
            />
            {ROLES.map((role) => {
              const Icon = ROLE_ICON[role];
              return (
                <FilterChip
                  key={role}
                  active={roleFilter === role}
                  onClick={() =>
                    setRoleFilter((prev) => (prev === role ? "all" : role))
                  }
                  label={ROLE_LABEL[role]}
                  count={totalCounts[role]}
                  icon={<Icon className="size-3" />}
                  activeClass={ROLE_CHIP_ACTIVE[role]}
                  disabled={totalCounts[role] === 0}
                />
              );
            })}
            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => {
                  setQuery("");
                  setRoleFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="Add your first teammate to get started."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches"
            description={
              query.trim()
                ? `No members match "${query.trim()}"${roleFilter !== "all" ? ` in ${ROLE_LABEL[roleFilter]}` : ""}.`
                : `No ${ROLE_LABEL[roleFilter as Role]}s in this workspace yet.`
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setRoleFilter("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Member
                  </TableHead>
                  <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Role
                  </TableHead>
                  <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Added
                  </TableHead>
                  <TableHead className="w-12 px-5">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((m) => {
                  const isMe = currentUserId === m.id;
                  const displayName = m.name || m.email.split("@")[0];
                  const actionable = canManage(m);
                  return (
                    <TableRow
                      key={m.id}
                      className="group border-border/40 transition-colors hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
                    >
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 ring-2 ring-background">
                            <AvatarFallback
                              className={`bg-linear-to-br ${ROLE_AVATAR_GRADIENT[m.role]} text-xs font-semibold`}
                            >
                              {initialsOf(m.name || m.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">
                                {displayName}
                              </span>
                              {isMe && (
                                <span className="inline-flex items-center rounded-full bg-theme-1/15 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
                                  You
                                </span>
                              )}
                            </div>
                            <a
                              href={`mailto:${m.email}`}
                              className="group/email inline-flex w-fit max-w-full items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <Mail className="size-3 shrink-0 opacity-60 group-hover/email:opacity-100" />
                              <span className="truncate">{m.email}</span>
                            </a>
                            <div className="mt-1 sm:hidden">
                              <RoleBadge role={m.role} />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <RoleBadge role={m.role} />
                      </TableCell>
                      <TableCell
                        className="hidden text-right text-xs text-muted-foreground md:table-cell"
                        title={formatAbsoluteDate(m.createdAt)}
                      >
                        <span className="tabular-nums">{formatRelativeDate(m.createdAt)}</span>
                      </TableCell>
                      <TableCell className="px-5 text-right">
                        {actionable ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${displayName}`}
                                  className="opacity-60 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem onClick={() => openReset(m)}>
                                <KeyRound className="size-4" />
                                Reset password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => openDelete(m)}
                              >
                                <Trash2 className="size-4" />
                                Delete member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filtered.length > PAGE_SIZE && (
              <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {showingFrom}–{showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {filtered.length}
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="size-3.5" />
                    Prev
                  </Button>
                  <PageNumbers page={page} totalPages={totalPages} setPage={setPage} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DeleteMemberDialog
        open={dialog === "delete"}
        onOpenChange={closeDialog}
        memberId={actionTarget?.id ?? null}
        memberName={actionTarget?.name || actionTarget?.email.split("@")[0] || ""}
        memberEmail={actionTarget?.email ?? ""}
      />

      <ResetPasswordDialog
        open={dialog === "reset"}
        onOpenChange={closeDialog}
        memberId={actionTarget?.id ?? null}
        memberName={actionTarget?.name || actionTarget?.email.split("@")[0] || ""}
        memberEmail={actionTarget?.email ?? ""}
      />
    </>
  );
}

function PageNumbers({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (n: number) => void;
}) {
  const pages = useMemo(() => {
    const window: (number | "…")[] = [];
    const max = totalPages;
    if (max <= 7) {
      for (let i = 1; i <= max; i++) window.push(i);
      return window;
    }
    window.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(max - 1, page + 1);
    if (start > 2) window.push("…");
    for (let i = start; i <= end; i++) window.push(i);
    if (end < max - 1) window.push("…");
    window.push(max);
    return window;
  }, [page, totalPages]);

  return (
    <div className="hidden items-center gap-0.5 sm:flex">
      {pages.map((p, idx) =>
        p === "…" ? (
          <span
            key={`gap-${idx}`}
            className="px-1 text-xs text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "secondary" : "ghost"}
            size="sm"
            className="h-7 min-w-7 px-2 text-xs tabular-nums"
            onClick={() => setPage(p)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        )
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  icon,
  activeClass,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
  activeClass: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? activeClass
          : "bg-background/60 text-muted-foreground ring-border hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`tabular-nums rounded px-1 text-[10px] ${
          active ? "bg-background/40" : "bg-muted/60"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
        <Users className="size-6 text-theme-3 dark:text-theme-1" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
