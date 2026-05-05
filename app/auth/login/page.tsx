import { Sparkles, ShieldCheck, Workflow } from "lucide-react";
import { LoginForm } from "./login-form";

type SearchParams = Promise<{ callbackUrl?: string | string[] }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl;
  const callbackUrl = raw && raw.startsWith("/") ? raw : "/dashboard";

  return (
    <main className="relative grid min-h-screen w-full overflow-hidden lg:grid-cols-2">
      <BrandPanel />

      <section className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-br from-theme-1/15 via-background to-theme-3/15 lg:hidden"
        />
        <div
          aria-hidden
          className="absolute -top-24 -left-24 -z-10 size-72 rounded-full bg-theme-1/30 blur-3xl lg:hidden"
        />
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 -z-10 size-72 rounded-full bg-theme-3/30 blur-3xl lg:hidden"
        />

        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-theme-1 to-theme-3 text-base font-bold tracking-tight text-white shadow-lg shadow-theme-2/40 ring-1 ring-white/20">
              WS
            </div>
            <span className="font-heading text-lg font-semibold">Workflow</span>
          </div>

          <div className="rounded-3xl border border-white/40 bg-card/70 p-7 shadow-2xl shadow-theme-3/20 ring-1 ring-foreground/5 backdrop-blur-2xl backdrop-saturate-150 sm:p-9 dark:border-white/10 dark:bg-card/40">
            <div className="mb-6 flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to continue to your workflow.
              </p>
            </div>

            <LoginForm callbackUrl={callbackUrl} />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Protected by industry-standard encryption.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-24 size-96 rounded-full bg-white/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-16 size-112 rounded-full bg-theme-3/40 blur-3xl"
      />

      <div className="relative flex items-center gap-3 text-white">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-base font-bold tracking-tight text-white shadow-lg shadow-black/10 ring-1 ring-white/30 backdrop-blur-md">
          WS
        </div>
        <span className="font-heading text-lg font-semibold">Workflow</span>
      </div>

      <div className="relative flex flex-col gap-8 text-white">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
            Run your team&apos;s work,
            <br />
            beautifully and effortlessly.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-white/85">
            One place to plan, track, and ship — built for the way modern teams
            actually work.
          </p>
        </div>

        <ul className="flex flex-col gap-3 text-sm text-white/90">
          <FeatureItem icon={<Workflow className="size-4" />}>
            Streamlined pipelines from intake to delivery
          </FeatureItem>
          <FeatureItem icon={<Sparkles className="size-4" />}>
            Smart automations that save hours each week
          </FeatureItem>
          <FeatureItem icon={<ShieldCheck className="size-4" />}>
            Enterprise-grade security, by default
          </FeatureItem>
        </ul>
      </div>

      <div className="relative text-xs text-white/70">
        © {new Date().getFullYear()} Web Spider Solutions. All rights reserved.
      </div>
    </section>
  );
}

function FeatureItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
