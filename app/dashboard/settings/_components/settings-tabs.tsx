"use client";

import { useMemo, useState } from "react";
import { Lock, ShieldOff, SlidersHorizontal, User } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountForm } from "./account-form";
import { PreferencesForm } from "./preferences-form";
import { SecurityForm } from "./security-form";

export type SettingsTabId = "account" | "security" | "preferences";

export type SettingsTabsProps = {
  initialProfile: { name: string; email: string };
  isSuperAdmin: boolean;
};

type TabConfig = {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Hide this tab entirely for some role. */
  hideFor?: { isSuperAdmin?: boolean };
  /** Show the tab but lock the panel for some role. */
  lockedFor?: { isSuperAdmin?: boolean };
  render: (props: SettingsTabsProps) => React.ReactNode;
};

const TABS: TabConfig[] = [
  {
    id: "account",
    label: "Account",
    description: "Update the name and email associated with your account.",
    icon: User,
    lockedFor: { isSuperAdmin: true },
    render: ({ initialProfile }) => <AccountForm initial={initialProfile} />,
  },
  {
    id: "security",
    label: "Security",
    description: "Change your password to keep your account safe.",
    icon: Lock,
    lockedFor: { isSuperAdmin: true },
    render: () => <SecurityForm />,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Personalise the look and feel of Workflow.",
    icon: SlidersHorizontal,
    render: () => <PreferencesForm />,
  },
];

function isLocked(tab: TabConfig, isSuperAdmin: boolean) {
  return Boolean(tab.lockedFor?.isSuperAdmin && isSuperAdmin);
}

function isHidden(tab: TabConfig, isSuperAdmin: boolean) {
  return Boolean(tab.hideFor?.isSuperAdmin && isSuperAdmin);
}

export function SettingsTabs(props: SettingsTabsProps) {
  const visibleTabs = useMemo(
    () => TABS.filter((t) => !isHidden(t, props.isSuperAdmin)),
    [props.isSuperAdmin]
  );

  const firstUnlocked = useMemo(
    () =>
      visibleTabs.find((t) => !isLocked(t, props.isSuperAdmin))?.id ??
      visibleTabs[0]?.id ??
      "preferences",
    [visibleTabs, props.isSuperAdmin]
  );

  const [active, setActive] = useState<SettingsTabId>(firstUnlocked);

  return (
    <Tabs
      value={active}
      onValueChange={(v) => setActive(v as SettingsTabId)}
      className="gap-6"
    >
      <TabsList className="h-auto gap-1 rounded-xl border border-border/60 bg-card p-1 ring-1 ring-foreground/5">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const locked = isLocked(tab, props.isSuperAdmin);
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={locked}
              className="h-9 gap-2 px-3 data-active:bg-linear-to-br data-active:from-theme-1/15 data-active:to-theme-3/5 data-active:text-foreground data-active:ring-1 data-active:ring-theme-1/20"
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {locked ? (
                <ShieldOff className="size-3 text-muted-foreground" aria-hidden />
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {visibleTabs.map((tab) => {
        const locked = isLocked(tab, props.isSuperAdmin);
        return (
          <TabsContent key={tab.id} value={tab.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-semibold">{tab.label}</h2>
              <p className="text-sm text-muted-foreground">{tab.description}</p>
            </div>

            {locked ? (
              <LockedNotice tabLabel={tab.label} />
            ) : (
              <div className="rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5 sm:p-6">
                {tab.render(props)}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function LockedNotice({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm sm:flex-row sm:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-300">
        <ShieldOff className="size-5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-foreground">
          {tabLabel} is unavailable for super admins
        </p>
        <p className="text-xs text-muted-foreground">
          The super admin account is provisioned through environment variables and
          cannot be modified from the dashboard.
        </p>
      </div>
    </div>
  );
}
