import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { products } from "@/shared/mock/data";
import { ShoppingBag, Sparkles, Plus } from "lucide-react";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Store studio"
        title="Products, bundles, courses, and automated delivery"
        description="Each product can trigger fulfillment, customer tagging, review requests, upsells, memberships, and support workflows."
        action={
          <Button>
            <Plus className="h-4 w-4" /> New product
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {products.map((p) => (
          <Card key={p.name} className="transition hover:shadow-soft">
            <CardContent className="p-5">
              <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-secondary">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <Badge variant={p.status === "Live" ? "success" : "warning"}>{p.status}</Badge>
              <h2 className="mt-4 font-semibold tracking-tight">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.type}</p>
              <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{p.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-mono">{p.sales}</span> sales · <span className="font-mono">{p.revenue}</span>
              </p>
              <div className="mt-4 flex gap-2 rounded-lg bg-accent/10 p-3 text-xs leading-5 text-accent">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{p.automation}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
