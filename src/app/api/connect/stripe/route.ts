import Stripe from "stripe";
import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to connect Stripe.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return apiError("not_configured", "Stripe isn't connected yet.", 400);
  }

  try {
    const origin = new URL(req.url).origin;
    const stripe = new Stripe(secret);

    const account = await stripe.accounts.create({ type: "express" });
    
    // Save/upsert the connection status immediately so the system maps the Stripe account ID
    const supabase = await createSupabaseServerClient();
    const isProd = process.env.NODE_ENV === "production";
    
    await supabase
      .from("provider_connections")
      .upsert(
        {
          workspace_id: workspace.id,
          provider: "stripe",
          status: isProd ? "connected" : "sandbox",
          capabilities: ["checkout", "subscriptions", "refunds"],
          metadata: { stripe_account_id: account.id },
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id,provider",
        }
      );

    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/creator/settings`,
      return_url: `${origin}/creator/settings`,
      type: "account_onboarding",
    });

    return apiOk({ url: link.url, accountId: account.id });
  } catch (err: any) {
    return apiError("stripe_error", err.message || "We couldn't start the connection. Please try again.", 502);
  }
}
