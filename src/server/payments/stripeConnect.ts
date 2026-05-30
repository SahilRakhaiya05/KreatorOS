import Stripe from "stripe";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const STRIPE_CONNECT_STATE_COOKIE = "kreatoros_stripe_connect_state";

export function connectionStatus(account: Stripe.Account) {
  if (account.charges_enabled && account.payouts_enabled) return "connected";
  if (account.requirements?.currently_due?.length || account.requirements?.past_due?.length) return "needs_reauth";
  return process.env.NODE_ENV === "production" ? "needs_reauth" : "sandbox";
}

export function accountMetadata(account: Stripe.Account, extra: Record<string, unknown> = {}) {
  return {
    stripe_account_id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements_currently_due: account.requirements?.currently_due ?? [],
    requirements_past_due: account.requirements?.past_due ?? [],
    requirements_eventually_due: account.requirements?.eventually_due ?? [],
    disabled_reason: account.requirements?.disabled_reason ?? null,
    dashboard_type: account.controller?.stripe_dashboard?.type ?? "full",
    requirement_collection: account.controller?.requirement_collection ?? "stripe",
    refreshed_at: new Date().toISOString(),
    ...extra,
  };
}

export async function upsertStripeConnection(input: {
  workspaceId: string;
  account: Stripe.Account;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("provider_connections")
    .upsert(
      {
        workspace_id: input.workspaceId,
        provider: "stripe",
        status: connectionStatus(input.account),
        capabilities: ["checkout", "subscriptions", "refunds", "connect_payouts"],
        metadata: accountMetadata(input.account, input.metadata),
        connected_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" }
    );
}
