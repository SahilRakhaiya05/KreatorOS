import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Button } from "@/components/ui/button";
import { portalService } from "@/server/portal/portalService";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { PortalBookingClient } from "./portalBookingClient";

export const metadata = { title: "Portal Bookings — KreatorOS" };

export default async function PortalBookings() {
  const { customer, workspaceId } = await portalService.requirePortalCustomer();
  const bookings = await portalService.getCustomerBookings(customer.id);

  const supabase = await createSupabaseServerClient();
  
  // 1. Fetch available calendar slots
  const { data: slots } = await supabase
    .from("creator_calendar_slots")
    .select("*")
    .eq("status", "available")
    .order("starts_at", { ascending: true })
    .limit(10);

  let finalSlotsList = slots ?? [];
  if (finalSlotsList.length > 0) {
    const workspaceIdForSlots = finalSlotsList[0].workspace_id;
    if (workspaceIdForSlots) {
      try {
        const { calendarService } = await import("@/server/calendar/calendarService");
        const startWindow = finalSlotsList[0].starts_at;
        const endWindow = finalSlotsList[finalSlotsList.length - 1].ends_at;

        const busySlots = await calendarService.getAvailability({
          workspaceId: workspaceIdForSlots,
          startTime: startWindow,
          endTime: endWindow,
        });

        if (busySlots && busySlots.length > 0) {
          finalSlotsList = finalSlotsList.filter((slot) => {
            const slotStart = new Date(slot.starts_at).getTime();
            const slotEnd = new Date(slot.ends_at).getTime();

            return !busySlots.some((busy) => {
              const busyStart = new Date(busy.start).getTime();
              const busyEnd = new Date(busy.end).getTime();
              return slotStart < busyEnd && slotEnd > busyStart;
            });
          });
        }
      } catch (err) {
        console.error("Error filtering portal availability slots:", err);
      }
    }
  }

  const finalSlots = finalSlotsList.length > 0
    ? finalSlotsList.map(s => ({
        id: s.id,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
        timezone: s.timezone || "EST",
      }))
    : [
        { id: "slot-1", starts_at: new Date(Date.now() + 86400000 * 2).toISOString(), ends_at: new Date(Date.now() + 86400000 * 2 + 1800000).toISOString(), timezone: "EST" },
        { id: "slot-2", starts_at: new Date(Date.now() + 86400000 * 3).toISOString(), ends_at: new Date(Date.now() + 86400000 * 3 + 1800000).toISOString(), timezone: "EST" },
        { id: "slot-3", starts_at: new Date(Date.now() + 86400000 * 4).toISOString(), ends_at: new Date(Date.now() + 86400000 * 4 + 1800000).toISOString(), timezone: "EST" },
      ];

  // 2. Fetch the workspace consulting/booking offer
  const { data: bookingOffer } = await supabase
    .from("offers")
    .select("id, title, price_cents")
    .eq("workspace_id", workspaceId)
    .eq("type", "booking")
    .limit(1)
    .maybeSingle();

  // Onboard fallback booking offer details if creator has not published one
  const finalOfferId = bookingOffer?.id || "d128df19-bc78-4395-8854-cf3d12d098ee";
  const finalOfferTitle = bookingOffer?.title || "1:1 AI Productivity Deep-Dive Strategy Session";
  const finalPriceCents = bookingOffer?.price_cents ?? 15000; // $150.00 fallback

  const clientBookings = bookings.map(b => ({
    id: b.id,
    start_at: b.start_at,
    end_at: b.end_at,
    status: b.status,
    timezone: b.timezone,
    meeting_url: b.meeting_url,
    offers: b.offers ? { title: (b.offers as any).title } : null,
  }));

  return (
    <AppShell role="portal">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href="/portal"><ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="My bookings"
        title="Your Scheduled Sessions"
        description="Select available hours to book strategy, mentoring, or business audit consulting calls instantly."
      />

      <PortalBookingClient
        initialBookings={clientBookings}
        availableSlots={finalSlots}
        customer={{
          id: customer.id,
          email: customer.email,
          name: customer.name,
        }}
        workspaceId={workspaceId}
        offerId={finalOfferId}
        offerTitle={finalOfferTitle}
        offerPriceCents={finalPriceCents}
      />
    </AppShell>
  );
}
