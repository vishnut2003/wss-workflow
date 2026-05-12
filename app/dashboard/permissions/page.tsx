import { ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/roles";
import { getPermissionOverrides } from "@/lib/models/permission";

import { PermissionsEditor } from "./_components/permissions-editor";

export default async function PermissionsPage() {
  await requireRole("super_admin");
  const overrides = await getPermissionOverrides();
  const manageableRoles = ROLES.filter((r) => r !== "super_admin");

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 ring-1 ring-foreground/5 sm:p-7">
        <div
          aria-hidden
          className="absolute -top-16 -right-12 size-48 rounded-full bg-linear-to-br from-theme-1/25 to-theme-3/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-theme-1 to-theme-3 text-white shadow-md shadow-theme-3/30 ring-1 ring-white/20">
              <ShieldCheck className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Manage permissions
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Toggle what each role can see and do. Changes take effect
                immediately. Defaults apply when a toggle is left untouched.
                Super admin always has full access and cannot be restricted.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PermissionsEditor
        roles={manageableRoles}
        initialOverrides={overrides}
      />
    </div>
  );
}
