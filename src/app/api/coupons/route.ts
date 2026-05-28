import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { couponCreateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list coupons.", 401);

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError("coupon_list_failed", error.message, 400);
  return apiOk({ coupons: data ?? [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, couponCreateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create coupons.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      workspace_id: body.workspaceId,
      code: body.code.trim().toUpperCase(),
      name: body.name ?? null,
      discount_type: body.discountType,
      discount_value: body.discountValue,
      expires_at: body.expiresAt ?? null,
    })
    .select("*")
    .single();

  if (error) return apiError("coupon_create_failed", error.message, 400);
  return apiOk({ coupon: data }, { status: 201 });
}
