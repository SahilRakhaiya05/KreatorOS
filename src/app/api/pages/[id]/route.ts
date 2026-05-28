import { apiError, apiOk } from "@/server/api/responses";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("creator_pages").select("*").eq("id", id).maybeSingle();
  if (error) return apiError("page_read_failed", error.message, 400);
  if (!data) return apiError("not_found", "Page not found.", 404);
  return apiOk({ page: data });
}
