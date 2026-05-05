import { requireSession, logoutAction } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{session.user.name ?? session.user.email}</span>
          <span className="text-xs text-muted-foreground">{session.user.role}</span>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
