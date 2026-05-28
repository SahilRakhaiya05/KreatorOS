export type CheckoutSessionResult = {
  ok: boolean;
  url?: string;
  checkoutSessionId?: string;
  error?: string;
};

export type RefundResult = {
  ok: boolean;
  refundId?: string;
  error?: string;
};

export interface PaymentProvider {
  createCheckoutSession(input: {
    workspaceId: string;
    offerId: string;
    orderId: string;
    customerId?: string | null;
    amountCents: number;
    currency: string;
    returnUrl?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<CheckoutSessionResult>;

  refundPayment(input: {
    workspaceId: string;
    orderId: string;
    amountCents?: number;
  }): Promise<RefundResult>;
}
