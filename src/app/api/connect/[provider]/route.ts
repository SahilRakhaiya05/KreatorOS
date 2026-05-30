import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";

export const runtime = "nodejs";

export const GOOGLE_CONNECT_STATE_COOKIE = "google_connect_state";

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to connect providers.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  if (provider === "google-calendar" || provider === "google-meet" || provider === "google_calendar") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return apiError(
        "provider_not_configured",
        "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local to enable real Google Calendar connectivity.",
        400
      );
    }

    const state = randomBytes(24).toString("hex");
    const cookieStore = await cookies();
    cookieStore.set(
      GOOGLE_CONNECT_STATE_COOKIE,
      JSON.stringify({ state, workspaceId: workspace.id, userId: user.id }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60,
        path: "/",
      }
    );

    const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", `${origin}/api/connect/google-calendar/callback`);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly"
    ].join(" "));
    authorizeUrl.searchParams.set("access_type", "offline");
    authorizeUrl.searchParams.set("prompt", "consent");
    authorizeUrl.searchParams.set("state", state);

    return apiOk({
      url: authorizeUrl.toString(),
      status: "oauth_redirect",
    });
  }

  return apiError("unavailable", `The connector for '${provider}' is not configured yet.`, 400);
}
