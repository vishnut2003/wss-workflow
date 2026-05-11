"use client";

import {
  Briefcase,
  Calendar,
  Mail,
  Pencil,
  Phone,
  Star,
  StickyNote,
  Tag,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientContactListItem } from "@/lib/clients/contact-types";
import { findCountry } from "@/lib/clients/countries";

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "?";
}

function formatDate(iso: string) {
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

export function ViewContactDialog({
  open,
  onOpenChange,
  contact,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ClientContactListItem | null;
  onEdit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Contact details</DialogTitle>
        </DialogHeader>
        {contact ? <ViewContactBody contact={contact} /> : null}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Close
          </DialogClose>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              window.setTimeout(onEdit, 150);
            }}
            className="bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20 hover:brightness-105"
          >
            <Pencil />
            Edit contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewContactBody({ contact }: { contact: ClientContactListItem }) {
  const country = findCountry(contact.phoneCountry);
  const phoneDisplay = contact.phone
    ? country
      ? `${country.dial} ${contact.phone}`
      : contact.phone
    : "";
  const phoneTel = contact.phone
    ? country
      ? `${country.dial}${contact.phone.replace(/\s+/g, "")}`
      : contact.phone
    : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <Avatar className="size-14 ring-2 ring-background">
          <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-base font-semibold text-theme-3 dark:text-theme-1">
            {initialsOf(contact.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate font-heading text-lg font-semibold tracking-tight">
            {contact.name}
          </h2>
          {contact.title ? (
            <p className="inline-flex items-center gap-1 truncate text-sm text-muted-foreground">
              <Briefcase className="size-3.5 shrink-0 opacity-70" />
              <span className="truncate">{contact.title}</span>
            </p>
          ) : null}
          {contact.isPrimary ? (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
                <Star className="size-3" />
                Primary contact
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <DetailRow
          icon={UserIcon}
          label="Name"
          value={contact.name || undefined}
        />
        <DetailRow
          icon={Briefcase}
          label="Title"
          value={contact.title || undefined}
        />
        <DetailRow
          icon={Mail}
          label="Email"
          value={contact.email || undefined}
          href={contact.email ? `mailto:${contact.email}` : undefined}
        />
        <DetailRow
          icon={Phone}
          label="Phone"
          value={phoneDisplay || undefined}
          prefix={country?.flag}
          href={phoneTel ? `tel:${phoneTel}` : undefined}
        />
      </dl>

      {contact.notes ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <StickyNote className="size-3.5 text-theme-3" />
            Notes
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {contact.notes}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3 opacity-70" />
          Added {formatDate(contact.createdAt)}
        </span>
        {contact.updatedAt && contact.updatedAt !== contact.createdAt ? (
          <span className="inline-flex items-center gap-1">
            <Tag className="size-3 opacity-70" />
            Updated {formatDate(contact.updatedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
  prefix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  href?: string;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
      <dt className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3 opacity-70" />
        {label}
      </dt>
      <dd className="truncate text-sm">
        {value ? (
          href ? (
            <a
              href={href}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-theme-3 hover:underline"
            >
              {prefix ? (
                <span aria-hidden className="shrink-0">
                  {prefix}
                </span>
              ) : null}
              <span className="truncate">{value}</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {prefix ? (
                <span aria-hidden className="shrink-0">
                  {prefix}
                </span>
              ) : null}
              <span className="truncate">{value}</span>
            </span>
          )
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </dd>
    </div>
  );
}
