import { Construction, LifeBuoy, Mail, Sparkles } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-theme-1 via-theme-2 to-theme-3 p-6 text-white shadow-lg shadow-theme-3/20 sm:p-10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.3) 0, transparent 45%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-20 -right-10 size-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex flex-col items-start gap-4">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium tracking-wide ring-1 ring-white/25 backdrop-blur-md">
            <Sparkles className="size-3" />
            <span>Coming soon</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Help & Support
          </h1>
          <p className="max-w-xl text-sm text-white/85">
            We&apos;re building a dedicated help center with guides, FAQs, and
            in-app support. Check back shortly.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <Placeholder
          icon={Construction}
          title="Knowledge base"
          description="Step-by-step guides covering projects, tasks, and team workflows."
          accent="from-theme-1 to-theme-3"
        />
        <Placeholder
          icon={LifeBuoy}
          title="Live support"
          description="Reach a real human directly from the dashboard when you&apos;re stuck."
          accent="from-sky-400 to-blue-600"
        />
      </section>

      <div className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-sm font-semibold">
            Need help right now?
          </h2>
          <p className="text-xs text-muted-foreground">
            Email us and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
        <a
          href="mailto:info@webspidersolutions.com"
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-br from-theme-1 to-theme-3 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-theme-3/20 ring-1 ring-white/20 transition-transform hover:-translate-y-0.5"
        >
          <Mail className="size-3.5" />
          info@webspidersolutions.com
        </a>
      </div>
    </div>
  );
}

function Placeholder({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-theme-3/10">
      <div
        aria-hidden
        className={`absolute -top-12 -right-12 size-32 rounded-full bg-linear-to-br ${accent} opacity-15 blur-2xl transition-opacity group-hover:opacity-25`}
      />
      <div className="relative flex flex-col gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-md shadow-black/10 ring-1 ring-white/20`}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
