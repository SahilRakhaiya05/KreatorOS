import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { emitEvent } from "@/server/events/emitEvent";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

type SuggestionOperation = {
  op?: string;
  pageId?: string;
  blockId?: string;
  update?: Record<string, unknown>;
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to apply suggestions.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: suggestion, error } = await supabase.from("ai_suggestions").select("*").eq("id", id).maybeSingle();

  if (error) return apiError("suggestion_read_failed", error.message, 400);
  if (!suggestion) return apiError("not_found", "Suggestion not found.", 404);
  if (suggestion.risk_level !== "low" && suggestion.status !== "approved") {
    return apiError("approval_required", "Medium and high risk suggestions must be approved before applying.", 409);
  }

  const operations = Array.isArray(suggestion.patch?.operations) ? suggestion.patch.operations as SuggestionOperation[] : [];
  const applied: Array<Record<string, unknown>> = [];

  for (const operation of operations) {
    if (operation.op === "update_page" && operation.pageId && operation.update) {
      const update = {
        ...(typeof operation.update.bio === "string" ? { bio: operation.update.bio } : {}),
        ...(typeof operation.update.layout === "string" ? { layout: operation.update.layout } : {}),
        ...(typeof operation.update.theme_name === "string" ? { theme_name: operation.update.theme_name } : {}),
      };
      await supabase.from("creator_pages").update(update).eq("id", operation.pageId);
      applied.push({ op: operation.op, pageId: operation.pageId });
    }

    if (operation.op === "update_block" && operation.pageId && operation.blockId && operation.update) {
      const update = {
        ...(typeof operation.update.title === "string" ? { title: operation.update.title } : {}),
        ...(typeof operation.update.subtitle === "string" ? { subtitle: operation.update.subtitle } : {}),
        ...(typeof operation.update.url === "string" ? { url: operation.update.url } : {}),
        ...(typeof operation.update.status === "string" ? { status: operation.update.status } : {}),
      };
      await supabase.from("creator_page_blocks").update(update).eq("id", operation.blockId).eq("page_id", operation.pageId);
      applied.push({ op: operation.op, pageId: operation.pageId, blockId: operation.blockId });
    }
  }

  const { data: updatedSuggestion } = await supabase
    .from("ai_suggestions")
    .update({ status: "applied" })
    .eq("id", id)
    .select("*")
    .single();

  await writeAuditLog({
    workspaceId: suggestion.workspace_id,
    pageId: suggestion.page_id,
    actorType: "creator",
    actorId: user.id,
    action: "ai.suggestion.applied",
    targetType: "ai_suggestion",
    targetId: id,
    before: suggestion,
    after: { suggestion: updatedSuggestion, applied },
  });

  await emitEvent({
    type: "ai.suggestion.applied",
    workspaceId: suggestion.workspace_id,
    pageId: suggestion.page_id ?? undefined,
    actorType: "creator",
    actorId: user.id,
    payload: { suggestionId: id, applied },
    idempotencyKey: `ai_suggestion_applied:${id}`,
  });

  return apiOk({ suggestion: updatedSuggestion, applied });
}
