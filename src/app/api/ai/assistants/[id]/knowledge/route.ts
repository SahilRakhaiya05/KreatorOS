import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { assistantKnowledgeSourceSchema } from "@/server/api/schemas";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assistant_knowledge_sources")
    .select("*")
    .eq("assistant_id", id)
    .order("created_at", { ascending: false });

  if (error) return apiError("knowledge_list_failed", error.message, 400);
  return apiOk({ sources: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await parseJsonBody(req, assistantKnowledgeSourceSchema);
  if (isApiResponse(body)) return body;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assistant_knowledge_sources")
    .insert({
      workspace_id: body.workspaceId,
      assistant_id: id,
      source_type: body.sourceType,
      title: body.title,
      content: body.content ?? null,
      source_ref: body.sourceRef ?? null,
      status: body.status,
    })
    .select("*")
    .single();

  if (error) return apiError("knowledge_create_failed", error.message, 400);
  return apiOk({ source: data }, { status: 201 });
}
