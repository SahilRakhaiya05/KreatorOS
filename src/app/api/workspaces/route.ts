import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workspaceCreateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list workspaces.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role,status,workspaces(id,name,slug,type,status,plan,avatar_url)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return apiError("workspace_list_failed", error.message, 400);
  return apiOk({ workspaces: data ?? [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, workspaceCreateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create a workspace.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ name: body.name, slug: body.slug, type: body.type, owner_id: user.id })
    .select("*")
    .single();

  if (error) return apiError("workspace_create_failed", error.message, 400);

  await supabase.from("workspace_members").insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });
  await supabase.from("profiles").update({ active_workspace_id: workspace.id }).eq("id", user.id);

  return apiOk({ workspace }, { status: 201 });
}
