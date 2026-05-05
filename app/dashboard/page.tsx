import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {session?.user?.email} ({session?.user?.role}).
      </p>
    </div>
  );
}
