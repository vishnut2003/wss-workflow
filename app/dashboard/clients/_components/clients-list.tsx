"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  Users,
  UserPlus,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  CLIENT_STATUSES,
  type ClientListItem,
  type ClientStatus,
} from "@/lib/clients/types";
import { findCountry } from "@/lib/clients/countries";
import type { MemberListItem } from "@/lib/models/user";

import { EditClientDialog } from "./edit-client-dialog";
import { AssignMembersDialog } from "./assign-members-dialog";

type StatusFilter = "all" | ClientStatus;

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  lead: "Lead",
  on_hold: "On hold",
  archived: "Archived",
};

const STATUS_CHIP_ACTIVE: Record<ClientStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  lead: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  on_hold: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  archived: "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300",
};

const STATUS_BADGE: Record<ClientStatus, string> = {
  active:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  lead: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  on_hold: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  archived: "bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300",
};

const AVATAR_GRADIENT = "from-theme-1/40 to-theme-3/30 text-theme-3 dark:text-theme-1";

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "C";
}

function formatAbsoluteDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
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

function countByStatus(clients: ClientListItem[]): Record<ClientStatus, number> {
  const counts: Record<ClientStatus, number> = {
    active: 0,
    lead: 0,
    on_hold: 0,
    archived: 0,
  };
  for (const c of clients) counts[c.status] += 1;
  return counts;
}

function normalizeUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function ClientsList({
  clients,
  canManage,
  canAssign = false,
  assignableMembers = [],
}: {
  clients: ClientListItem[];
  canManage: boolean;
  canAssign?: boolean;
  assignableMembers?: MemberListItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [actionTarget, setActionTarget] = useState<ClientListItem | null>(null);
  const [dialog, setDialog] = useState<"none" | "edit" | "assign">("none");

  const totalCounts = useMemo(() => countByStatus(clients), [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      const dial = findCountry(c.phoneCountry)?.dial ?? "";
      const haystack =
        `${c.name} ${c.company} ${c.email} ${dial} ${c.phone} ${c.industry} ${c.city} ${c.country}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [clients, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };
  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const effectivePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (effectivePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filtered.length);

  const isFiltering = query.trim().length > 0 || statusFilter !== "all";

  const openEdit = (c: ClientListItem) => {
    setActionTarget(c);
    setDialog("edit");
  };
  const openAssign = (c: ClientListItem) => {
    setActionTarget(c);
    setDialog("assign");
  };
  const openView = (c: ClientListItem) => {
    router.push(`/dashboard/clients/${c.id}`);
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
                <Building2 className="size-4 text-theme-3 dark:text-theme-1" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-heading text-sm font-semibold leading-tight">
                  All clients
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isFiltering
                    ? `${filtered.length} of ${clients.length} ${clients.length === 1 ? "client" : "clients"}`
                    : `${clients.length} ${clients.length === 1 ? "client" : "clients"} on file`}
                </p>
              </div>
            </div>

            <InputGroup className="h-9 w-full sm:w-72">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name, company, email..."
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                aria-label="Search clients"
              />
              {query && (
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => updateQuery("")}
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
              active={statusFilter === "all"}
              onClick={() => updateStatusFilter("all")}
              label="All"
              count={clients.length}
              activeClass="bg-foreground/10 text-foreground ring-foreground/20"
            />
            {CLIENT_STATUSES.map((status) => (
              <FilterChip
                key={status}
                active={statusFilter === status}
                onClick={() =>
                  updateStatusFilter(statusFilter === status ? "all" : status)
                }
                label={STATUS_LABEL[status]}
                count={totalCounts[status]}
                activeClass={STATUS_CHIP_ACTIVE[status]}
                disabled={totalCounts[status] === 0}
              />
            ))}
            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => {
                  updateQuery("");
                  updateStatusFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            description={
              canManage
                ? "Add your first client to start tracking the work you do for them."
                : "There are no clients on file yet."
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches"
            description={
              query.trim()
                ? `No clients match "${query.trim()}"${statusFilter !== "all" ? ` in ${STATUS_LABEL[statusFilter]}` : ""}.`
                : `No ${STATUS_LABEL[statusFilter as ClientStatus]} clients yet.`
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateQuery("");
                  updateStatusFilter("all");
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
                    Client
                  </TableHead>
                  <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Industry
                  </TableHead>
                  <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground xl:table-cell">
                    Added
                  </TableHead>
                  <TableHead className="w-12 px-5">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((c) => {
                  const displayName = c.name || c.company || c.email || "Untitled";
                  const subline = c.company || c.email;
                  const location = [c.city, c.country].filter(Boolean).join(", ");
                  return (
                    <TableRow
                      key={c.id}
                      className="group border-border/40 transition-colors hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
                    >
                      <TableCell className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/clients/${c.id}`}
                          className="flex w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-theme-1/50"
                          aria-label={`View details for ${displayName}`}
                        >
                          <Avatar className="size-10 ring-2 ring-background">
                            <AvatarFallback
                              className={`bg-linear-to-br ${AVATAR_GRADIENT} text-xs font-semibold`}
                            >
                              {initialsOf(c.company || c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold transition-colors group-hover:text-theme-3">
                              {displayName}
                            </span>
                            {subline ? (
                              <span className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
                                {c.company ? (
                                  <Building2 className="size-3 shrink-0 opacity-60" />
                                ) : (
                                  <Mail className="size-3 shrink-0 opacity-60" />
                                )}
                                <span className="truncate">{subline}</span>
                              </span>
                            ) : null}
                            <div className="mt-1 flex flex-wrap items-center gap-1 sm:hidden">
                              <StatusBadge status={c.status} />
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              className="inline-flex items-center gap-1 truncate text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <Mail className="size-3 shrink-0 opacity-60" />
                              <span className="truncate">{c.email}</span>
                            </a>
                          ) : null}
                          {c.phone ? (
                            (() => {
                              const country = findCountry(c.phoneCountry);
                              const display = country
                                ? `${country.dial} ${c.phone}`
                                : c.phone;
                              const tel = country
                                ? `${country.dial}${c.phone.replace(/\s+/g, "")}`
                                : c.phone;
                              return (
                                <a
                                  href={`tel:${tel}`}
                                  className="inline-flex items-center gap-1 truncate text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  <Phone className="size-3 shrink-0 opacity-60" />
                                  {country ? (
                                    <span aria-hidden className="shrink-0">
                                      {country.flag}
                                    </span>
                                  ) : null}
                                  <span className="truncate">{display}</span>
                                </a>
                              );
                            })()
                          ) : null}
                          {c.website ? (
                            <a
                              href={normalizeUrl(c.website)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 truncate text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <Globe className="size-3 shrink-0 opacity-60" />
                              <span className="truncate">{c.website}</span>
                            </a>
                          ) : null}
                          {!c.email && !c.phone && !c.website ? (
                            <span className="text-muted-foreground/60">—</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {c.industry ? (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Briefcase className="size-3 shrink-0 opacity-60" />
                              <span className="truncate">{c.industry}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                          {location ? (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <MapPin className="size-3 shrink-0 opacity-60" />
                              <span className="truncate">{location}</span>
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell
                        className="hidden text-right text-xs text-muted-foreground xl:table-cell"
                        title={formatAbsoluteDate(c.createdAt)}
                      >
                        <span className="tabular-nums">
                          {formatRelativeDate(c.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 text-right">
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
                            <DropdownMenuItem onClick={() => openView(c)}>
                              <Eye className="size-4" />
                              View details
                            </DropdownMenuItem>
                            {canManage ? (
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Pencil className="size-4" />
                                Edit client
                              </DropdownMenuItem>
                            ) : null}
                            {canAssign ? (
                              <DropdownMenuItem onClick={() => openAssign(c)}>
                                <UserPlus className="size-4" />
                                Assign members
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                    onClick={() => setPage(Math.max(1, effectivePage - 1))}
                    disabled={effectivePage === 1}
                  >
                    <ChevronLeft className="size-3.5" />
                    Prev
                  </Button>
                  <PageNumbers
                    page={effectivePage}
                    totalPages={totalPages}
                    setPage={setPage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2"
                    onClick={() =>
                      setPage(Math.min(totalPages, effectivePage + 1))
                    }
                    disabled={effectivePage === totalPages}
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

      <EditClientDialog
        open={dialog === "edit"}
        onOpenChange={closeDialog}
        client={dialog === "edit" ? actionTarget : null}
        canAssign={canAssign}
        assignableMembers={assignableMembers}
      />
      <AssignMembersDialog
        open={dialog === "assign"}
        onOpenChange={closeDialog}
        client={dialog === "assign" ? actionTarget : null}
        assignableMembers={assignableMembers}
      />
    </>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
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
