import { AppShell, PageHeader } from "@/components/layout/appShell";
import { CalendarStudio } from "@/features/booking/components/calendarStudio";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Calendar studio"
        title="Booking with routing, payments, and AI follow-ups"
        description="Create free calls, paid meetings, brand discovery calls, member-only office hours, group events, recurring sessions, and reschedule/cancel logic."
      />
      <CalendarStudio />
    </AppShell>
  );
}
