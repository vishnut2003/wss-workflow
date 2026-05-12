import { requireSession, logoutAction } from "@/lib/auth/session";
import { hasAtLeast } from "@/lib/auth/roles";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { listAllProjects, listProjectsForUser } from "@/lib/models/project";
import { findUserById } from "@/lib/models/user";
import { getEffectiveCapabilities } from "@/lib/permissions/check";
import type { SidebarProject } from "@/lib/projects/types";
import { AppSidebar } from "./_components/app-sidebar";
import { DashboardHeader } from "./_components/dashboard-header";

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const local = nameOrEmail.split("@")[0];
  return local.slice(0, 2).toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const displayName = session.user.name ?? session.user.email ?? "User";

  let managerName: string | null = null;
  if (session.user.role === "member" && session.user.id) {
    const me = await findUserById(session.user.id);
    if (me?.managerId) {
      const manager = await findUserById(me.managerId.toString());
      if (manager) {
        managerName = (manager.name ?? "").trim() || manager.email;
      }
    }
  }

  const user = {
    name: displayName,
    email: session.user.email ?? "",
    role: session.user.role ?? "member",
    initials: getInitials(displayName),
    managerName,
  };

  const [projects, capabilitySet] = await Promise.all([
    hasAtLeast(user.role, "admin")
      ? listAllProjects()
      : listProjectsForUser(session.user.id),
    getEffectiveCapabilities(user.role),
  ]);

  const sidebarProjects: SidebarProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    clientLabel: p.client?.company || p.client?.name || "",
  }));

  const capabilities = Array.from(capabilitySet);

  return (
    <SidebarProvider>
      <AppSidebar
        role={user.role}
        projects={sidebarProjects}
        capabilities={capabilities}
      />
      <SidebarInset className="bg-linear-to-br from-background via-background to-theme-1/4">
        <DashboardHeader user={user} logoutAction={logoutAction} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
