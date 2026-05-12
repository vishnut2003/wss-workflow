"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Inbox,
  Loader2,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Role } from "@/lib/auth/roles";
import {
  CAPABILITIES,
  CATEGORY_META,
  type CapabilityCategory,
  defaultFor,
} from "@/lib/permissions/registry";
import type { PermissionOverrides } from "@/lib/models/permission";

import {
  resetPermissionsAction,
  toggleCapabilityAction,
} from "../actions";

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

const ROLE_ACCENT: Record<Role, string> = {
  super_admin: "from-amber-400 to-orange-500",
  admin: "from-theme-1 to-theme-3",
  manager: "from-violet-400 to-fuchsia-500",
  member: "from-sky-400 to-blue-600",
};

const CATEGORY_ICON: Record<
  CapabilityCategory,
  React.ComponentType<{ className?: string }>
> = {
  pages: FileText,
  clients: Building2,
  projects: FolderKanban,
  members: Users,
  feedback: Inbox,
};

type CellState = {
  effective: boolean;
  isOverride: boolean;
};

function cellStateFrom(
  overrides: PermissionOverrides,
  role: Role,
  capabilityId: string
): CellState {
  const explicit = overrides[role]?.[capabilityId];
  if (typeof explicit === "boolean") {
    return { effective: explicit, isOverride: true };
  }
  return { effective: defaultFor(capabilityId, role), isOverride: false };
}

