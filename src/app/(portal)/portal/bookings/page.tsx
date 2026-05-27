import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sessions = ["AI Strategy Call — Jun 4, 10:30", "Member Office Hours — Jun 8, 18:00"];

export default function PortalBookings() {
  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="My bookings"
        title="Upcoming sessions, prep forms, calendar links, and recordings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming sessions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {sessions.map((x) => (
              <div key={x} className="flex items-center justify-between py-3.5">
                <p className="text-sm font-medium">{x}</p>
                <Badge variant="success">Confirmed</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
