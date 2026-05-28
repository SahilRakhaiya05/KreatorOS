import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { emitEvent } from "@/server/events/emitEvent";
import type { AiSuggestionPatch } from "./schemas";

export async function createAiSuggestion(input: {
  workspaceId: string;
  pageId?: string | null;
  jobId?: string | null;
  title: string;
  riskLevel: "low" | "medium" | "high";
  patch: AiSuggestionPatch;
  explanation?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_suggestions")
    .insert({
      workspace_id: input.workspaceId,
      page_id: input.pageId ?? null,
      job_id: input.jobId ?? null,
      title: input.title,
      risk_level: input.riskLevel,
      patch: input.patch,
      explanation: input.explanation ?? null,
      created_by_type: "agent",
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    pageId: input.pageId,
    actorType: "agent",
    action: "ai.suggestion.created",
    targetType: "ai_suggestion",
    targetId: data.id,
    after: data,
  });

  await emitEvent({
    type: "ai.suggestion.created",
    workspaceId: input.workspaceId,
    pageId: input.pageId ?? undefined,
    actorType: "agent",
    payload: { suggestionId: data.id, riskLevel: input.riskLevel },
    idempotencyKey: `ai_suggestion:${data.id}`,
  });

  return { ok: true as const, data };
}
