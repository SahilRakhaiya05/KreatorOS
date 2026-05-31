"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { nav } from "@/components/layout/navConfig";
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
  creator: { title: "KreatorOS", subtitle: "Creator dashboard" },
  brand: { title: "Brand HQ", subtitle: "Partnerships dashboard" },
  portal: { title: "Client Portal", subtitle: "Member dashboard" },
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
  const isActiveRoute = (href: string) =>
    pathname === href || (href === "/creator/link" && pathname.startsWith("/creator/link"));

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
              active={isActiveRoute(item.href)}
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
      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-background border border-border shadow-sm">
        <img src="/logo.png" alt="KreatorOS Logo" className="h-full w-full object-cover" />
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
  const [account, setAccount] = useState({
    name: "Loading account",
    handle: "Authenticated account",
    initials: "KO",
  });
  const [livePageHref, setLivePageHref] = useState("/creator/builder");

  interface Notification {
    id: string;
    channel: "dashboard" | "email" | "whatsapp";
    subject?: string;
    body?: string;
    created_at: string;
    metadata?: {
      read_at?: string;
      [key: string]: any;
    };
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json?.ok && json.data?.notifications) {
        const list = json.data.notifications;
        setNotifications(list);
        const unread = list.filter((n: Notification) => !n.metadata || !n.metadata.read_at).length;
        setUnreadCount(unread);
      }
    } catch {
      /* ignore fetch failures */
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAllAsRead() {
    const updated = notifications.map(n => ({
      ...n,
      metadata: { ...n.metadata, read_at: new Date().toISOString() }
    }));
    setNotifications(updated);
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      fetchNotifications();
    } catch {
      /* ignore */
    }
  }

  async function markAsRead(notificationId: string) {
    const updated = notifications.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          metadata: { ...n.metadata, read_at: new Date().toISOString() }
        };
      }
      return n;
    });
    setNotifications(updated);
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      });
      fetchNotifications();
    } catch {
      /* ignore */
    }
  }

  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!json?.ok || cancelled) return;

        const profile = json.data.profile;
        const email = json.data.user?.email ?? profile?.email ?? "";
        const name = profile?.full_name || email.split("@")[0] || "KreatorOS user";
        const handle = profile?.account_type ? `${profile.account_type} account` : email;
        const initials = name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0]?.toUpperCase())
          .join("") || "KO";

        setAccount({ name, handle, initials });
      } catch {
        /* keep demo fallback only when user context cannot load */
      }
    }

    loadCurrentUser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (role !== "creator") return;
    let cancelled = false;

    async function loadCreatorPage() {
      try {
        const res = await fetch("/api/pages");
        const json = await res.json();
        const slug = json?.data?.pages?.[0]?.slug;
        if (!cancelled && slug) setLivePageHref(`/u/${slug}`);
      } catch {
        /* builder link remains */
      }
    }

    loadCreatorPage();
    return () => {
      cancelled = true;
    };
  }, [role]);

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
            <div className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden pr-1">
              <SidebarNav role={role} collapsed={collapsed} />
            </div>
            <div className="flex flex-col gap-1">
              <NavLink
                href={role === "creator" ? "/creator/link/settings" : `/${role}/settings`}
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

                <div className="ml-auto flex items-center gap-2">
                  {role === "creator" && (
                    <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
                      <Link href={livePageHref}>Live page</Link>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="relative">
                        <Bell className="h-[18px] w-[18px]" />
                        {unreadCount > 0 && (
                          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[360px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border/85 shadow-2xl rounded-xl z-50">
                      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/20">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Notifications</span>
                          {unreadCount > 0 && (
                            <Badge variant="accent" className="px-1.5 py-0.5 text-[10px] font-bold">
                              {unreadCount} new
                            </Badge>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-accent hover:text-accent/80 transition-colors font-medium flex items-center gap-1"
                          >
                            <CheckCheck className="h-3 w-3" />
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center mb-3">
                              <Bell className="h-5 w-5 text-muted-foreground/60" />
                            </div>
                            <p className="text-sm font-medium text-foreground">All caught up!</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                              You don't have any notifications right now.
                            </p>
                          </div>
                        ) : (
                          notifications.map((item) => {
                            const isUnread = !item.metadata || !item.metadata.read_at;
                            return (
                              <div
                                key={item.id}
                                onClick={() => isUnread && markAsRead(item.id)}
                                className={cn(
                                  "group relative flex items-start gap-3 p-4 text-left transition-all duration-200 cursor-pointer select-none",
                                  isUnread
                                    ? "bg-accent/5 hover:bg-accent/10"
                                    : "hover:bg-secondary/40"
                                )}
                              >
                                {isUnread && (
                                  <span className="absolute left-2 top-[22px] h-1.5 w-1.5 rounded-full bg-accent" />
                                )}

                                <div className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm shadow-sm",
                                  isUnread
                                    ? "bg-accent/10 border-accent/20 text-accent"
                                    : "bg-muted/40 border-border/50 text-muted-foreground"
                                )}>
                                  {item.channel === "email" ? (
                                    <Mail className="h-4 w-4" />
                                  ) : item.channel === "whatsapp" ? (
                                    <MessageSquare className="h-4 w-4" />
                                  ) : (
                                    <Bell className="h-4 w-4" />
                                  )}
                                </div>

                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                      "text-xs font-semibold truncate",
                                      isUnread ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {item.subject || "System Notification"}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                      {formatRelativeTime(item.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {item.body}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left transition hover:bg-secondary">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary text-primary-foreground">{account.initials}</AvatarFallback>
                        </Avatar>
                        <div className="hidden leading-tight sm:block">
                          <p className="text-sm font-semibold">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.handle}</p>
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
                        <Link href={role === "creator" ? "/creator/link/settings" : `/${role}/settings`}><Settings className="h-4 w-4" /> Settings</Link>
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
