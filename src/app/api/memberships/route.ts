import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { catalogCreateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list memberships.", 401);

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*, offers(id,title,status,slug,price_cents,currency)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError("memberships_failed", error.message, 400);
  return apiOk({ memberships: data ?? [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, catalogCreateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create memberships.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      workspace_id: body.workspaceId,
      offer_id: body.offerId ?? null,
      name: body.title,
      benefits: body.metadata.benefits ?? [],
      billing_interval: typeof body.metadata.billingInterval === "string" ? body.metadata.billingInterval : "month",
    })
    .select("*")
    .single();

  if (error) return apiError("membership_create_failed", error.message, 400);
  return apiOk({ membership: data }, { status: 201 });
}
