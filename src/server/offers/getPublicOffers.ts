import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function getPublicOffers(pageId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data ?? [];
}
