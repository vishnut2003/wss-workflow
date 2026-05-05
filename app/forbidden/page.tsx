import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold">403 — Forbidden</h1>
      <p className="text-sm text-muted-foreground">
        You do not have permission to access this page.
      </p>
      <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Back to dashboard
      </Link>
    </main>
  );
}
