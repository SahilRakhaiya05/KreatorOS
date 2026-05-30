import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getStripe } from "@/server/payments/stripeClient";
import {
  STRIPE_CONNECT_STATE_COOKIE,
  accountMetadata,
  connectionStatus,
  upsertStripeConnection,
} from "@/server/payments/stripeConnect";

export const runtime = "nodejs";

async function getAuthedWorkspace() {
  const { user } = await getSession();
  if (!user) return { error: apiError("unauthorized", "Sign in to connect Stripe.", 401) };

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return { error: apiError("missing_workspace", "No active workspace found.", 400) };

  return { user, workspace };
}

export async function GET() {
  const auth = await getAuthedWorkspace();
  if ("error" in auth) return auth.error;

  const stripe = getStripe();
  if (!stripe) {
    return apiError("not_configured", "Stripe isn't connected yet.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data: connection } = await supabase
    .from("provider_connections")
    .select("status,metadata,connected_at")
    .eq("workspace_id", auth.workspace.id)
    .eq("provider", "stripe")
    .maybeSingle();

  const accountId = connection?.metadata?.stripe_account_id as string | undefined;
  if (!accountId) {
    return apiOk({ connected: false, status: "not_configured", metadata: {} });
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    await upsertStripeConnection({ workspaceId: auth.workspace.id, account });
    return apiOk({
      connected: account.charges_enabled && account.payouts_enabled,
      status: connectionStatus(account),
      accountId: account.id,
      metadata: accountMetadata(account),
    });
  } catch (err: any) {
    return apiError("stripe_error", err.message || "We couldn't refresh Stripe status.", 502);
  }
}

export async function POST(req: Request) {
  const auth = await getAuthedWorkspace();
  if ("error" in auth) return auth.error;

  try {
    const origin = new URL(req.url).origin;
    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID || process.env.STRIPE_CLIENT_ID;

    if (!clientId) {
      return apiError("not_configured", "Add STRIPE_CONNECT_CLIENT_ID so creators can connect their own Stripe account.", 400);
    }

    const state = randomBytes(24).toString("hex");
    const cookieStore = await cookies();
    cookieStore.set(
      STRIPE_CONNECT_STATE_COOKIE,
      JSON.stringify({ state, workspaceId: auth.workspace.id, userId: auth.user.id }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60,
        path: "/",
      }
    );

    const authorizeUrl = new URL("https://connect.stripe.com/oauth/authorize");
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("scope", "read_write");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("redirect_uri", `${origin}/api/connect/stripe/callback`);

    return apiOk({
      url: authorizeUrl.toString(),
      mode: "oauth_standard_account",
      status: "oauth_redirect",
    });
  } catch (err: any) {
    return apiError("stripe_error", err.message || "We couldn't start the connection. Please try again.", 502);
  }
}
