import type { CalendarProvider, CalendarEventResult, TimeSlot } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

async function getGoogleAccessToken(workspaceId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: connection } = await supabase
    .from("provider_connections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (!connection) return null;

  const metadata = connection.metadata || {};
  const accessToken = metadata.access_token as string | undefined;
  const refreshToken = metadata.refresh_token as string | undefined;
  const expiresAt = metadata.expires_at as number | undefined; // timestamp in ms

  if (!accessToken) return null;

  // If token is expired or expires in < 60 seconds, refresh it
  if (refreshToken && expiresAt && expiresAt - Date.now() < 60000) {
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        // Persist the refreshed token in provider_connections metadata
        const updatedMetadata = {
          ...metadata,
          access_token: data.access_token,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        };

        await supabase
          .from("provider_connections")
          .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
          .eq("id", connection.id);

        return data.access_token as string;
      }
    } catch {
      // Fallback to current token if refresh fails
      return accessToken;
    }
  }

  return accessToken;
}

export const googleCalendarProvider: CalendarProvider = {
  async createEvent(input): Promise<CalendarEventResult> {
    const token = await getGoogleAccessToken(input.workspaceId);
    if (!token) {
      return { ok: false, error: "Google Calendar connection is not configured." };
    }

    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: input.title,
          description: input.description || "",
          start: { dateTime: input.startTime },
          end: { dateTime: input.endTime },
          attendees: [{ email: input.customerEmail, displayName: input.customerName || undefined }],
          conferenceData: {
            createRequest: {
              requestId: `req_${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        return { ok: false, error: `Google API Error: ${errBody}` };
      }

      const event = await res.json();
      const meetLink = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri || undefined;

      return {
        ok: true,
        externalEventId: event.id,
        meetingUrl: meetLink,
      };
    } catch (err: any) {
      return { ok: false, error: err.message || "Failed to create Google Calendar event." };
    }
  },

  async getAvailability(input): Promise<TimeSlot[]> {
    const token = await getGoogleAccessToken(input.workspaceId);
    if (!token) return [];

    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: input.startTime,
          timeMax: input.endTime,
          items: [{ id: "primary" }],
        }),
      });

      if (!res.ok) return [];

      const data = await res.json();
      const busySlots = data.calendars?.primary?.busy || [];

      return busySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end,
      }));
    } catch {
      return [];
    }
  },
};
