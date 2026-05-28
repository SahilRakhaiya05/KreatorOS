import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function upsertCreatorAssistant(input: {
  workspaceId: string;
  pageId: string;
  name: string;
  status?: "draft" | "active" | "paused" | "archived";
  tone?: string;
  welcomeMessage?: string;
  systemPrompt?: string;
  knowledgeSummary?: string;
  permissions?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const row = {
    workspace_id: input.workspaceId,
    page_id: input.pageId,
    name: input.name,
    status: input.status ?? "active",
    tone: input.tone ?? "helpful",
    welcome_message: input.welcomeMessage ?? "Tell me what you need help with.",
    system_prompt: input.systemPrompt ?? "Recommend published offers only. Do not reveal private dashboard data.",
    knowledge_summary: input.knowledgeSummary ?? null,
    permissions: input.permissions ?? {
      recommend_offers: true,
      start_booking: true,
      start_checkout: true,
      capture_leads: true,
    },
  };

  const { data, error } = await supabase
    .from("creator_ai_assistants")
    .upsert(row, { onConflict: "page_id" })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };

  await writeAuditLog({
    workspaceId: input.workspaceId,
    pageId: input.pageId,
    actorType: "creator",
    action: "assistant.configured",
    targetType: "creator_ai_assistant",
    targetId: data.id,
    after: data,
  });

  return { ok: true as const, data };
}
