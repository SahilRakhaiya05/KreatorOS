import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const segments = [
  "AI productivity mentors",
  "Student creators",
  "B2B SaaS educators",
  "YouTube explainers",
  "Newsletter operators",
  "Community builders",
];

export default function BrandDiscover() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Creator discovery"
        title="Find creators by audience fit, offer type, and conversion data"
        description="Discovery should be private and quality-scored, not a noisy marketplace. AI ranks creators using niche, audience, engagement, past campaign data, and deliverable reliability."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {segments.map((x, i) => (
          <Card key={x} className="transition hover:shadow-soft">
            <CardHeader className="space-y-0 pb-2">
              <Badge variant={i % 2 ? "success" : "accent"} className="w-fit">Match {92 - i * 4}%</Badge>
              <CardTitle className="pt-3 text-lg">{x}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Audience match, conversion history, safe content, available campaign slots.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
