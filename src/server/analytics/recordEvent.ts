import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { capturePostHogEvent } from "@/server/posthog/client";

export async function recordEvent(input: {
  workspaceId?: string | null;
  pageId?: string | null;
  eventType: string;
  visitorId?: string | null;
  sessionId?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = hasSupabaseServiceConfig() ? createSupabaseServiceClient() : await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .insert({
      workspace_id: input.workspaceId ?? null,
      page_id: input.pageId ?? null,
      event_type: input.eventType,
      visitor_id: input.visitorId ?? null,
      session_id: input.sessionId ?? null,
      referrer: input.referrer ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error };

  await capturePostHogEvent({
    distinctId: input.visitorId ?? input.sessionId ?? input.workspaceId ?? input.pageId ?? null,
    event: input.eventType,
    properties: {
      event_id: data.id,
      workspace_id: input.workspaceId ?? null,
      page_id: input.pageId ?? null,
      session_id: input.sessionId ?? null,
      referrer: input.referrer ?? null,
      ...(input.metadata ?? {}),
    },
  });

  return { ok: true as const, eventId: data.id as string };
}
