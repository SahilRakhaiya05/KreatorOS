import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });
}

export function getPlatformFeeAmount(amountCents: number) {
  const bps = Number(process.env.STRIPE_PLATFORM_FEE_BPS ?? 500);
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  return Math.max(0, Math.round((amountCents * bps) / 10000));
}

export function getPlatformFeePercent() {
  const bps = Number(process.env.STRIPE_PLATFORM_FEE_BPS ?? 500);
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  return Number((bps / 100).toFixed(2));
}
