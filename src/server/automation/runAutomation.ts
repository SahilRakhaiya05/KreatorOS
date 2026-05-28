import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import type { CreatorEvent } from "@/server/events/types";
import { runBuiltInHandlers } from "./handlers";

export async function runAutomation(event: CreatorEvent, eventId: string) {
  const supabase = await createSupabaseServerClient();
  const handlerResult = await runBuiltInHandlers(event);

  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      workspace_id: event.workspaceId,
      event_id: eventId,
      status: handlerResult.status,
      logs: handlerResult.logs,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };
  return { ok: true as const, data };
}
