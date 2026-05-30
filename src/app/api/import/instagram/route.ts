import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { instagramCaptureSchema } from "@/server/api/schemas";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { listInstagramCaptures, saveInstagramCapture, reanalyzeInstagramCapture } from "@/server/instagram/captureService";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const runtime = "nodejs";

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, content-type, x-kreatoros-source, x-kreatoros-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

function withCors<T extends Response>(response: T, req: Request) {
  Object.entries(corsHeaders(req)).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return withCors(apiError("unauthorized", "Sign in to view saved Instagram captures.", 401), req);

  const supabase = await createSupabaseServerClient();
  let workspace = await getActiveWorkspace(user.id);
  let workspaceId = workspace?.id ?? null;

  if (!workspaceId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("workspace_id")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle();

    if (customer?.workspace_id) {
      workspaceId = customer.workspace_id;
    } else {
      const { data: firstWs } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (firstWs) {
        workspaceId = firstWs.id;
      }
    }
  }

  const result = await listInstagramCaptures({ userId: user.id, workspaceId });
  if (!result.ok) {
    return withCors(apiError("capture_list_failed", result.error.message, 500), req);
  }

  return withCors(apiOk({ captures: result.data }), req);
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return withCors(apiError("unauthorized", "Sign in to save Instagram posts.", 401), req);

  const supabase = await createSupabaseServerClient();
  let workspace = await getActiveWorkspace(user.id);
  let workspaceId = workspace?.id ?? null;

  if (!workspaceId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("workspace_id")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle();

    if (customer?.workspace_id) {
      workspaceId = customer.workspace_id;
    } else {
      const { data: firstWs } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (firstWs) {
        workspaceId = firstWs.id;
      }
    }
  }

  if (!workspaceId) return withCors(apiError("missing_workspace", "No active workspace found.", 400), req);

  const body = await parseJsonBody(req, instagramCaptureSchema);
  if (isApiResponse(body)) return withCors(body, req);

  try {
    const result = await saveInstagramCapture({
      userId: user.id,
      workspaceId: workspaceId,
      payload: body,
    });

    if (!result.ok) return withCors(apiError("capture_save_failed", result.error.message, 500), req);

    return withCors(
      apiOk({
        id: result.data.id,
        capture: result.data,
        analysisProvider: result.provider,
        analysisAvailable: result.available,
      }),
      req,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram capture could not be saved.";
    return withCors(apiError("invalid_instagram_capture", message, 400), req);
  }
}

export async function PATCH(req: Request) {
  const { user } = await getSession();
  if (!user) return withCors(apiError("unauthorized", "Sign in to trigger re-analysis.", 401), req);

  try {
    const body = await req.json();
    const { id } = body;
    if (!id || typeof id !== "string") {
      return withCors(apiError("missing_id", "Capture ID is required for re-analysis.", 400), req);
    }

    const result = await reanalyzeInstagramCapture(id, user.id);
    if (!result.ok) {
      return withCors(apiError("reanalysis_failed", result.error.message || "Re-analysis failed.", 500), req);
    }

    return withCors(
      apiOk({
        id: result.data.id,
        capture: result.data,
        analysisProvider: result.provider,
        analysisAvailable: result.available,
      }),
      req,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error occurred.";
    return withCors(apiError("internal_error", message, 500), req);
  }
}