export function PermissionsEditor({
  roles,
  initialOverrides,
}: {
  roles: Role[];
  initialOverrides: PermissionOverrides;
}) {
  const [overrides, setOverrides] =
    useState<PermissionOverrides>(initialOverrides);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categories = useMemo(() => {
    const map = new Map<CapabilityCategory, typeof CAPABILITIES>();
    for (const c of CAPABILITIES) {
      if (!map.has(c.category)) map.set(c.category, []);
      map.get(c.category)!.push(c);
    }
    return Array.from(map.entries()) as Array<
      [CapabilityCategory, typeof CAPABILITIES]
    >;
  }, []);

  const overrideCount = useMemo(() => {
    let n = 0;
    for (const role of Object.keys(overrides) as Role[]) {
      const map = overrides[role] ?? {};
      for (const k of Object.keys(map)) {
        if (typeof map[k] === "boolean") n += 1;
      }
    }
    return n;
  }, [overrides]);

  const handleToggle = (role: Role, capabilityId: string, next: boolean) => {
    const key = `${role}:${capabilityId}`;
    setPendingKey(key);
    setError(null);
    setSuccess(null);

    const previous = overrides;
    setOverrides((prev) => ({
      ...prev,
      [role]: { ...(prev[role] ?? {}), [capabilityId]: next },
    }));

    startTransition(async () => {
      const result = await toggleCapabilityAction({
        role,
        capabilityId,
        value: next ? "true" : "false",
      });
      setPendingKey(null);
      if (result.error) {
        setOverrides(previous);
        setError(result.error);
        return;
      }
      if (result.overrides) setOverrides(result.overrides);
      setSuccess(
        `${ROLE_LABEL[role]} · ${next ? "granted" : "revoked"}`
      );
    });
  };

  const handleResetCell = (role: Role, capabilityId: string) => {
    const key = `${role}:${capabilityId}`;
    setPendingKey(key);
    setError(null);
    setSuccess(null);

    const previous = overrides;
    setOverrides((prev) => {
      const next: PermissionOverrides = { ...prev };
      if (next[role]) {
        const inner = { ...next[role] };
        delete inner[capabilityId];
        next[role] = inner;
      }
      return next;
    });

    startTransition(async () => {
      const result = await toggleCapabilityAction({
        role,
        capabilityId,
        value: "default",
      });
      setPendingKey(null);
      if (result.error) {
        setOverrides(previous);
        setError(result.error);
        return;
      }
      if (result.overrides) setOverrides(result.overrides);
      setSuccess(`${ROLE_LABEL[role]} · reset to default`);
    });
  };

  const handleResetAll = () => {
    if (overrideCount === 0) return;
    const ok = window.confirm(
      `Reset all ${overrideCount} custom override${overrideCount === 1 ? "" : "s"} back to defaults?`
    );
    if (!ok) return;

    setPendingKey("__reset_all__");
    setError(null);
    setSuccess(null);
    const previous = overrides;
    setOverrides({});

    startTransition(async () => {
      const result = await resetPermissionsAction();
      setPendingKey(null);
      if (result.error) {
        setOverrides(previous);
        setError(result.error);
        return;
      }
      setOverrides(result.overrides ?? {});
      setSuccess("All overrides reset to defaults.");
    });
  };

  const [activeCategory, setActiveCategory] = useState<CapabilityCategory>(
    categories[0]?.[0] ?? "pages"
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-theme-3 dark:text-theme-1" />
          <span>
            {overrideCount === 0
              ? "Everything is at its default."
              : `${overrideCount} custom override${overrideCount === 1 ? "" : "s"} in effect.`}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={overrideCount === 0 || pendingKey === "__reset_all__"}
          onClick={handleResetAll}
          className="h-8 gap-1.5"
        >
          {pendingKey === "__reset_all__" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          Reset all to defaults
        </Button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          <span>Saved · {success}</span>
        </div>
      ) : null}

      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as CapabilityCategory)}
        className="gap-5"
      >
        <TabsList className="h-auto w-fit self-start gap-1 rounded-xl border border-border/60 bg-card p-1 ring-1 ring-foreground/5">
          {categories.map(([cat]) => {
            const Icon = CATEGORY_ICON[cat];
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="h-9 flex-none gap-2 px-3 data-active:bg-linear-to-br data-active:from-theme-1/15 data-active:to-theme-3/5 data-active:text-foreground data-active:ring-1 data-active:ring-theme-1/20"
              >
                <Icon className="size-4" />
                <span>{CATEGORY_META[cat].label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(([cat, caps]) => (
          <TabsContent key={cat} value={cat} className="flex flex-col gap-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span>{CATEGORY_META[cat].description}</span>
            </div>

            <CapabilityTable
              roles={roles}
              capabilities={caps}
              overrides={overrides}
              pendingKey={pendingKey}
              onToggle={handleToggle}
              onResetCell={handleResetCell}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function CapabilityTable({
  roles,
  capabilities,
  overrides,
  pendingKey,
  onToggle,
  onResetCell,
}: {
  roles: Role[];
  capabilities: typeof CAPABILITIES;
  overrides: PermissionOverrides;
  pendingKey: string | null;
  onToggle: (role: Role, capabilityId: string, next: boolean) => void;
  onResetCell: (role: Role, capabilityId: string) => void;
}) {
  const columns: Role[] = [...roles, "super_admin"];

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card ring-1 ring-foreground/5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th
                scope="col"
                className="px-5 py-3 text-left text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
              >
                Capability
              </th>
              {columns.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className="px-3 py-3 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={`inline-block size-2 rounded-full bg-linear-to-br ${ROLE_ACCENT[role]}`}
                    />
                    {ROLE_LABEL[role]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {capabilities.map((cap) => (
              <tr
                key={cap.id}
                className="group transition-colors hover:bg-muted/20"
              >
                <th
                  scope="row"
                  className="px-5 py-3 text-left align-top font-normal"
                >
                  <div className="flex max-w-md flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {cap.label}
                    </span>
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {cap.description}
                    </span>
                    <span className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                      {cap.id}
                    </span>
                  </div>
                </th>
                {columns.map((role) => {
                  if (role === "super_admin") {
                    return (
                      <td
                        key={role}
                        className="px-3 py-3 text-center align-middle"
                      >
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300"
                          title="Super admin always has full access"
                        >
                          <Lock className="size-2.5" />
                          Always
                        </span>
                      </td>
                    );
                  }
                  const state = cellStateFrom(overrides, role, cap.id);
                  const key = `${role}:${cap.id}`;
                  const isPending = pendingKey === key;
                  return (
                    <td
                      key={role}
                      className="px-3 py-3 text-center align-middle"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative">
                          <Switch
                            checked={state.effective}
                            disabled={isPending}
                            onCheckedChange={(next) =>
                              onToggle(role, cap.id, Boolean(next))
                            }
                            aria-label={`${ROLE_LABEL[role]} can ${cap.label}`}
                          />
                          {isPending ? (
                            <Loader2 className="absolute -top-1 -right-3 size-3 animate-spin text-muted-foreground" />
                          ) : null}
                        </div>
                        {state.isOverride ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onResetCell(role, cap.id)}
                            title="Reset to default"
                            className="inline-flex items-center gap-1 rounded-full bg-theme-1/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-theme-3 ring-1 ring-theme-1/30 transition-colors hover:bg-theme-1/25 disabled:opacity-50 dark:text-theme-1"
                          >
                            <ShieldAlert className="size-2.5" />
                            Custom
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/80">
                            <ShieldCheck className="size-2.5" />
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
