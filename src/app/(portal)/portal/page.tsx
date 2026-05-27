import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tiles = ["Purchased products", "Upcoming calls", "Course progress", "Membership posts"];

export default function PortalHome() {
  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="Client portal"
        title="One place for buyers, members, students, and booked clients"
        description="After someone buys, books, joins, or enrolls, they should not be lost in email. They get a portal for access, bookings, support, community, and next steps."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((x, i) => (
          <Card key={x} className="transition hover:shadow-soft">
            <CardHeader className="space-y-0 pb-2">
              <Badge variant={i % 2 ? "success" : "accent"} className="w-fit">Access</Badge>
              <CardTitle className="pt-3 text-lg">{x}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View, download, reschedule, ask support, or continue learning.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
