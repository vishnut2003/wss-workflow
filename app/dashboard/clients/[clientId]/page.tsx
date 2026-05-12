import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  Crown,
  ExternalLink,
  FolderKanban,
  Globe,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Pin,
  Plus,
  Sparkles,
  StickyNote,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { findClientListItemById } from "@/lib/models/client";
import { listProjectsForClient } from "@/lib/models/project";
import { listContactsForClient } from "@/lib/models/client-contact";
import { listNotesForClient } from "@/lib/models/client-note";
import { findCountry } from "@/lib/clients/countries";
import type { ClientListItem, ClientStatus } from "@/lib/clients/types";
import type { ClientContactListItem } from "@/lib/clients/contact-types";
import type { ClientNoteListItem } from "@/lib/clients/note-types";
import type { ProjectListItem, ProjectStatus } from "@/lib/projects/types";

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  lead: "Lead",
  on_hold: "On hold",
  archived: "Archived",
};

const STATUS_BADGE: Record<ClientStatus, string> = {
  active:
    "bg-emerald-500/20 text-emerald-50 ring-emerald-200/40 dark:text-emerald-100",
  lead: "bg-sky-500/20 text-sky-50 ring-sky-200/40 dark:text-sky-100",
  on_hold:
    "bg-amber-500/20 text-amber-50 ring-amber-200/40 dark:text-amber-100",
  archived:
    "bg-slate-500/20 text-slate-50 ring-slate-200/40 dark:text-slate-100",
};

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const PROJECT_STATUS_PILL: Record<ProjectStatus, string> = {
  planned: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  in_progress:
    "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  on_hold:
    "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  completed:
    "bg-violet-500/15 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  archived:
    "bg-slate-500/15 text-slate-700 ring-slate-500/25 dark:text-slate-300",
};

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "C";
}

function formatLongDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatShortDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatRelative(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 1) return "just now";
  if (Math.abs(diffMin) < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 7) return `${diffD}d ago`;
  return formatShortDate(iso);
}

function daysSince(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - d.getTime()) / 86_400_000)
  );
}

function normalizeUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function prettyDomain(value: string): string {
  if (!value) return "";
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
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

  const [projects, contacts, notes] = await Promise.all([
    listProjectsForClient(clientId),
    listContactsForClient(clientId),
    listNotesForClient(clientId),
  ]);

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
  const websiteHref = client.website ? normalizeUrl(client.website) : "";
  const location = [client.city, client.country].filter(Boolean).join(", ");
  const displayName = client.name || client.company || client.email || "Untitled";
  const since = daysSince(client.createdAt);

  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const primaryContact = contacts.find((c) => c.isPrimary) ?? null;

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const featuredNotes = [...notes]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <HeroCard
        client={client}
        displayName={displayName}
        location={location}
        phoneDisplay={phoneDisplay}
        phoneTel={phoneTel}
        websiteHref={websiteHref}
        countryFlag={country?.flag}
        since={since}
      />

      <StatsGrid
        clientId={clientId}
        projectsCount={projects.length}
        activeProjects={activeProjects}
        completedProjects={completedProjects}
        contactsCount={contacts.length}
        notesCount={notes.length}
        sinceDays={since}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <ProjectsPanel
          clientId={clientId}
          projects={recentProjects}
          total={projects.length}
        />
        <ContactPanel
          clientId={clientId}
          client={client}
          phoneDisplay={phoneDisplay}
          phoneTel={phoneTel}
          websiteHref={websiteHref}
          countryFlag={country?.flag}
          location={location}
          primaryContact={primaryContact}
          contactsCount={contacts.length}
        />
      </section>

      <NotesPanel
        clientId={clientId}
        notes={featuredNotes}
        total={notes.length}
      />

      <ActivityFooter
        createdAt={client.createdAt}
        updatedAt={client.updatedAt}
      />
    </div>
  );
}

