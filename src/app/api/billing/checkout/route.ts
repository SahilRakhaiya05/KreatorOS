import { NextResponse } from "next/server";

import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { getStripe } from "@/server/payments/stripeClient";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

const plans = {
  free: { plan: "free", amount: 0, name: "KreatorOS Free" },
  pro: { plan: "pro", amount: 2000, name: "KreatorOS Pro" },
  business: { plan: "business", amount: 9900, name: "KreatorOS Business" },
} as const;

function appUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const planKey = url.searchParams.get("plan") || "pro";
  const selected = plans[planKey as keyof typeof plans] ?? plans.pro;
  const { user } = await getSession();

  if (!user) {
    const next = `/api/billing/checkout?plan=${selected.plan}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, appUrl(req)));
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    return NextResponse.redirect(new URL("/onboarding", appUrl(req)));
  }

  const supabase = await createSupabaseServerClient();

  if (selected.amount === 0) {
    await supabase
      .from("workspaces")
      .update({
        plan: "free",
        metadata: {
          billing_plan: "free",
          billing_status: "active",
          billing_source: "marketing_page",
          billing_updated_at: new Date().toISOString(),
        },
      })
      .eq("id", workspace.id);

    return NextResponse.redirect(new URL("/creator/link/settings?billing=free", appUrl(req)));
  }

  const stripe = getStripe();
  if (!stripe) {
    await supabase
      .from("workspaces")
      .update({
        metadata: {
          billing_plan: selected.plan,
          billing_status: "stripe_required",
          billing_source: "marketing_page",
          billing_updated_at: new Date().toISOString(),
        },
      })
      .eq("id", workspace.id);

    return NextResponse.redirect(new URL(`/creator/link/settings?billing=stripe_required&plan=${selected.plan}`, appUrl(req)));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          product_data: { name: selected.name },
          unit_amount: selected.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      workspaceId: workspace.id,
      userId: user.id,
      plan: selected.plan,
      source: "marketing_page",
    },
    success_url: `${appUrl(req)}/api/billing/complete?plan=${selected.plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl(req)}/creator/link/settings?billing=cancelled&plan=${selected.plan}`,
  });

  return NextResponse.redirect(session.url || new URL("/creator/link/settings?billing=session_failed", appUrl(req)));
}
