import Link from "next/link";
import { ArrowUpRight, Calendar, Check, CreditCard, Handshake, MessageSquare, TrendingUp, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/server/profile/profileService";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

import { ApprovalQueueDashboard } from "@/features/agents/components/approvalQueueDashboard";

export default async function CreatorCommand() {
  const { user, profile } = await requireUser();
  const workspace = await getActiveWorkspace(user.id);
  const displayName = profile?.full_name || user.email?.split("@")[0] || "creator";
  const supabase = await createSupabaseServerClient();
  
  const { data: offers } = workspace
    ? await supabase
        .from("offers")
        .select("id,title,type,price_cents,currency,status,created_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const workspaceOffers = offers ?? [];
  const productOffers = workspaceOffers.filter((offer) => offer.type === "product" || offer.type === "course" || offer.type === "membership");
  const bookingOffers = workspaceOffers.filter((offer) => offer.type === "booking" || offer.type === "service");

  // 1. Calculate Real Revenue
  const { data: paidOrders } = workspace
    ? await supabase
        .from("orders")
        .select("amount_cents")
        .eq("workspace_id", workspace.id)
        .eq("status", "paid")
    : { data: [] };
  const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + o.amount_cents, 0) / 100;

  // 2. Customer count
  const { count: customerCount } = workspace
    ? await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
    : { count: 0 };

  // 3. Brand campaigns pipeline budget
  const { data: campaigns } = workspace
    ? await supabase
        .from("brand_campaigns")
        .select("budget_cents")
        .eq("brand_workspace_id", workspace.id)
    : { data: [] };
  const brandPipeline = (campaigns || []).reduce((sum, c) => sum + (c.budget_cents || 0), 0) / 100;

  // 4. Pending AI suggestions
  const { data: dbSuggestions } = workspace
    ? await supabase
        .from("ai_suggestions")
        .select("id, title, risk_level, status")
        .eq("workspace_id", workspace.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };
  const pendingSuggestions = dbSuggestions || [];

  const dashboardStats = [
    {
      label: "Revenue",
      value: new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalRevenue),
      change: "real-time",
      icon: CreditCard
    },
    { label: "Booking offers", value: String(bookingOffers.length), change: "workspace", icon: Calendar },
    { label: "Customers", value: String(customerCount || 0), change: "contacts", icon: Users },
    {
      label: "Brand pipeline",
      value: new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(brandPipeline),
      change: "collabs",
      icon: Handshake
    },
  ];

  const isMissingServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Command center"
        title={`Welcome back, ${displayName}`}
        description={`${workspace?.type ?? "Creator"} workspace data is scoped to your authenticated account.`}
        action={
          <Button asChild>
            <Link href="/creator/chat"><MessageSquare className="h-4 w-4" /> Ask the operator</Link>
          </Button>
        }
      />

      {isMissingServiceKey && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="font-semibold text-amber-500">Action Required: Missing SUPABASE_SERVICE_ROLE_KEY</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Your environment is missing the <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> in your <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">.env.local</code>. This key is required to initialize, heal, and manage workspace memberships correctly. Please obtain the service_role key from your Supabase Dashboard settings, add it to your environment, and restart your server.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((s) => {
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Approval queue */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Approval queue</CardTitle>
            <Badge variant="warning">{pendingSuggestions.length} waiting</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <ApprovalQueueDashboard initialSuggestions={pendingSuggestions} />
          </CardContent>
        </Card>

        {/* Operator snapshot */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-300" /> AI Operator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Add a $19 intro audit and route brands to a free discovery call. Both are likely to convert better than one generic CTA.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Offers", value: workspaceOffers.length },
                { label: "Bookings", value: bookingOffers.length },
                { label: "Products", value: productOffers.length },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-white/10 p-3">
                  <p className="font-mono text-xl font-semibold">{m.value}</p>
                  <p className="text-xs text-primary-foreground/70">{m.label}</p>
                </div>
              ))}
            </div>
            <Separator className="bg-white/15" />
            <Button asChild variant="accent" className="w-full">
              <Link href="/creator/chat">Open AI chat <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Products table */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Your offers</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/creator/store">View store <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Sales</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workspaceOffers.length ? workspaceOffers.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-medium">{p.title}</td>
                    <td className="py-3 text-muted-foreground">{p.type}</td>
                    <td className="py-3 text-right font-mono">
                      {new Intl.NumberFormat("en", {
                        style: "currency",
                        currency: String(p.currency).toUpperCase(),
                        maximumFractionDigits: 0,
                      }).format(Number(p.price_cents) / 100)}
                    </td>
                    <td className="py-3 text-right font-mono">0</td>
                    <td className="py-3 text-right font-mono">$0</td>
                    <td className="py-3 text-right">
                      <Badge variant={p.status === "published" ? "success" : "secondary"}>{p.status}</Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="py-6 text-sm text-muted-foreground" colSpan={6}>
                      No offers yet for this workspace. Create one from Store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
