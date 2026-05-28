import type { PaymentProvider, CheckoutSessionResult, RefundResult } from "./types";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { writeAuditLog } from "@/server/audit/writeAuditLog";
import { emitEvent } from "@/server/events/emitEvent";
import { createAccessGrant } from "@/server/access/createAccessGrant";

export const mockPaymentProvider: PaymentProvider = {
  async createCheckoutSession(input): Promise<CheckoutSessionResult> {
    const intentId = (input.metadata?.intentId as string) || "";
    // Return a local mock completion URL where the client can trigger successful checkout completion
    const mockUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/payments/checkout/mock-complete?order_id=${input.orderId}&intent_id=${intentId}`;
    
    await writeAuditLog({
      workspaceId: input.workspaceId,
      actorType: "system",
      action: "payment.checkout_session_mocked",
      targetType: "order",
      targetId: input.orderId,
      after: { mockUrl, amountCents: input.amountCents },
    });

    return {
      ok: true,
      url: mockUrl,
      checkoutSessionId: `mock_sess_${input.orderId}`,
    };
  },

  async refundPayment(input): Promise<RefundResult> {
    const supabase = await createSupabaseServerClient();
    
    // Simulate updating the order to refunded
    const { error } = await supabase
      .from("orders")
      .update({ status: "refunded", metadata: { refunded_at: new Date().toISOString() } })
      .eq("id", input.orderId)
      .eq("workspace_id", input.workspaceId);

    if (error) {
      return { ok: false, error: error.message };
    }

    await writeAuditLog({
      workspaceId: input.workspaceId,
      actorType: "system",
      action: "payment.refund_mocked",
      targetType: "order",
      targetId: input.orderId,
      after: { refundedAmountCents: input.amountCents },
    });

    await emitEvent({
      type: "payment.refunded",
      workspaceId: input.workspaceId,
      actorType: "system",
      payload: { orderId: input.orderId, amountCents: input.amountCents },
      idempotencyKey: `mock_refund:${input.orderId}`,
    });

    return {
      ok: true,
      refundId: `mock_ref_${input.orderId}`,
    };
  }
};
