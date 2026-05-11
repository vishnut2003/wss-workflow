import { notFound } from "next/navigation";
import {
  Briefcase,
  Building2,
  Calendar,
  Globe,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  Tag,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth/session";
import { findClientListItemById } from "@/lib/models/client";
import { findCountry } from "@/lib/clients/countries";
import type { ClientListItem, ClientStatus } from "@/lib/clients/types";

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  lead: "Lead",
  on_hold: "On hold",
  archived: "Archived",
};

const STATUS_BADGE: Record<ClientStatus, string> = {
  active:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  lead: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  on_hold: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  archived: "bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300",
};

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "C";
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

function normalizeUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireRole("admin");
  const { clientId } = await params;
  const client = await findClientListItemById(clientId);
  if (!client) notFound();

  const country = findCountry(client.phoneCountry);
  const phoneDisplay = client.phone
    ? country
      ? `${country.dial} ${client.phone}`
      : client.phone
    : "";
  const phoneTel = client.phone
    ? country
      ? `${country.dial}${client.phone.replace(/\s+/g, "")}`
      : client.phone
    : "";
  const location = [client.city, client.country].filter(Boolean).join(", ");
  const displayName = client.name || client.company || client.email || "Untitled";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm ring-1 ring-foreground/5">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 ring-2 ring-background">
            <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-lg font-semibold text-theme-3 dark:text-theme-1">
              {initialsOf(client.company || client.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h1 className="truncate font-heading text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            {client.company && client.name ? (
              <p className="inline-flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Building2 className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate">{client.company}</span>
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_BADGE[client.status]}`}
              >
                {STATUS_LABEL[client.status]}
              </span>
              {client.industry ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                  <Briefcase className="size-3" />
                  {client.industry}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ClientDetails
        client={client}
        location={location}
        phoneDisplay={phoneDisplay}
        phoneTel={phoneTel}
        countryFlag={country?.flag}
      />
    </div>
  );
}

function ClientDetails({
  client,
  location,
  phoneDisplay,
  phoneTel,
  countryFlag,
}: {
  client: ClientListItem;
  location: string;
  phoneDisplay: string;
  phoneTel: string;
  countryFlag: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <DetailRow
          icon={UserIcon}
          label="Contact name"
          value={client.name || undefined}
        />
        <DetailRow
          icon={Building2}
          label="Company"
          value={client.company || undefined}
        />
        <DetailRow
          icon={Mail}
          label="Email"
          value={client.email || undefined}
          href={client.email ? `mailto:${client.email}` : undefined}
        />
        <DetailRow
          icon={Phone}
          label="Phone"
          value={phoneDisplay || undefined}
          prefix={countryFlag}
          href={phoneTel ? `tel:${phoneTel}` : undefined}
        />
        <DetailRow
          icon={Globe}
          label="Website"
          value={client.website || undefined}
          href={client.website ? normalizeUrl(client.website) : undefined}
          external
        />
        <DetailRow
          icon={Briefcase}
          label="Industry"
          value={client.industry || undefined}
        />
        <DetailRow
          icon={MapPin}
          label="Address"
          value={
            [client.address, location].filter(Boolean).join(" · ") || undefined
          }
          className="sm:col-span-2"
        />
      </dl>

      {client.notes ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <StickyNote className="size-3.5 text-theme-3" />
            Notes
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {client.notes}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3 opacity-70" />
          Added {formatDate(client.createdAt)}
        </span>
        {client.updatedAt && client.updatedAt !== client.createdAt ? (
          <span className="inline-flex items-center gap-1">
            <Tag className="size-3 opacity-70" />
            Updated {formatDate(client.updatedAt)}
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
  external,
  prefix,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  href?: string;
  external?: boolean;
  prefix?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-lg border border-border/40 bg-card/40 px-3 py-2 ${className ?? ""}`}
    >
      <dt className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3 opacity-70" />
        {label}
      </dt>
      <dd className="truncate text-sm">
        {value ? (
          href ? (
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
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
