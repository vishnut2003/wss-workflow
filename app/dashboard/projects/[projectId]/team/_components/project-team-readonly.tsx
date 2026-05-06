import { Mail, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ProjectMember } from "@/lib/projects/types";

function initialsOf(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  return local.slice(0, 2).toUpperCase();
}

export function ProjectTeamReadOnly({
  members,
}: {
  members: ProjectMember[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-br from-theme-1/8 via-card to-card px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 ring-1 ring-violet-500/20">
          <Users className="size-4 text-violet-700 dark:text-violet-300" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-semibold leading-tight">
            Team members
          </h2>
          <p className="text-xs text-muted-foreground">
            {members.length === 0
              ? "No members assigned to this project yet"
              : `${members.length} ${members.length === 1 ? "person" : "people"} on this project`}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/15">
            <Users className="size-6 text-violet-700 dark:text-violet-300" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">No team members yet</p>
            <p className="text-xs text-muted-foreground">
              An assigned manager can add members from their team.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {members.map((m) => {
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
