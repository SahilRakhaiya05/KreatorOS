import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list pages.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_pages")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return apiError("page_list_failed", error.message, 400);
  return apiOk({ pages: data ?? [] });
}
