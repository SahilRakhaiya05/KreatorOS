import { AppShell } from "@/components/layout/appShell";
import { CalendarStudio } from "@/features/booking/components/calendarStudio";
import { PageTitle } from "@/components/ui";
export default function Page(){return <AppShell role="creator"><div className="space-y-6"><PageTitle eyebrow="Calendar studio" title="Calendly/Cal.com-style booking with routing, payments, workflows, and AI follow-ups." text="Create free calls, paid meetings, brand discovery calls, member-only office hours, group events, recurring sessions, and reschedule/cancel logic."/><CalendarStudio/></div></AppShell>}
