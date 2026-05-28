import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { accessCheckSchema } from "@/server/api/schemas";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";

function getAccessClient() {
  return hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient();
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, accessCheckSchema);
  if (isApiResponse(body)) return body;

  const supabase = await getAccessClient();
  const email = body.email.trim().toLowerCase();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("workspace_id", body.workspaceId)
    .eq("email", email)
    .maybeSingle();

  if (!customer) return apiError("access_not_found", "No active access was found for that email.", 404);

  const { data: grant } = await supabase
    .from("access_grants")
    .select("*")
    .eq("workspace_id", body.workspaceId)
    .eq("customer_id", customer.id)
    .eq("offer_id", body.offerId)
    .eq("status", "active")
    .maybeSingle();

  if (!grant || (grant.expires_at && new Date(grant.expires_at) <= new Date())) {
    return apiError("access_not_found", "No active access was found for that email.", 404);
  }

  const { data: content } = await supabase
    .from("gated_content")
    .select("id,title,content_type,content_ref,access_rules")
    .eq("workspace_id", body.workspaceId)
    .eq("offer_id", body.offerId)
    .order("created_at", { ascending: true });

  return apiOk({ access: grant, content: content ?? [] });
}
