import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { runAutomation } from "@/server/automation/runAutomation";
import { eventIdempotencyKey } from "./idempotency";
import type { CreatorEvent } from "./types";

export async function emitEvent(event: CreatorEvent) {
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
