import { NextResponse } from "next/server";

import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { getStripe } from "@/server/payments/stripeClient";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const allowedPlans = new Set(["pro", "business"]);

function appUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan") || "pro";
  const sessionId = url.searchParams.get("session_id");
  const { user } = await getSession();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/api/billing/complete?plan=${plan}&session_id=${sessionId || ""}`)}`, appUrl(req)));
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace || !allowedPlans.has(plan)) {
    return NextResponse.redirect(new URL("/creator/link/settings?billing=invalid", appUrl(req)));
  }

  const stripe = getStripe();
  if (!stripe || !sessionId) {
    return NextResponse.redirect(new URL(`/creator/link/settings?billing=pending&plan=${plan}`, appUrl(req)));
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionWorkspaceId = session.metadata?.workspaceId;
  const sessionPlan = session.metadata?.plan;

  if (sessionWorkspaceId === workspace.id && sessionPlan === plan && session.payment_status === "paid") {
    const supabase = await createSupabaseServerClient();
    await supabase
      .from("workspaces")
      .update({
        plan,
        metadata: {
          billing_plan: plan,
          billing_status: "active",
          stripe_checkout_session_id: session.id,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          billing_updated_at: new Date().toISOString(),
        },
      })
      .eq("id", workspace.id);
  }

  return NextResponse.redirect(new URL(`/creator/link/settings?billing=success&plan=${plan}`, appUrl(req)));
}
