"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Star,
  Trash2,
  UserPlus,
  Users,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientContactListItem } from "@/lib/clients/contact-types";
import { findCountry } from "@/lib/clients/countries";

import { setPrimaryContactAction } from "../actions";
import { EditContactDialog } from "./edit-contact-dialog";
import { DeleteContactDialog } from "./delete-contact-dialog";
import { ViewContactDialog } from "./view-contact-dialog";

const AVATAR_GRADIENT = "from-theme-1/40 to-theme-3/30 text-theme-3 dark:text-theme-1";

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "?";
}

export function ContactsList({
  contacts,
}: {
  contacts: ClientContactListItem[];
}) {
  const [actionTarget, setActionTarget] = useState<ClientContactListItem | null>(
    null
  );
  const [dialog, setDialog] = useState<"none" | "view" | "edit" | "delete">(
    "none"
  );
  const [primaryPending, startPrimaryTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openView = (c: ClientContactListItem) => {
    setActionTarget(c);
    setDialog("view");
  };
  const openEdit = (c: ClientContactListItem) => {
    setActionTarget(c);
    setDialog("edit");
  };
  const openDelete = (c: ClientContactListItem) => {
    setActionTarget(c);
    setDialog("delete");
  };
  const closeDialog = (open: boolean) => {
    if (!open) {
      setDialog("none");
      window.setTimeout(() => setActionTarget(null), 150);
    }
  };

  const handleSetPrimary = (c: ClientContactListItem) => {
    if (c.isPrimary) return;
    const fd = new FormData();
    fd.set("contactId", c.id);
    setPendingId(c.id);
    startPrimaryTransition(async () => {
      await setPrimaryContactAction(undefined, fd);
      setPendingId(null);
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
        {contacts.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Reach
                </TableHead>
                <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Notes
                </TableHead>
                <TableHead className="w-12 px-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => {
                const country = findCountry(c.phoneCountry);
                const phoneDisplay = c.phone
                  ? country
                    ? `${country.dial} ${c.phone}`
                    : c.phone
                  : "";
                const phoneTel = c.phone
                  ? country
                    ? `${country.dial}${c.phone.replace(/\s+/g, "")}`
                    : c.phone
                  : "";

                return (
                  <TableRow
                    key={c.id}
                    className={`group border-border/40 transition-colors hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent ${
                      pendingId === c.id ? "opacity-60" : ""
                    }`}
                  >
                    <TableCell className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => openView(c)}
                        className="flex w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-theme-1/50"
                        aria-label={`View details for ${c.name}`}
                      >
                        <Avatar className="size-10 ring-2 ring-background">
                          <AvatarFallback
                            className={`bg-linear-to-br ${AVATAR_GRADIENT} text-xs font-semibold`}
                          >
                            {initialsOf(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="inline-flex items-center gap-1.5 truncate text-sm font-semibold transition-colors group-hover:text-theme-3">
                            <span className="truncate">{c.name}</span>
                            {c.isPrimary ? (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300"
                                title="Primary contact"
                              >
                                <Star className="size-2.5" />
                                Primary
                              </span>
                            ) : null}
                          </span>
                          {c.title ? (
                            <span className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Briefcase className="size-3 shrink-0 opacity-60" />
                              <span className="truncate">{c.title}</span>
                            </span>
                          ) : null}
                          <div className="mt-1 flex flex-col gap-0.5 text-xs md:hidden">
                            {c.email ? (
                              <span className="inline-flex items-center gap-1 truncate text-muted-foreground">
                                <Mail className="size-3 shrink-0 opacity-60" />
                                <span className="truncate">{c.email}</span>
                              </span>
                            ) : null}
                            {phoneDisplay ? (
                              <span className="inline-flex items-center gap-1 truncate text-muted-foreground">
                                <Phone className="size-3 shrink-0 opacity-60" />
                                {country ? (
                                  <span aria-hidden className="shrink-0">
                                    {country.flag}
                                  </span>
                                ) : null}
                                <span className="truncate">{phoneDisplay}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
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
                        {phoneDisplay ? (
                          <a
                            href={`tel:${phoneTel}`}
                            className="inline-flex items-center gap-1 truncate text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Phone className="size-3 shrink-0 opacity-60" />
                            {country ? (
                              <span aria-hidden className="shrink-0">
                                {country.flag}
                              </span>
                            ) : null}
                            <span className="truncate">{phoneDisplay}</span>
                          </a>
                        ) : null}
                        {!c.email && !phoneDisplay ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-104 lg:table-cell">
                      {c.notes ? (
                        <span
                          className="line-clamp-2 text-xs text-muted-foreground"
                          title={c.notes}
                        >
                          {c.notes}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${c.name}`}
                              disabled={primaryPending && pendingId === c.id}
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
                          <DropdownMenuItem
                            onClick={() => handleSetPrimary(c)}
                            disabled={c.isPrimary}
                          >
                            <Star className="size-4" />
                            {c.isPrimary ? "Primary contact" : "Set as primary"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="size-4" />
                            Edit contact
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDelete(c)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Delete contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <ViewContactDialog
        open={dialog === "view"}
        onOpenChange={closeDialog}
        contact={dialog === "view" ? actionTarget : null}
        onEdit={() => {
          if (actionTarget) openEdit(actionTarget);
        }}
      />

      <EditContactDialog
        open={dialog === "edit"}
        onOpenChange={closeDialog}
        contact={dialog === "edit" ? actionTarget : null}
      />

      <DeleteContactDialog
        open={dialog === "delete"}
        onOpenChange={closeDialog}
        contactId={dialog === "delete" ? actionTarget?.id ?? null : null}
        contactName={actionTarget?.name ?? ""}
      />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-theme-1/20 to-theme-3/10 ring-1 ring-theme-1/15">
        <Users className="size-6 text-theme-3 dark:text-theme-1" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">No contacts yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Add the people you work with at this client — billing, technical,
          decision makers.
        </p>
      </div>
      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
        <UserPlus className="size-3" />
        Use the “Add contact” button above to get started.
      </div>
    </div>
  );
}
