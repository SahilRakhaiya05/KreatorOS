import Link from "next/link";
import { ArrowUpRight, Briefcase, DollarSign, Users, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brandDeals } from "@/shared/mock/data";

const metrics = [
  { label: "Active campaigns", value: "12", change: "+4", icon: Briefcase },
  { label: "Committed spend", value: "$48k", change: "+18%", icon: DollarSign },
  { label: "Creators", value: "36", change: "+9", icon: Users },
  { label: "Pending approvals", value: "7", change: "Due now", icon: Clock },
];

export default function BrandHQ() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Brand HQ"
        title="Plan, book, pay, and manage creator campaigns"
        description="Brands get their own portal: creator discovery, campaign briefs, collaboration rooms, deliverable approvals, escrow/payment, and performance reports."
        action={
          <Button asChild>
            <Link href="/brand/campaigns">New campaign <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <Badge variant="success">{m.change}</Badge>
                </div>
                <p className="mt-4 font-mono text-3xl font-semibold tracking-tight">{m.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Campaign pipeline</CardTitle>
          <Badge variant="secondary">{brandDeals.length} deals</Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {brandDeals.map((d) => (
              <div key={d.brand} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{d.creator} × {d.brand}</p>
                  <p className="text-sm text-muted-foreground">{d.stage} · <span className="font-mono">{d.value}</span> · {d.risk}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/brand/collab-room">Open room <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
