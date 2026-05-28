"use client";

import { useState, useTransition } from "react";
import { BookOpen, CalendarClock, Check, LockKeyhole, PackagePlus, Pause, Plus, ShoppingBag, TicketPercent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Offer = {
  id: string;
  workspace_id: string;
  page_id: string | null;
  type: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  status: "draft" | "published" | "paused" | "archived";
};

type Coupon = {
  id: string;
  code: string;
  name: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  status: "active" | "paused" | "archived";
};

const offerTypes = [
  { label: "Products", icon: ShoppingBag, status: "DB-backed offers", type: "product" },
  { label: "Bookings", icon: CalendarClock, status: "Calendar gated", type: "booking" },
  { label: "Memberships", icon: LockKeyhole, status: "Access grants", type: "membership" },
  { label: "Courses", icon: BookOpen, status: "Course records", type: "course" },
  { label: "Bundles", icon: PackagePlus, status: "Bundle offers", type: "bundle" },
];

function formatPrice(offer: Offer) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: offer.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(offer.price_cents / 100);
}

export function OfferStoreClient({
  workspaceId,
  pageId,
  initialOffers,
  initialCoupons,
}: {
  workspaceId: string;
  pageId?: string | null;
  initialOffers: Offer[];
  initialCoupons?: Coupon[];
}) {
  const [offers, setOffers] = useState(initialOffers);
  const [coupons, setCoupons] = useState(initialCoupons ?? []);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function createOffer(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const type = String(formData.get("type") ?? "product");
    const description = String(formData.get("description") ?? "").trim();
    const price = Number.parseFloat(String(formData.get("price") ?? "0"));
    if (!title) return;

    startTransition(async () => {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          pageId: pageId ?? undefined,
          type,
          title,
          description,
          priceCents: Math.max(0, Math.round(price * 100)),
          currency: "usd",
          config: { fulfillment: "manual_until_provider_connected" },
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        setOffers((prev) => [json.data.offer, ...prev]);
        setMessage("Offer draft created.");
      } else {
        setMessage(json?.error?.message ?? "Could not create offer.");
      }
    });
  }

  function createCoupon(formData: FormData) {
    const code = String(formData.get("code") ?? "").trim();
    const discountType = String(formData.get("discountType") ?? "percent");
    const discountValue = Number.parseInt(String(formData.get("discountValue") ?? "10"), 10);
    if (!code) return;

    startTransition(async () => {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          code,
          name: String(formData.get("name") ?? "").trim() || undefined,
          discountType,
          discountValue,
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        setCoupons((prev) => [json.data.coupon, ...prev]);
        setMessage("Coupon created for checkout intents.");
      } else {
        setMessage(json?.error?.message ?? "Could not create coupon.");
      }
    });
  }

  function publishOffer(offer: Offer) {
    startTransition(async () => {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, update: {}, approved: true }),
      });
      const json = await res.json();
      if (json?.ok) {
        setOffers((prev) => prev.map((item) => (item.id === offer.id ? json.data.offer : item)));
        setMessage("Offer published and linked to the public page.");
      } else {
        setMessage(json?.error?.message ?? "Could not publish offer.");
      }
    });
  }

  function updateStatus(offer: Offer, status: "paused" | "archived") {
    startTransition(async () => {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, update: { status }, approved: true }),
      });
      const json = await res.json();
      if (json?.ok) {
        setOffers((prev) => prev.map((item) => (item.id === offer.id ? json.data.offer : item)));
        setMessage(`Offer ${status}. Public block was hidden.`);
      } else {
        setMessage(json?.error?.message ?? "Could not update offer.");
      }
    });
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {offerTypes.map((type) => {
          const Icon = type.icon;
          const count = offers.filter((offer) => offer.type === type.type).length;
          return (
            <Card key={type.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{count} / {type.status}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <form action={createOffer} className="grid gap-4 lg:grid-cols-[1fr_180px_140px_1fr_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="title">Offer title</Label>
              <Input id="title" name="title" placeholder="AI Strategy Call" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select name="type" defaultValue="product">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="bundle">Bundle</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="lead_magnet">Lead magnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price USD</Label>
              <Input id="price" name="price" type="number" min="0" step="1" defaultValue="29" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="What buyers get" />
            </div>
            <Button disabled={isPending}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </form>
          {message ? <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Coupons and access</h2>
              <p className="text-sm text-muted-foreground">Checkout intents can apply coupons and grant gated access after payment or free checkout.</p>
            </div>
            <TicketPercent className="h-5 w-5 text-muted-foreground" />
          </div>
          <form action={createCoupon} className="grid gap-4 md:grid-cols-[1fr_140px_140px_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code">Code</Label>
              <Input id="coupon-code" name="code" placeholder="LAUNCH20" />
            </div>
            <div className="space-y-1.5">
              <Label>Discount</Label>
              <Select name="discountType" defaultValue="percent">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">Value</Label>
              <Input id="discountValue" name="discountValue" type="number" min="0" defaultValue="20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-name">Name</Label>
              <Input id="coupon-name" name="name" placeholder="Launch offer" />
            </div>
            <Button disabled={isPending}>
              <Plus className="h-4 w-4" /> Coupon
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {coupons.map((coupon) => (
              <Badge key={coupon.id} variant="outline">
                {coupon.code} · {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : `$${coupon.discount_value / 100}`}
              </Badge>
            ))}
            {!coupons.length ? <span className="text-sm text-muted-foreground">No coupons yet.</span> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {offers.map((offer) => (
          <Card key={offer.id} className="transition hover:shadow-soft">
            <CardContent className="p-5">
              <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-secondary">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <Badge variant={offer.status === "published" ? "success" : offer.status === "draft" ? "warning" : "secondary"}>{offer.status}</Badge>
              <h2 className="mt-4 font-semibold tracking-tight">{offer.title}</h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{offer.type.replace(/_/g, " ")}</p>
              <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{formatPrice(offer)}</p>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{offer.description || "No description yet."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {offer.status !== "published" ? (
                  <Button size="sm" onClick={() => publishOffer(offer)} disabled={isPending}>
                    <Check className="h-4 w-4" /> Publish
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(offer, "paused")} disabled={isPending}>
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => updateStatus(offer, "archived")} disabled={isPending}>
                  Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!offers.length ? (
          <Card className="md:col-span-2 xl:col-span-4">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No offers yet. Create the first product, booking, membership, or course above.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