function HeroCard({
  client,
  displayName,
  location,
  phoneDisplay,
  phoneTel,
  websiteHref,
  countryFlag,
  since,
}: {
  client: ClientListItem;
  displayName: string;
  location: string;
  phoneDisplay: string;
  phoneTel: string;
  websiteHref: string;
  countryFlag: string | undefined;
  since: number;
}) {
  const sinceLabel =
    since === 0
      ? "Added today"
      : since === 1
        ? "1 day with us"
        : since < 30
          ? `${since} days with us`
          : since < 365
            ? `${Math.round(since / 30)} months with us`
            : `${Math.round((since / 365) * 10) / 10} years with us`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 p-6 text-white shadow-lg shadow-theme-3/25 sm:p-8">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.45) 0, transparent 42%), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.32) 0, transparent 48%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-12 size-72 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-10 size-72 rounded-full bg-black/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-20 shrink-0 ring-4 ring-white/25 shadow-lg shadow-black/20">
            <AvatarFallback className="bg-white/20 text-xl font-semibold text-white backdrop-blur-sm">
              {initialsOf(client.company || client.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ring-1 ${STATUS_BADGE[client.status]}`}
              >
                <Sparkles className="size-3" />
                {STATUS_LABEL[client.status]}
              </span>
              {client.industry ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-md">
                  <Briefcase className="size-3" />
                  {client.industry}
                </span>
              ) : null}
              {location ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-md">
                  <MapPin className="size-3" />
                  {location}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {displayName}
              </h1>
              {client.company && client.name ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-white/85">
                  <Building2 className="size-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{client.company}</span>
                </p>
              ) : null}
            </div>

            <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
              <CalendarDays className="size-3" />
              {sinceLabel}
            </p>
          </div>
        </div>

        {client.email || phoneTel || websiteHref ? (
          <div className="flex flex-wrap items-center gap-2">
            {client.email ? (
              <Button
                size="sm"
                nativeButton={false}
                className="h-9 bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md hover:bg-white/25"
                render={<a href={`mailto:${client.email}`} />}
              >
                <Mail className="size-4" />
                Email
              </Button>
            ) : null}
            {phoneTel ? (
              <Button
                size="sm"
                nativeButton={false}
                className="h-9 bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md hover:bg-white/25"
                render={<a href={`tel:${phoneTel}`} />}
              >
                <Phone className="size-4" />
                {countryFlag ? (
                  <span aria-hidden className="mr-0.5">
                    {countryFlag}
                  </span>
                ) : null}
                {phoneDisplay || "Call"}
              </Button>
            ) : null}
            {websiteHref ? (
              <Button
                size="sm"
                nativeButton={false}
                className="h-9 bg-white text-theme-3 ring-1 ring-white/40 hover:bg-white/90"
                render={
                  <a href={websiteHref} target="_blank" rel="noreferrer" />
                }
              >
                <Globe className="size-4" />
                {prettyDomain(client.website) || "Website"}
                <ExternalLink className="size-3.5 opacity-70" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatsGrid({
  clientId,
  projectsCount,
  activeProjects,
  completedProjects,
  contactsCount,
  notesCount,
  sinceDays,
}: {
  clientId: string;
  projectsCount: number;
  activeProjects: number;
  completedProjects: number;
  contactsCount: number;
  notesCount: number;
  sinceDays: number;
}) {
  const cards: Array<{
    label: string;
    value: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    href: string;
  }> = [
    {
      label: "Projects",
      value: String(projectsCount),
      hint:
        projectsCount === 0
          ? "None yet"
          : activeProjects > 0
            ? `${activeProjects} active`
            : completedProjects > 0
              ? `${completedProjects} completed`
              : "Standing by",
      icon: FolderKanban,
      accent: "from-theme-1 to-theme-3",
      href: `/dashboard/clients/${clientId}/projects`,
    },
    {
      label: "Contacts",
      value: String(contactsCount),
      hint:
        contactsCount === 0
          ? "Add a contact"
          : `${contactsCount} on file`,
      icon: Users,
      accent: "from-violet-400 to-fuchsia-500",
      href: `/dashboard/clients/${clientId}/contacts`,
    },
    {
      label: "Notes",
      value: String(notesCount),
      hint:
        notesCount === 0
          ? "Capture context"
          : `${notesCount} ${notesCount === 1 ? "note" : "notes"}`,
      icon: NotebookPen,
      accent: "from-amber-400 to-orange-500",
      href: `/dashboard/clients/${clientId}/notes`,
    },
    {
      label: "Relationship",
      value:
        sinceDays < 30
          ? `${sinceDays}d`
          : sinceDays < 365
            ? `${Math.round(sinceDays / 30)}mo`
            : `${Math.round((sinceDays / 365) * 10) / 10}y`,
      hint: sinceDays === 0 ? "Just added" : "Since onboarding",
      icon: CalendarDays,
      accent: "from-sky-400 to-blue-600",
      href: `/dashboard/clients/${clientId}`,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-theme-3/10"
    >
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 size-32 rounded-full bg-linear-to-br ${accent} opacity-15 blur-2xl transition-opacity group-hover:opacity-25`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md shadow-black/10 ring-1 ring-white/20`}
        >
          <Icon className="size-5" />
        </div>
        <span className="inline-flex max-w-[55%] items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <span className="truncate">{hint}</span>
        </span>
      </div>
      <div className="relative mt-4 flex flex-col gap-0.5">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </Link>
  );
}

function ProjectsPanel({
  clientId,
  projects,
  total,
}: {
  clientId: string;
  projects: ProjectListItem[];
  total: number;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
            <FolderKanban className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">
              Recent projects
            </h2>
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? "Nothing here yet"
                : `${total} total · sorted by latest activity`}
            </p>
          </div>
        </div>
        {total > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="h-8 gap-1 text-xs text-theme-3 hover:text-theme-2 dark:text-theme-1"
            render={<Link href={`/dashboard/clients/${clientId}/projects`} />}
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderKanban className="size-5" />
          </div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Spin up the first project for this client to start tracking work.
          </p>
          <Button
            size="sm"
            nativeButton={false}
            className="mt-2 h-8 gap-1 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
            render={<Link href={`/dashboard/clients/${clientId}/projects`} />}
          >
            <Plus className="size-3.5" />
            New project
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/25 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
                  <FolderKanban className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold group-hover:text-theme-3 dark:group-hover:text-theme-1">
                    {p.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${PROJECT_STATUS_PILL[p.status]}`}
                    >
                      {PROJECT_STATUS_LABEL[p.status]}
                    </span>
                    {p.dueDate ? (
                      <>
                        <span className="opacity-50">·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3 opacity-70" />
                          Due {formatShortDate(p.dueDate)}
                        </span>
                      </>
                    ) : null}
                    {p.assignees.length > 0 ? (
                      <>
                        <span className="opacity-50">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3 opacity-70" />
                          {p.assignees.length}{" "}
                          {p.assignees.length === 1 ? "lead" : "leads"}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactPanel({
  clientId,
  client,
  phoneDisplay,
  phoneTel,
  websiteHref,
  countryFlag,
  location,
  primaryContact,
  contactsCount,
}: {
  clientId: string;
  client: ClientListItem;
  phoneDisplay: string;
  phoneTel: string;
  websiteHref: string;
  countryFlag: string | undefined;
  location: string;
  primaryContact: ClientContactListItem | null;
  contactsCount: number;
}) {
  const primaryCountry = primaryContact
    ? findCountry(primaryContact.phoneCountry)
    : null;
  const primaryPhoneDisplay = primaryContact?.phone
    ? primaryCountry
      ? `${primaryCountry.dial} ${primaryContact.phone}`
      : primaryContact.phone
    : "";
  const primaryPhoneTel = primaryContact?.phone
    ? primaryCountry
      ? `${primaryCountry.dial}${primaryContact.phone.replace(/\s+/g, "")}`
      : primaryContact.phone
    : "";
  const addressFull = [client.address, location].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Users className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">
              Contact
            </h2>
            <p className="text-xs text-muted-foreground">
              {contactsCount === 0
                ? "Reach out details"
                : `${contactsCount} ${contactsCount === 1 ? "person" : "people"} on file`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href={`/dashboard/clients/${clientId}/contacts`} />}
        >
          Manage
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {primaryContact ? (
          <Link
            href={`/dashboard/clients/${clientId}/contacts`}
            className="group flex items-center gap-3 rounded-lg bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent p-3 ring-1 ring-amber-500/20 transition-colors hover:from-amber-500/15"
          >
            <Avatar className="size-10 shrink-0 ring-2 ring-card">
              <AvatarFallback className="bg-linear-to-br from-amber-400/40 to-orange-500/30 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {initialsOf(primaryContact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1.5">
                <Crown className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-300">
                  Primary contact
                </span>
              </div>
              <span className="truncate text-sm font-semibold">
                {primaryContact.name}
              </span>
              {primaryContact.title ? (
                <span className="truncate text-[11px] text-muted-foreground">
                  {primaryContact.title}
                </span>
              ) : null}
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ) : null}

        <dl className="flex flex-col gap-2">
          {primaryContact?.email || client.email ? (
            <DetailRow
              icon={Mail}
              label="Email"
              value={primaryContact?.email || client.email}
              href={`mailto:${primaryContact?.email || client.email}`}
            />
          ) : null}
          {(primaryPhoneTel || phoneTel) ? (
            <DetailRow
              icon={Phone}
              label="Phone"
              value={primaryPhoneDisplay || phoneDisplay}
              prefix={primaryCountry?.flag || countryFlag}
              href={`tel:${primaryPhoneTel || phoneTel}`}
            />
          ) : null}
          {websiteHref ? (
            <DetailRow
              icon={Globe}
              label="Website"
              value={prettyDomain(client.website)}
              href={websiteHref}
              external
            />
          ) : null}
          {addressFull ? (
            <DetailRow icon={MapPin} label="Address" value={addressFull} />
          ) : null}
          {!primaryContact?.email &&
          !client.email &&
          !primaryPhoneTel &&
          !phoneTel &&
          !websiteHref &&
          !addressFull ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
              No contact details captured yet.
            </div>
          ) : null}
        </dl>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  prefix?: string;
}) {
  const content = (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
        <Icon className="size-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <dt className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
          {label}
        </dt>
        <dd className="flex min-w-0 items-center gap-1.5 text-sm">
          {prefix ? (
            <span aria-hidden className="shrink-0">
              {prefix}
            </span>
          ) : null}
          <span className="truncate">{value}</span>
        </dd>
      </div>
      {href ? (
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/70" />
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
        {content}
      </div>
    );
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 px-3 py-2 transition-colors hover:border-theme-1/40 hover:bg-muted/40"
    >
      {content}
    </a>
  );
}

function NotesPanel({
  clientId,
  notes,
  total,
}: {
  clientId: string;
  notes: ClientNoteListItem[];
  total: number;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400/30 to-orange-500/20 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <StickyNote className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Recent notes</h2>
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? "Capture context for the team"
                : `${total} ${total === 1 ? "note" : "notes"} on this client`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          render={<Link href={`/dashboard/clients/${clientId}/notes`} />}
        >
          {total === 0 ? "Add note" : "View all"}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <NotebookPen className="size-5" />
          </div>
          <p className="text-sm font-medium">No notes yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Drop a quick note so the rest of the team has context next time.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="group flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 ring-1 ring-foreground/5 transition-colors hover:border-theme-1/40 hover:bg-muted/30"
            >
              <div className="flex items-center justify-between gap-2">
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback className="bg-linear-to-br from-theme-1/40 to-theme-3/30 text-[9px] font-semibold text-theme-3 dark:text-theme-1">
                    {initialsOf(n.authorName || n.authorEmail || "•")}
                  </AvatarFallback>
                </Avatar>
                {n.pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase ring-1 ring-amber-500/25 dark:text-amber-300">
                    <Pin className="size-2.5" />
                    Pinned
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelative(n.updatedAt || n.createdAt)}
                  </span>
                )}
              </div>
              <p className="line-clamp-4 text-sm whitespace-pre-wrap text-foreground/90">
                {n.body}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span className="truncate">
                  {n.authorName || n.authorEmail || "Unknown"}
                </span>
                {n.pinned ? (
                  <span>{formatRelative(n.updatedAt || n.createdAt)}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityFooter({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  const wasUpdated = updatedAt && updatedAt !== createdAt;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/40 bg-card/40 px-4 py-2.5 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-3 opacity-70" />
        Added {formatLongDate(createdAt)}
      </span>
      {wasUpdated ? (
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3 opacity-70" />
          Updated {formatRelative(updatedAt)}
        </span>
      ) : null}
    </div>
  );
}
