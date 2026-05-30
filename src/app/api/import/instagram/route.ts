import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { instagramCaptureSchema } from "@/server/api/schemas";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { listInstagramCaptures, saveInstagramCapture } from "@/server/instagram/captureService";

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

  const workspace = await getActiveWorkspace(user.id);
  const result = await listInstagramCaptures({ userId: user.id, workspaceId: workspace?.id });
  if (!result.ok) {
    return withCors(apiError("capture_list_failed", result.error.message, 500), req);
  }

  return withCors(apiOk({ captures: result.data }), req);
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return withCors(apiError("unauthorized", "Sign in to save Instagram posts.", 401), req);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return withCors(apiError("missing_workspace", "No active workspace found.", 400), req);

  const body = await parseJsonBody(req, instagramCaptureSchema);
  if (isApiResponse(body)) return withCors(body, req);

  try {
    const result = await saveInstagramCapture({
      userId: user.id,
      workspaceId: workspace.id,
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
