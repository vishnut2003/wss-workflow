"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Calendar,
  Users,
  Building2,
  BarChart3,
  Activity,
  Bell,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Projects", href: "/dashboard/projects", icon: FolderKanban, badge: "12" },
      { title: "Tasks", href: "/dashboard/tasks", icon: ListTodo, badge: "4" },
      { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { title: "Activity", href: "/dashboard/activity", icon: Activity },
      { title: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: "3" },
    ],
  },
  {
    label: "Team",
    items: [
      { title: "Members", href: "/dashboard/members", icon: Users },
      { title: "Clients", href: "/dashboard/clients", icon: Building2 },
    ],
  },
];

const footerItems: NavItem[] = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-theme-1 to-theme-3 text-sm font-bold tracking-tight text-white shadow-md shadow-theme-2/30 ring-1 ring-white/20">
            WS
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm leading-tight font-semibold">
              Workflow
            </span>
            <span className="truncate text-[11px] leading-tight text-muted-foreground">
              Web Spider Solutions
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute top-1.5 bottom-1.5 -left-1 w-1 rounded-r-full bg-linear-to-b from-theme-1 to-theme-3 shadow-sm shadow-theme-2/50 group-data-[collapsible=icon]:hidden"
                        />
                      ) : null}
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={
                          active
                            ? "bg-linear-to-r from-theme-1/15 to-theme-3/5 font-medium text-foreground ring-1 ring-theme-1/20 hover:bg-linear-to-r hover:from-theme-1/20 hover:to-theme-3/10"
                            : "text-muted-foreground hover:text-foreground"
                        }
                        render={
                          <Link href={item.href}>
                            <Icon
                              className={
                                active ? "text-theme-2" : "text-muted-foreground"
                              }
                            />
                            <span>{item.title}</span>
                            {item.badge ? (
                              <SidebarMenuBadge
                                className={
                                  active
                                    ? "bg-theme-1/20 text-theme-3"
                                    : "bg-muted text-muted-foreground"
                                }
                              >
                                {item.badge}
                              </SidebarMenuBadge>
                            ) : null}
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {footerItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? "bg-linear-to-r from-theme-1/15 to-theme-3/5 font-medium text-foreground ring-1 ring-theme-1/20"
                          : "text-muted-foreground hover:text-foreground"
                      }
                      render={
                        <Link href={item.href}>
                          <Icon
                            className={
                              active ? "text-theme-2" : "text-muted-foreground"
                            }
                          />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3 group-data-[collapsible=icon]:hidden">
        <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-theme-1 to-theme-3 p-3 text-white shadow-md shadow-theme-2/20">
          <div
            aria-hidden
            className="absolute -top-6 -right-6 size-20 rounded-full bg-white/20 blur-2xl"
          />
          <div className="relative flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold">Upgrade to Pro</p>
              <p className="text-[11px] leading-snug text-white/85">
                Unlock automations and advanced analytics.
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
