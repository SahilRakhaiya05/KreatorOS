import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { assistantConfigSchema } from "@/server/api/schemas";
import { upsertCreatorAssistant } from "@/server/assistants/configureAssistant";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_ai_assistants")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError("assistant_list_failed", error.message, 400);
  return apiOk({ assistants: data ?? [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, assistantConfigSchema);
  if (isApiResponse(body)) return body;

  const result = await upsertCreatorAssistant(body);
  if (!result.ok) return apiError("assistant_config_failed", "Could not save assistant.", 400, result.error);

  return apiOk({ assistant: result.data });
}
