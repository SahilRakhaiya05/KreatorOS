import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { pageVersionSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { createPageVersion } from "@/server/pages/createPageVersion";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("page_versions").select("*").eq("page_id", id).order("version_number", { ascending: false });
  if (error) return apiError("page_versions_failed", error.message, 400);
  return apiOk({ versions: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await parseJsonBody(req, pageVersionSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create versions.", 401);

  const result = await createPageVersion({
    workspaceId: body.workspaceId,
    pageId: id,
    createdBy: user.id,
    createdByType: "creator",
    dsl: body.dsl,
    changeSummary: body.changeSummary,
  });

  if (!result.ok) return apiError("page_version_failed", "Could not create page version.", 400, result.error);
  return apiOk({ version: result.data }, { status: 201 });
}
