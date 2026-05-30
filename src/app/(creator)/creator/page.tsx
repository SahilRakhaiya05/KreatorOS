import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Eye,
  LineChart,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { requireUser } from "@/server/profile/profileService";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

type AnalyticsEvent = {
  event_type: string;
  visitor_id?: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type OrderRow = {
  amount_cents: number | null;
  status: string | null;
  created_at: string;
};

type BookingRow = {
  id: string;
  status?: string | null;
  start_at?: string | null;
  created_at?: string | null;
};

function money(cents = 0, currency = "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    date.setHours(12, 0, 0, 0);
    return dayKey(date);
  });
}

function eventMatches(event: AnalyticsEvent, terms: string[]) {
  const haystack = `${event.event_type} ${JSON.stringify(event.metadata ?? {})}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export default async function CreatorCommand() {
  const { user, profile } = await requireUser();
  const workspace = await getActiveWorkspace(user.id);
  const displayName = profile?.full_name || user.email?.split("@")[0] || "creator";
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString();

  const empty = { data: [], count: 0 };
  const [ordersResult, analyticsResult, customersResult, bookingsResult, offersResult, suggestionsResult, shortLinksResult] = workspace
    ? await Promise.all([
        supabase
          .from("orders")
          .select("amount_cents,status,created_at")
          .eq("workspace_id", workspace.id)
          .gte("created_at", since)
          .order("created_at", { ascending: true }),
        supabase
          .from("analytics_events")
          .select("event_type,visitor_id,session_id,metadata,created_at")
          .eq("workspace_id", workspace.id)
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .limit(500),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
        supabase
          .from("bookings")
          .select("id,status,start_at,created_at")
          .eq("workspace_id", workspace.id)
          .order("start_at", { ascending: true })
          .limit(20),
        supabase.from("offers").select("id,type,status,price_cents", { count: "exact" }).eq("workspace_id", workspace.id),
        supabase
          .from("ai_suggestions")
          .select("id,title,status,risk_level,created_at")
          .eq("workspace_id", workspace.id)
          .in("status", ["pending", "approved"])
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("short_links").select("id,is_active,click_count", { count: "exact" }).eq("workspace_id", workspace.id),
      ])
    : [empty, empty, { count: 0 }, empty, empty, empty, empty];

  const orders = (ordersResult.data ?? []) as OrderRow[];
  const events = (analyticsResult.data ?? []) as AnalyticsEvent[];
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const offers = offersResult.data ?? [];
  const suggestions = suggestionsResult.data ?? [];
  const shortLinks = shortLinksResult.data ?? [];

  const paidOrders = orders.filter((order) => order.status === "paid");
  const revenueCents = paidOrders.reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0);
  const orderCount = paidOrders.length;
  const visitors = new Set(events.map((event) => event.visitor_id || event.session_id).filter(Boolean)).size;
  const views = events.filter((event) => eventMatches(event, ["view", "page", "visit"])).length || events.length;
  const linkClicks = events.filter((event) => eventMatches(event, ["click", "short_link", "link"])).length + shortLinks.reduce((sum: number, row: any) => sum + Number(row.click_count ?? 0), 0);
  const activeOffers = offers.filter((offer: any) => offer.status === "published").length;
  const bookingCount = bookings.filter((booking) => booking.status !== "cancelled").length;
  const conversionRate = visitors > 0 ? Math.round((orderCount / visitors) * 1000) / 10 : 0;
  const averageOrderCents = orderCount ? Math.round(revenueCents / orderCount) : 0;

  const days = lastDays(14);
  const chart = days.map((date) => {
    const dayOrders = paidOrders.filter((order) => dayKey(new Date(order.created_at)) === date);
    const dayEvents = events.filter((event) => dayKey(new Date(event.created_at)) === date);
    return {
      date,
      revenue: dayOrders.reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0),
      visits: dayEvents.length,
    };
  });
  const maxRevenue = Math.max(...chart.map((item) => item.revenue), 1);
  const maxVisits = Math.max(...chart.map((item) => item.visits), 1);

  const funnel = [
    { label: "Visits", value: Math.max(views, visitors), icon: Eye },
    { label: "Clicks", value: linkClicks, icon: MousePointerClick },
    { label: "Orders", value: orderCount, icon: CreditCard },
    { label: "Bookings", value: bookingCount, icon: CalendarClock },
  ];
  const maxFunnel = Math.max(...funnel.map((item) => item.value), 1);

  const upcoming = bookings
    .filter((booking) => booking.start_at && new Date(booking.start_at) >= new Date())
    .slice(0, 3);

  const insight =
    revenueCents === 0
      ? "Start by driving traffic to one published offer and one booking link."
      : conversionRate < 2
        ? "Traffic is arriving, but the checkout path needs a stronger CTA."
        : "Revenue and conversion are moving. Keep the top offer visible.";

  const kpis = [
    { label: "Revenue", value: money(revenueCents), detail: `${orderCount} paid orders`, icon: CreditCard },
    { label: "Visitors", value: compactNumber(visitors), detail: `${compactNumber(views)} page events`, icon: Users },
    { label: "Conversion", value: `${conversionRate}%`, detail: `${money(averageOrderCents)} average order`, icon: LineChart },
    { label: "Live assets", value: compactNumber(activeOffers + shortLinks.filter((link: any) => link.is_active).length), detail: `${activeOffers} offers · ${shortLinks.length} links`, icon: ShoppingBag },
  ];

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Dashboard"
        title={`Business overview`}
        description={`Revenue, traffic, bookings, and action queue for ${displayName}.`}
        action={
          <Button asChild>
            <Link href="/creator/chat">
              <Bot className="h-4 w-4" /> Ask AI
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-stone-100 text-stone-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary">14 days</Badge>
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Revenue And Traffic</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Daily revenue with traffic volume underneath.</p>
            </div>
            <Badge variant="outline">Live data</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-2 rounded-lg border border-border bg-gradient-to-b from-stone-50 to-white p-4">
              {chart.map((item) => (
                <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-52 w-full items-end justify-center gap-1">
                    <div
                      className="w-full max-w-7 rounded-t-md bg-emerald-600"
                      style={{ height: `${Math.max(6, (item.revenue / maxRevenue) * 100)}%` }}
                      title={`${shortDay(item.date)} revenue ${money(item.revenue)}`}
                    />
                    <div
                      className="w-full max-w-3 rounded-t-md bg-stone-300"
                      style={{ height: `${Math.max(6, (item.visits / maxVisits) * 100)}%` }}
                      title={`${shortDay(item.date)} events ${item.visits}`}
                    />
                  </div>
                  <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">{shortDay(item.date)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Revenue</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-stone-300" /> Events</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-stone-950 text-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300" /> AI Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-white/75">{insight}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Pending", suggestions.length],
                ["Bookings", bookingCount],
                ["Links", shortLinks.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-white/10 p-3">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-xs text-white/60">{label}</p>
                </div>
              ))}
            </div>
            <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
              <Link href="/creator/chat">
                Open AI chat <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <Icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                    </span>
                    <span className="font-mono font-semibold">{compactNumber(item.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(4, (item.value / maxFunnel) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Action Queue</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/creator/chat">
                Manage <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length ? (
              suggestions.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.risk_level} risk · {item.status}</p>
                  </div>
                  <Badge variant={item.status === "approved" ? "success" : "warning"}>{item.status}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">No pending AI actions.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="border-border/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.slice(-6).reverse().length ? (
              events.slice(-6).reverse().map((event, index) => (
                <div key={`${event.created_at}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.event_type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">No analytics events in the last 14 days.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length ? (
              upcoming.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(String(booking.start_at)).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{booking.status || "scheduled"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">No upcoming sessions.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
