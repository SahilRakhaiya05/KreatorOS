import { z } from "zod";

import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const blockCreateSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  type: z.enum(["link", "calendar", "product", "membership", "lead_magnet", "brand_intake", "ai_concierge"]),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  refType: z.string().optional(),
  refId: z.string().uuid().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("creator_page_blocks").select("*").eq("page_id", id).order("sort_order", { ascending: true });
  if (error) return apiError("blocks_read_failed", error.message, 400);
  return apiOk({ blocks: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await parseJsonBody(req, blockCreateSchema);
  if (isApiResponse(body)) return body;

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("creator_page_blocks").select("id", { count: "exact", head: true }).eq("page_id", id);
  const { data, error } = await supabase
    .from("creator_page_blocks")
    .insert({
      page_id: id,
      workspace_id: body.workspaceId ?? null,
      type: body.type,
      title: body.title,
      subtitle: body.subtitle ?? null,
      url: body.url ?? null,
      metadata: body.metadata,
      ref_type: body.refType ?? null,
      ref_id: body.refId ?? null,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();

  if (error) return apiError("block_create_failed", error.message, 400);
  return apiOk({ block: data }, { status: 201 });
}
