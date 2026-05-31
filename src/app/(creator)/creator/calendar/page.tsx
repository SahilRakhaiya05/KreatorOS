import { AppShell, PageHeader } from "@/components/layout/appShell";
import { CalendarStudio } from "@/features/booking/components/calendarStudio";
import { getCreatorLinkWorkspace } from "@/server/linkCommerce/service";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export default async function Page() {
  const data = await getCreatorLinkWorkspace();
  const supabase = await createSupabaseServerClient();

  const [slots, bookings] = await Promise.all([
    supabase
      .from("creator_calendar_slots")
      .select("*")
      .eq("page_id", data.page.id)
      .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(240),
    supabase
      .from("bookings")
      .select("id, offer_id, customer_id, start_at, end_at, status, metadata, meeting_url, provider_event_id, created_at, customers(name, email), offers(title)")
      .eq("workspace_id", data.workspace.id)
      .order("start_at", { ascending: true })
      .limit(20),
  ]);

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Calendar"
        title="Scheduling"
        description="Manage booking types, weekly availability, and upcoming sessions."
      />
      <CalendarStudio data={{ ...data, calendarSlots: slots.data ?? [], bookings: bookings.data ?? [] }} />
    </AppShell>
  );
}
