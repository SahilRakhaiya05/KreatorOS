import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { offerCreateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createOffer } from "@/server/offers/createOffer";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("offers").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (error) return apiError("offer_list_failed", error.message, 400);
  return apiOk({ offers: data ?? [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, offerCreateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create offers.", 401);

  const result = await createOffer({ ...body, ownerId: user.id });
  if (!result.ok) return apiError("offer_create_failed", "Could not create offer.", 400, result.error);
  return apiOk({ offer: result.data }, { status: 201 });
}
