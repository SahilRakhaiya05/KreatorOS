import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  "Team roles",
  "Billing + escrow",
  "Approval policy",
  "Brand safety rules",
  "Creator shortlist",
  "Webhook integrations",
];

export default function BrandSettings() {
  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Brand settings"
        title="Brand profile, billing, team roles, approvals, and campaign defaults"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((x) => (
          <Card key={x} className="transition hover:shadow-soft">
            <CardHeader className="space-y-0 pb-2">
              <Badge variant="secondary" className="w-fit">Config</Badge>
              <CardTitle className="pt-3 text-lg">{x}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure workspace-level defaults and permissions.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
