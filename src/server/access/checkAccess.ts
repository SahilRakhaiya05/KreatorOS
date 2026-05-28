import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function checkAccess(input: { workspaceId: string; customerId: string; offerId?: string | null }) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("access_grants")
    .select("id,status,expires_at")
    .eq("workspace_id", input.workspaceId)
    .eq("customer_id", input.customerId)
    .eq("status", "active");

  if (input.offerId) query = query.eq("offer_id", input.offerId);

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return false;
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return false;
  return true;
}
