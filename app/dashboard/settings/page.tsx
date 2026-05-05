import { requireSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/models/user";
import { SettingsTabs } from "./_components/settings-tabs";

export default async function SettingsPage() {
  const session = await requireSession();
  const isSuperAdmin = session.user.role === "super_admin";

  let initialProfile = {
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };

  if (!isSuperAdmin && session.user.id) {
    const me = await findUserById(session.user.id);
    if (me) {
      initialProfile = { name: me.name ?? "", email: me.email };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, security, and personalisation.
        </p>
      </div>

      <SettingsTabs
        initialProfile={initialProfile}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
