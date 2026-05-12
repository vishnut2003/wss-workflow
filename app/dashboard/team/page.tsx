import { Mail, UserCog, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { requireCan } from "@/lib/permissions/check";
import { listMembersForManager } from "@/lib/models/user";

function initialsOf(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

function formatJoinedDate(iso: string) {
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

export default async function TeamPage() {
  const session = await requireCan("pages.team");
  const team = await listMembersForManager(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Team members reporting to you.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
        <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-br from-theme-1/8 via-card to-card px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 ring-1 ring-violet-500/20">
            <UserCog className="size-4 text-violet-700 dark:text-violet-300" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold leading-tight">
              Direct reports
            </h2>
            <p className="text-xs text-muted-foreground">
              {team.length === 0
                ? "No team members assigned yet"
                : `${team.length} ${team.length === 1 ? "person" : "people"} on your team`}
            </p>
          </div>
        </div>

        {team.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/15">
              <Users className="size-6 text-violet-700 dark:text-violet-300" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">No team members yet</p>
              <p className="text-xs text-muted-foreground">
                An admin can assign team members to you from the Members page.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {team.map((m) => {
              const displayName = m.name?.trim() || m.email.split("@")[0];
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-linear-to-r hover:from-theme-1/5 hover:to-transparent"
                >
                  <Avatar className="size-10 ring-2 ring-background">
                    <AvatarFallback className="bg-linear-to-br from-slate-300/60 to-slate-400/30 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {initialsOf(m.name || m.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">
                      {displayName}
                    </span>
                    <a
                      href={`mailto:${m.email}`}
                      className="group/email inline-flex w-fit max-w-full items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Mail className="size-3 shrink-0 opacity-60 group-hover/email:opacity-100" />
                      <span className="truncate">{m.email}</span>
                    </a>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    Joined {formatJoinedDate(m.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
