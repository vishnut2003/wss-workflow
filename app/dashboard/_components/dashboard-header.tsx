"use client";

import Link from "next/link";
import { Search, Bell, LogOut, Settings, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  user: {
    name: string;
    email: string;
    role: string;
    initials: string;
    managerName: string | null;
  };
  logoutAction: () => Promise<void>;
};

export function DashboardHeader({ user, logoutAction }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <div className="hidden flex-1 sm:block">
        <InputGroup className="h-9 max-w-md rounded-lg bg-muted/50">
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
          />
        </InputGroup>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="relative"
        >
          <Bell />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-theme-1 ring-2 ring-background" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded-full p-0.5 pr-2.5 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-linear-to-br from-theme-1 to-theme-3 text-[11px] font-semibold text-white">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start leading-tight md:flex">
                  <span className="text-xs font-medium">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {user.role}
                  </span>
                </div>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {user.name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {user.managerName ? (
              <>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs">
                  <UserCog className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Reports to
                    </span>
                    <span className="truncate font-medium text-foreground">
                      {user.managerName}
                    </span>
                  </span>
                </div>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link href="/dashboard/settings">
                  <Settings />
                  Settings
                </Link>
              }
            />

            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              render={
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-1.5">
                    <LogOut />
                    Sign out
                  </button>
                </form>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
