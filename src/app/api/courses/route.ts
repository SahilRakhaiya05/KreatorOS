import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { catalogCreateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list courses.", 401);

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*, course_lessons(id,title,status,sort_order), offers(id,title,status,slug,price_cents,currency)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) return apiError("courses_failed", error.message, 400);
  return apiOk({ courses: data ?? [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, catalogCreateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create courses.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      workspace_id: body.workspaceId,
      offer_id: body.offerId ?? null,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "draft",
    })
    .select("*")
    .single();

  if (error) return apiError("course_create_failed", error.message, 400);
  return apiOk({ course: data }, { status: 201 });
}
