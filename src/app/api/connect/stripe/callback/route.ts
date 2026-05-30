import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiError } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getStripe } from "@/server/payments/stripeClient";
import {
  STRIPE_CONNECT_STATE_COOKIE,
  accountMetadata,
  connectionStatus,
  upsertStripeConnection,
} from "@/server/payments/stripeConnect";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/creator/settings?stripe=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return apiError("invalid_callback", "Stripe did not return the required OAuth callback parameters.", 400);
  }

  const cookieStore = await cookies();
  const rawState = cookieStore.get(STRIPE_CONNECT_STATE_COOKIE)?.value;
  cookieStore.delete(STRIPE_CONNECT_STATE_COOKIE);

  if (!rawState) {
    return apiError("missing_state", "Stripe connection state expired. Please start again from settings.", 400);
  }

  let expected: { state: string; workspaceId: string; userId: string };
  try {
    expected = JSON.parse(rawState);
  } catch {
    return apiError("invalid_state", "Stripe connection state is invalid. Please start again from settings.", 400);
  }

  if (expected.state !== state) {
    return apiError("state_mismatch", "Stripe connection state did not match. Please start again from settings.", 400);
  }

  const { user } = await getSession();
  if (!user || user.id !== expected.userId) {
    return apiError("unauthorized", "Sign in with the same account that started Stripe connection.", 401);
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace || workspace.id !== expected.workspaceId) {
    return apiError("workspace_mismatch", "Switch back to the workspace that started Stripe connection.", 403);
  }

  const stripe = getStripe();
  if (!stripe) {
    return apiError("not_configured", "Stripe secret key is required to finish OAuth.", 400);
  }

  try {
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    if (!response.stripe_user_id) {
      return apiError("missing_stripe_user", "Stripe did not return an account id.", 502);
    }

    const account = await stripe.accounts.retrieve(response.stripe_user_id);
    await upsertStripeConnection({
      workspaceId: workspace.id,
      account,
      metadata: {
        connection_mode: "oauth_standard_account",
        stripe_user_id: response.stripe_user_id,
        stripe_publishable_key: response.stripe_publishable_key ?? null,
        scope: response.scope ?? "read_write",
        livemode: response.livemode ?? false,
        token_type: response.token_type ?? "bearer",
        connected_by_user_id: user.id,
      },
    });

    return NextResponse.redirect(
      `${origin}/creator/settings?stripe=connected&account=${encodeURIComponent(account.id)}&status=${encodeURIComponent(connectionStatus(account))}`
    );
  } catch (err: any) {
    return apiError("stripe_oauth_failed", err.message || "Stripe OAuth could not be completed.", 502);
  }
}
