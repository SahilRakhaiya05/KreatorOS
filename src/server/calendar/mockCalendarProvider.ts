import type { CalendarProvider, CalendarEventResult, TimeSlot } from "./types";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export const mockCalendarProvider: CalendarProvider = {
  async createEvent(input): Promise<CalendarEventResult> {
    const externalEventId = `mock_evt_${Math.random().toString(36).substring(2, 11)}`;
    const meetingUrl = `https://meet.google.com/mock-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`;

    await writeAuditLog({
      workspaceId: input.workspaceId,
      actorType: "system",
      action: "calendar.event_creation_mocked",
      targetType: "booking",
      targetId: undefined,
      after: { externalEventId, meetingUrl, title: input.title, startTime: input.startTime },
    });

    return {
      ok: true,
      externalEventId,
      meetingUrl,
    };
  },

  async getAvailability(): Promise<TimeSlot[]> {
    // Return no mock busy periods (everything is open by default in development/sandbox)
    return [];
  },
};
