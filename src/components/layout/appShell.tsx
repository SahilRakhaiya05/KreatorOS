"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { creator, nav } from "@/shared/mock/data";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Role = "creator" | "brand" | "portal";

const roleMeta: Record<Role, { title: string; subtitle: string }> = {
  creator: { title: "KreatorOS", subtitle: "Creator workspace" },
  brand: { title: "Brand HQ", subtitle: "Partnerships workspace" },
  portal: { title: "Client Portal", subtitle: "Member workspace" },
};

const STORAGE_KEY = "kreatoros.sidebar.collapsed";

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof Settings;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-accent" : "group-hover:text-foreground")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarNav({
  role,
  collapsed,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = nav[role];
  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.group} className="flex flex-col gap-0.5">
          {!collapsed ? (
            <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {group.group}
            </p>
          ) : (
            <div className="mx-auto my-1 h-px w-6 bg-border" />
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand({ role, collapsed }: { role: Role; collapsed: boolean }) {
  const meta = roleMeta[role];
  return (
    <Link href={`/${role === "creator" ? "creator" : role}`} className="flex items-center gap-3 px-1">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="h-5 w-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-display text-base font-semibold tracking-tight">{meta.title}</p>
          <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
        </div>
      )}
    </Link>
  );
}

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen w-full">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "sticky top-0 hidden h-screen shrink-0 flex-col gap-5 border-r border-sidebar-border bg-sidebar px-3 py-5 transition-[width] duration-200 lg:flex",
              collapsed ? "w-[4.5rem]" : "w-64"
            )}
          >
            <Brand role={role} collapsed={collapsed} />
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
              <SidebarNav role={role} collapsed={collapsed} />
            </div>
            <div className="flex flex-col gap-1">
              <NavLink
                href={`/${role}/settings`}
                label="Settings"
                icon={Settings}
                collapsed={collapsed}
                active={false}
              />
              <button
                onClick={toggle}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
                {!collapsed && <span>Collapse</span>}
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
              <div className="flex h-16 items-center gap-3 px-4 md:px-6">
                {/* Mobile menu */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-sidebar p-4">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <div className="mb-6">
                      <Brand role={role} collapsed={false} />
                    </div>
                    <SidebarNav role={role} collapsed={false} />
                  </SheetContent>
                </Sheet>

                <div className="relative hidden max-w-md flex-1 md:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-9 w-full rounded-lg border border-input bg-secondary/60 pl-9 pr-12 text-sm outline-none transition focus:border-ring focus:bg-background"
                    placeholder="Search anything..."
                  />
                  <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[0.65rem] text-muted-foreground sm:flex">
                    ⌘K
                  </kbd>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
                    <Link href="/u/aarav">Live page</Link>
                  </Button>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-[18px] w-[18px]" />
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left transition hover:bg-secondary">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary text-primary-foreground">AC</AvatarFallback>
                        </Avatar>
                        <div className="hidden leading-tight sm:block">
                          <p className="text-sm font-semibold">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">{creator.handle}</p>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile/settings"><UserRound className="h-4 w-4" /> Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${role}/settings`}><Settings className="h-4 w-4" /> Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <form action={logoutAction} className="w-full">
                          <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                            <LogOut className="h-4 w-4" /> Log out
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-7xl animate-fade-up">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <Badge variant="accent" className="mb-1">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
