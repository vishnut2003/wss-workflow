"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];

export function PreferencesForm() {
  return (
    <div className="flex flex-col divide-y divide-border/60">
      <PreferenceRow
        icon={Palette}
        title="Theme"
        description="Choose how Workflow looks. System matches your device setting."
      >
        <ThemeSelector />
      </PreferenceRow>
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/20 to-theme-3/10 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:ml-auto">{children}</div>
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current: ThemeOption = (mounted && (theme as ThemeOption)) || "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
    >
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
