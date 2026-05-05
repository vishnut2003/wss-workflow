import { Crown, ShieldCheck, UserCog, User } from "lucide-react";
import type { Role } from "@/lib/auth/roles";

const STYLES: Record<
  Role,
  { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  super_admin: {
    label: "Super Admin",
    cls: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    cls: "bg-theme-1/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1",
    icon: ShieldCheck,
  },
  manager: {
    label: "Manager",
    cls: "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-400",
    icon: UserCog,
  },
  member: {
    label: "Member",
    cls: "bg-muted text-muted-foreground ring-1 ring-border",
    icon: User,
  },
};

export function RoleBadge({ role }: { role: Role }) {
  const { label, cls, icon: Icon } = STYLES[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
