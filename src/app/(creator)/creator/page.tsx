import Link from "next/link";
import { ArrowUpRight, MessageSquare, TrendingUp, Check } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { stats, products, bookings, brandDeals } from "@/shared/mock/data";

const approvals = [
  "Publish $19 async audit offer",
  "Send brand proposal to NotionFlow",
  "Enable WhatsApp reminder template",
  "Run customer research interview batch",
];

export default function CreatorCommand() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Command center"
        title="Welcome back, Aarav"
        description="Revenue, bookings, products, brand deals, and what the AI operator recommends next — all in one place."
        action={
          <Button asChild>
            <Link href="/creator/chat"><MessageSquare className="h-4 w-4" /> Ask the operator</Link>
          </Button>
        }
      />

      {/* Stat cards */}
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Approval queue */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Approval queue</CardTitle>
            <Badge variant="warning">{approvals.length} waiting</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {approvals.map((item) => (
                <div key={item} className="flex items-center justify-between gap-4 py-3.5">
                  <p className="text-sm font-medium">{item}</p>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="ghost">Dismiss</Button>
                    <Button size="sm"><Check className="h-3.5 w-3.5" /> Approve</Button>
                  </div>
                </div>
              ))}
            </div>
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
                { label: "Products", value: products.length },
                { label: "Bookings", value: bookings.length },
                { label: "Brand deals", value: brandDeals.length },
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
          <CardTitle>Top products</CardTitle>
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
                {products.map((p) => (
                  <tr key={p.name}>
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-muted-foreground">{p.type}</td>
                    <td className="py-3 text-right font-mono">{p.price}</td>
                    <td className="py-3 text-right font-mono">{p.sales}</td>
                    <td className="py-3 text-right font-mono">{p.revenue}</td>
                    <td className="py-3 text-right">
                      <Badge variant={p.status === "Live" ? "success" : "secondary"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
