import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, content-type, x-kreatoros-source, x-kreatoros-version",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
  if (!user) return withCors(apiError("unauthorized", "Sign in to view the current user.", 401), req);

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url,account_type,onboarding_completed,active_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  const activeWorkspace = await getActiveWorkspace(user.id);

  return withCors(apiOk({ user, profile, activeWorkspace }), req);
}

