import { getProviderStatus } from "@/server/providers/status";
import { googleCalendarProvider } from "./googleCalendarProvider";
import { calcomProvider } from "./calcomProvider";
import { mockCalendarProvider } from "./mockCalendarProvider";
import type { CalendarEventInput, CalendarEventResult, TimeSlot, AvailabilityInput } from "./types";

export const calendarService = {
  async getActiveProvider(workspaceId: string) {
    const googleStatus = await getProviderStatus(workspaceId, "google_calendar");
    if (googleStatus === "connected" || googleStatus === "sandbox") {
      return googleCalendarProvider;
    }

    const calcomStatus = await getProviderStatus(workspaceId, "calcom");
    if (calcomStatus === "connected" || calcomStatus === "sandbox") {
      return calcomProvider;
    }

    const isDev = process.env.NODE_ENV !== "production";
    const googleMock = googleStatus === "mock_mode";
    const calcomMock = calcomStatus === "mock_mode";

    if (googleMock || calcomMock || isDev) {
      return mockCalendarProvider;
    }

    return null;
  },

  async createEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
    const provider = await this.getActiveProvider(input.workspaceId);
    if (!provider) {
      return {
        ok: false,
        error: "No active calendar provider connected for this workspace.",
      };
    }
    return provider.createEvent(input);
  },

  async getAvailability(input: AvailabilityInput): Promise<TimeSlot[]> {
    const provider = await this.getActiveProvider(input.workspaceId);
    if (!provider) return [];
    return provider.getAvailability(input);
  },
};
