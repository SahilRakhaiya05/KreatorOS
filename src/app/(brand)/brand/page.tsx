import Link from "next/link";
import { ArrowUpRight, Briefcase, DollarSign, Users, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/profile/profileService";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export default async function BrandHQ() {
  const { user } = await requireUser();
  const workspace = await getActiveWorkspace(user.id);
  const supabase = await createSupabaseServerClient();

  // Get all workspace IDs the brand user is a member of
  const { data: memberWorkspaces } = workspace
    ? await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
    : { data: null };

  const workspaceIds = memberWorkspaces?.map((mw) => mw.workspace_id) || [];

  // Query all deals in workspaces where user is a member
  const { data: dbDeals } = workspaceIds.length > 0
    ? await supabase
        .from("brand_deals")
        .select("*")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: false })
    : { data: null };

  const deals = dbDeals || [];

  // Calculate metrics
  const activeCampaigns = deals.filter((d) => !["lost", "paid"].includes(d.status)).length;
  
  const committedCents = deals
    .filter((d) => ["approved", "delivered", "paid"].includes(d.status))
    .reduce((sum, d) => sum + (d.rate_cents || 0), 0);
  const committedSpend = `$${(committedCents / 100 / 1000).toFixed(1)}k`;

  const uniqueCreators = new Set(deals.map((d) => d.workspace_id)).size;

  const pendingApprovals = deals.filter((d) => d.status === "delivered").length;

  const metrics = [
    { label: "Active campaigns", value: String(activeCampaigns), change: "+2", icon: Briefcase },
    { label: "Committed spend", value: committedSpend, change: "+12%", icon: DollarSign },
    { label: "Creators Partnered", value: String(uniqueCreators), change: "+1", icon: Users },
    { label: "Pending approvals", value: String(pendingApprovals), change: "Due now", icon: Clock },
  ];

  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Brand HQ"
        title="Plan, book, pay, and manage creator campaigns"
        description="Brands get their own portal: creator discovery, campaign briefs, collaboration rooms, deliverable approvals, escrow/payment, and performance reports."
        action={
          <Button asChild>
            <Link href="/brand/discover">Find Creators <ArrowUpRight className="h-4 w-4" /></Link>
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
          <Badge variant="secondary">{deals.length} deals</Badge>
        </CardHeader>
        <CardContent className="pt-0">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <p className="text-sm font-semibold">No active sponsorships yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to the Discover tab to search creators and start a direct chat!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {deals.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{d.brand_name} Sponsorship</p>
                    <p className="text-sm text-muted-foreground">
                      Stage: <span className="capitalize font-bold text-primary">{d.status}</span> ·{" "}
                      <span className="font-mono">${(d.rate_cents / 100).toFixed(2)}</span>
                      {d.due_date ? ` · Due ${new Date(d.due_date).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/brand/collab-room">Open room <ArrowUpRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
