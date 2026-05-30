"use client";

import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProductCheckoutButton({
  workspaceId,
  offerId,
}: {
  workspaceId: string;
  offerId?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function startCheckout() {
    if (!offerId) {
      setMessage("This product is missing a checkout offer.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          offerId,
          customer: email ? { email } : undefined,
          returnUrl: window.location.href,
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        if (json.data.checkout?.url) {
          window.location.href = json.data.checkout.url;
          return;
        }
        setMessage(json.data.order?.amount_cents === 0 ? "Access created. Check your email in the customer portal flow." : "Checkout intent created.");
      } else {
        setMessage(json?.error?.message ?? "Checkout could not be started.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email for receipt and access"
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-rose-300/50"
      />
      <Button type="button" onClick={startCheckout} disabled={isPending} className="h-12 w-full rounded-2xl bg-rose-400 text-zinc-950 hover:bg-rose-300">
        <ShoppingBag className="h-4 w-4" /> {isPending ? "Starting..." : "Start checkout"}
      </Button>
      {message ? <p className="text-sm font-semibold text-zinc-400">{message}</p> : null}
    </div>
  );
}
