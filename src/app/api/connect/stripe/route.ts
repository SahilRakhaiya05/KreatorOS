import Stripe from "stripe";
import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to connect Stripe.", 401);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return apiError("not_configured", "Stripe isn't connected yet.", 400);
  }

  try {
    const origin = new URL(req.url).origin;
    const stripe = new Stripe(secret);

    const account = await stripe.accounts.create({ type: "express" });
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/creator/settings`,
      return_url: `${origin}/creator/settings`,
      type: "account_onboarding",
    });

    return apiOk({ url: link.url, accountId: account.id });
  } catch {
    return apiError("stripe_error", "We couldn't start the connection. Please try again.", 502);
  }
}
