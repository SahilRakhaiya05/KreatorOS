import type { CalendarProvider, CalendarEventResult, TimeSlot } from "./types";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const calcomProvider: CalendarProvider = {
  async createEvent(input): Promise<CalendarEventResult> {
    // Cal.com handles scheduling inside its own widget/interface, and syncs back via webhooks.
    // Here we generate a booking request that can be fulfilled on Cal.com.
    const calcomSlug = input.metadata?.calcomSlug as string || "meeting";
    const bookingUrl = `https://cal.com/workspace-${input.workspaceId}/${calcomSlug}`;

    await writeAuditLog({
      workspaceId: input.workspaceId,
      actorType: "system",
      action: "calendar.calcom_event_mapped",
      targetType: "booking",
      targetId: undefined,
      after: { bookingUrl, title: input.title },
    });

    return {
      ok: true,
      externalEventId: `calcom_${Date.now()}`,
      meetingUrl: bookingUrl,
    };
  },

  async getAvailability(): Promise<TimeSlot[]> {
    // Cal.com hosts its own availability checks directly on the booking widgets
    return [];
  },
};
