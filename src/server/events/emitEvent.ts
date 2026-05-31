import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { runAutomation } from "@/server/automation/runAutomation";
import { capturePostHogEvent } from "@/server/posthog/client";
import { eventIdempotencyKey } from "./idempotency";
import type { CreatorEvent } from "./types";

export async function emitEvent(event: CreatorEvent) {
  // Capture the backend workflow event in PostHog server-side
  try {
    await capturePostHogEvent({
      distinctId: event.actorId ?? event.ownerId ?? event.workspaceId ?? "anonymous",
      event: event.type,
      properties: {
        workspace_id: event.workspaceId,
        page_id: event.pageId,
        owner_id: event.ownerId,
        actor_type: event.actorType,
        actor_id: event.actorId,
        ...(event.payload ?? {}),
      },
    });
  } catch (err: any) {
    console.warn("[PostHog Server Telemetry Warn] Failed to record server event:", err.message);
  }

  const supabase = await createSupabaseServerClient();
  const idempotencyKey = eventIdempotencyKey(event);

  const { data, error } = await supabase
    .from("workflow_events")
    .insert({
      workspace_id: event.workspaceId,
      page_id: event.pageId ?? null,
      owner_id: event.ownerId ?? null,
      type: event.type,
      actor_type: event.actorType,
      actor_id: event.actorId ?? null,
      payload: event.payload,
      idempotency_key: idempotencyKey,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: true as const, duplicate: true, eventId: null };
    }
    return { ok: false as const, error };
  }

  await runAutomation(event, data.id);

  if (!event.type.startsWith("page.viewed") && !event.type.startsWith("analytics.")) {
    await writeAuditLog({
      workspaceId: event.workspaceId,
      pageId: event.pageId,
      ownerId: event.ownerId,
      actorType: event.actorType,
      actorId: event.actorId,
      action: event.type,
      targetType: "workflow_event",
      targetId: data.id,
      after: event.payload,
    });
  }

  return { ok: true as const, duplicate: false, eventId: data.id as string };
}
