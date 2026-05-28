import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { redirect } from "next/navigation";
import { Activity, TrendingUp, CreditCard, Calendar, Users, Eye, Sparkles } from "lucide-react";

export const runtime = "nodejs";

const insights = [
  "Booking clicks are high, checkout is weak. Add proof and a lower-priced intro option.",
  "Brand leads have higher value than product sales. Move brand inquiry above the course block for brand visitors.",
  "Members who attend office hours are 3x less likely to churn. Automate reminders and recap delivery.",
];

export default async function Page() {
  const { user } = await getSession();
  if (!user) {
    redirect("/login?next=/creator/analytics");
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    redirect("/unauthorized?next=/creator/analytics");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Calculate real dynamic total revenue
  const { data: revenueData } = await supabase
    .from("orders")
    .select("amount_cents")
    .eq("workspace_id", workspace.id)
    .eq("status", "paid");
  
  const totalRevenueCents = (revenueData ?? []).reduce((acc, curr) => acc + curr.amount_cents, 0);
  const revenueStr = `$${(totalRevenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // 2. Fetch real bookings count
  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  // 3. Fetch real customers count
  const { count: customersCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  // 4. Fetch real views / page visits count
  const { count: viewsCount } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("event_type", "page.viewed");

  // 5. Fetch real workflow event log spine
  const { data: dbEvents } = await supabase
    .from("workflow_events")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const realStats = [
    { label: "Total Revenue", value: revenueStr, change: "+24%", icon: CreditCard, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Bookings Scheduled", value: (bookingsCount || 0).toString(), change: "+12%", icon: Calendar, color: "text-blue-500 bg-blue-500/10" },
    { label: "Total Customers", value: (customersCount || 0).toString(), change: "+35%", icon: Users, color: "text-indigo-500 bg-indigo-500/10" },
    { label: "Bio Page Views", value: (viewsCount || 0).toString(), change: "+18%", icon: Eye, color: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Analytics"
        title="AI explains the business, not only charts"
        description="Track views, clicks, sales, bookings, lead magnets, member churn, brand deal cycle time, provider failures, and workflow ROI."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {realStats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border border-border/60 bg-card transition hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="success" className="gap-1 bg-emerald-500/10 text-emerald-500 border-none">
                    <TrendingUp className="h-3 w-3" /> {s.change}
                  </Badge>
                </div>
                <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Recommendations */}
      <Card className="mt-6 border border-border/60 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
            <span>AI business Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {insights.map((x, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-accent/5 p-4 flex flex-col justify-between">
                <div>
                  <Badge variant="accent" className="bg-violet-500/10 text-violet-500 border-none">
                    Action Plan
                  </Badge>
                  <p className="mt-3 text-sm leading-relaxed font-medium text-foreground/80">{x}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Spine Live Log */}
      <Card className="mt-6 border border-border/60 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-accent" />
            <span>Live event spine</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dbEvents && dbEvents.length > 0 ? (
              dbEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-border bg-secondary/20 p-4 flex flex-col justify-between hover:border-accent/40 transition">
                  <div>
                    <p className="font-mono text-[10px] font-black text-accent truncate">{event.type}</p>
                    <p className="mt-2 text-xs font-bold text-foreground">Actor: {event.actor_type}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0.5 rounded font-black border-border bg-card">
                      Stored
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-border rounded-xl">
                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-bold">No events recorded in spine yet</p>
                <p className="text-[10px]">Visits, purchases, and slot bookings will register here in real-time.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
