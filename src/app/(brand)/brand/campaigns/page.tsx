import { Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
  { label: "Campaign goal", value: "Drive signups for AI note-taking app" },
  { label: "Budget", value: "$8,000" },
  { label: "Deliverables", value: "2 reels, 1 newsletter, 1 live demo" },
  { label: "Usage rights", value: "30 days paid usage" },
];

export default function BrandCampaigns() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Campaign builder"
        title="Create briefs that AI can route to the right creators"
        description="Brands define goal, audience, budget, deliverables, dates, usage rights, approval steps, and payout structure. AI then suggests creators and campaign routes."
      />

      <Card>
        <CardHeader>
          <CardTitle>Campaign brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="space-y-2">
                <Label htmlFor={f.label}>{f.label}</Label>
                <Input id={f.label} defaultValue={f.value} />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-secondary p-4">
            <Badge variant="accent" className="gap-1">
              <Sparkles className="h-3 w-3" /> AI suggestion
            </Badge>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Use 4 mid-sized creators instead of 1 large influencer. Predicted lower CAC and more authentic tutorial content.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
