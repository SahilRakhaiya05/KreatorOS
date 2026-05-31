import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiError } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getRequestOrigin } from "@/server/utils/url";
const GOOGLE_CONNECT_STATE_COOKIE = "google_connect_state";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = getRequestOrigin(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/creator/calendar?google-calendar=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return apiError("invalid_callback", "Google did not return OAuth callback parameters.", 400);
  }

  const cookieStore = await cookies();
  const rawState = cookieStore.get(GOOGLE_CONNECT_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_CONNECT_STATE_COOKIE);

  if (!rawState) {
    return apiError("missing_state", "Google connection state expired. Please start again from settings.", 400);
  }

  let expected: { state: string; workspaceId: string; userId: string };
  try {
    expected = JSON.parse(rawState);
  } catch {
    return apiError("invalid_state", "Google connection state is invalid. Please start again.", 400);
  }

  if (expected.state !== state) {
    return apiError("state_mismatch", "Google connection state mismatch. Please start again.", 400);
  }

  const { user } = await getSession();
  if (!user || user.id !== expected.userId) {
    return apiError("unauthorized", "Sign in with the same account that started Google connection.", 401);
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace || workspace.id !== expected.workspaceId) {
    return apiError("workspace_mismatch", "Switch back to the workspace that started Google connection.", 403);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return apiError("not_configured", "Google Calendar credentials are not configured on server.", 400);
  }

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${origin}/api/connect/google-calendar/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return apiError("token_exchange_failed", `Google Token exchange error: ${errBody}`, 502);
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return apiError("missing_access_token", "Google did not return an access token.", 502);
    }

    const metadata: Record<string, any> = {
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
      scope: tokenData.scope || "",
      livemode: true,
      token_type: tokenData.token_type || "Bearer",
      connected_by_user_id: user.id,
    };

    // If refresh token is returned, save it. Note: Google only sends refresh token on first authorization/prompt=consent
    if (tokenData.refresh_token) {
      metadata.refresh_token = tokenData.refresh_token;
    } else {
      // Check if we already have a refresh token in database to keep it
      const supabase = await createSupabaseServerClient();
      const { data: existing } = await supabase
        .from("provider_connections")
        .select("metadata")
        .eq("workspace_id", workspace.id)
        .eq("provider", "google_calendar")
        .maybeSingle();

      const oldRefreshToken = existing?.metadata?.refresh_token;
      if (oldRefreshToken) {
        metadata.refresh_token = oldRefreshToken;
      }
    }

    // Upsert connection into database
    const supabase = await createSupabaseServerClient();
    const connectionRow = {
      workspace_id: workspace.id,
      provider: "google_calendar",
      status: "connected",
      capabilities: ["events", "availability"],
      metadata,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("provider_connections")
      .upsert(connectionRow, { onConflict: "workspace_id,provider" });

    if (upsertErr) {
      return apiError("db_save_failed", `Failed to save Google connection: ${upsertErr.message}`, 500);
    }

    return NextResponse.redirect(`${origin}/creator/calendar?google-calendar=connected`);
  } catch (err: any) {
    return apiError("google_oauth_failed", err.message || "Google Calendar connection failed.", 502);
  }
}
