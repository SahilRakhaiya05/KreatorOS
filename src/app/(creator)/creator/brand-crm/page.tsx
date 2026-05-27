import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brandDeals } from "@/shared/mock/data";
import { FileText, MessageCircle, Sparkles } from "lucide-react";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Brand CRM"
        title="Media kits, leads, proposals, and deliverables"
        description="A brand-business workflow: AI rate card, proposal builder, collaboration room, campaign short links, invoice/payment status, and deliverable tracking."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle>Deal pipeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {brandDeals.map((d) => (
                <div key={d.brand} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{d.brand}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.stage} · <span className="font-mono">{d.value}</span> · due {d.due}
                    </p>
                  </div>
                  <Badge
                    variant={
                      d.stage.includes("Negotiating") ? "accent" : d.stage.includes("Proposal") ? "secondary" : "warning"
                    }
                    className="shrink-0"
                  >
                    {d.risk}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI brand agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 p-4">
              <MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-sm font-medium">Draft reply to ClipSpark</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 p-4">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-sm font-medium">Generate proposal + usage rights</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-accent/10 p-4 text-accent">
              <Sparkles className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">Suggest higher package because brand budget is above average.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
