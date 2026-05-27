import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PortalMembership() {
  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="Membership"
        title="Gated posts, office hours, resources, and community updates"
      />

      <Card>
        <CardHeader className="space-y-0">
          <Badge variant="success" className="w-fit">Active member</Badge>
          <CardTitle className="pt-3">AI Creator Club</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Weekly resources, live office hours, prompt drops, and member challenges.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
