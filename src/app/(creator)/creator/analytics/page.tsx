import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { stats, workflowEvents } from "@/shared/mock/data";
import { Activity, TrendingUp } from "lucide-react";

const insights = [
  "Booking clicks are high, checkout is weak. Add proof and a lower-priced intro option.",
  "Brand leads have higher value than product sales. Move brand inquiry above the course block for brand visitors.",
  "Members who attend office hours are 3x less likely to churn. Automate reminders and recap delivery.",
];

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Analytics"
        title="AI explains the business, not only charts"
        description="Track views, clicks, sales, bookings, lead magnets, member churn, brand deal cycle time, provider failures, and workflow ROI."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <Badge variant="success" className="gap-1">
                    <TrendingUp className="h-3 w-3" /> {s.change}
                  </Badge>
                </div>
                <p className="mt-4 font-mono text-3xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>AI insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {insights.map((x) => (
              <div key={x} className="rounded-xl border border-border bg-accent/10 p-4">
                <Badge variant="accent">Recommended action</Badge>
                <p className="mt-3 text-sm leading-6 text-foreground">{x}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Event spine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {workflowEvents.map((event) => (
              <div key={event.type} className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="font-mono text-xs text-muted-foreground">{event.type}</p>
                <p className="mt-2 text-sm font-semibold">{event.source}</p>
                <Badge variant="outline" className="mt-3">{event.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
