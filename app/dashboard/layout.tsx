import { requireSession, logoutAction } from "@/lib/auth/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

  const user = {
    name: displayName,
    email: session.user.email ?? "",
    role: session.user.role ?? "member",
    initials: getInitials(displayName),
  };

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset className="bg-linear-to-br from-background via-background to-theme-1/4">
        <DashboardHeader user={user} logoutAction={logoutAction} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
