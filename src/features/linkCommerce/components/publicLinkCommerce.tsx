"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, ExternalLink, Mail, ShoppingBag, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicAssistantWidget } from "@/features/assistant/components/publicAssistantWidget";
import { SocialIcon } from "@/components/ui/socialIcon";

type PublicData = {
  page: Record<string, any>;
  socialLinks: Array<Record<string, any>>;
  customLinks: Array<Record<string, any>>;
  gallery: Array<Record<string, any>>;
  contact: Record<string, any> | null;
  products: Array<Record<string, any>>;
  affiliateLinks: Array<Record<string, any>>;
  referralProgram: Record<string, any> | null;
  assistant: Record<string, any> | null;
};

function money(cents = 0, currency = "usd") {
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}

function useVisitorId() {
  const [visitorId, setVisitorId] = useState("anonymous");
  useEffect(() => {
    const key = "kreatoros.link.visitor";
    const existing = window.localStorage.getItem(key);
    if (existing) {
      setVisitorId(existing);
      return;
    }
    const next = crypto.randomUUID();
    window.localStorage.setItem(key, next);
    setVisitorId(next);
  }, []);
  return visitorId;
}

function track(data: PublicData, visitorId: string, eventType: string, refType?: string, refId?: string) {
  fetch("/api/link-commerce/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspaceId: data.page.workspace_id,
      pageId: data.page.id,
      visitorId,
      eventType,
      refType,
      refId,
      source: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
      medium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
      campaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
    }),
  }).catch(() => {});
}

export function PublicSmartLinkPage({ data }: { data: PublicData }) {
  const visitorId = useVisitorId();
  const page = data.page;

  useEffect(() => {
    track(data, visitorId, "page.viewed", "creator_page", page.id);
  }, [visitorId]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-md px-4 pb-12">
        <div className="relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-sky-950 via-zinc-950 to-black">
          {page.background_image_url ? <img src={page.background_image_url} alt="" className="h-full w-full object-cover opacity-75" /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black" />
        </div>

        <div className="-mt-16 text-center">
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" className="mx-auto h-32 w-32 rounded-full border-4 border-black object-cover" />
          ) : (
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border-4 border-black bg-rose-300 text-4xl font-black text-zinc-950">
              {(page.display_name ?? "C").slice(0, 1)}
            </div>
          )}
          <h1 className="mt-4 text-4xl font-black tracking-tight">{page.display_name}</h1>
          <p className="mt-1 text-sm font-bold text-zinc-400">@{page.username || page.slug}</p>
          <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-zinc-300">{page.bio || page.headline}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {data.socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(data, visitorId, "social_link.clicked", "creator_social_link", link.id)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white transition hover:-translate-y-1 hover:border-rose-300/40 hover:bg-white/[0.12] shadow-sm hover:shadow-[0_0_12px_rgba(253,164,186,0.15)]"
              title={link.label || link.platform}
            >
              <SocialIcon platform={link.platform} className="h-5 w-5" />
            </a>
          ))}
        </div>

        <div className="mt-7 space-y-3">
          {data.customLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              onClick={() => track(data, visitorId, "custom_link.clicked", "custom_link", link.id)}
              className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.08] p-4 transition hover:-translate-y-0.5 hover:border-rose-300/40"
            >
              <span className="text-left">
                <span className="block text-sm font-black">{link.title}</span>
                {link.description ? <span className="mt-1 block text-xs font-semibold text-zinc-500">{link.description}</span> : null}
              </span>
              <ArrowUpRight className="h-4 w-4 text-rose-300" />
            </a>
          ))}
        </div>

        {data.products.filter((product) => product.show_on_bio).length ? (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">Featured products</h2>
              <Link href={`/u/${page.username || page.slug}/shop`} className="text-xs font-black text-rose-200">Shop all</Link>
            </div>
            <div className="space-y-3">
              {data.products.filter((product) => product.show_on_bio).slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/u/${page.username || page.slug}/product/${product.slug}`}
                  onClick={() => track(data, visitorId, "product.clicked", "digital_product", product.id)}
                  className="flex gap-3 rounded-3xl border border-rose-200/20 bg-rose-300/10 p-3"
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10">
                    {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-5 w-5 text-rose-100" />}
                  </div>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-black">{product.title}</span>
                    <span className="mt-1 line-clamp-2 text-xs text-zinc-400">{product.description}</span>
                    <span className="mt-2 block text-sm font-black text-rose-100">{money(product.price_cents, product.currency)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {data.affiliateLinks.length ? (
          <div className="mt-8 space-y-3">
            <h2 className="text-xl font-black">Recommended tools</h2>
            {data.affiliateLinks.map((link) => (
              <a key={link.id} href={link.destination_url} onClick={() => track(data, visitorId, "affiliate.clicked", "affiliate_link", link.id)} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.07] p-4">
                <span><span className="block text-sm font-black">{link.title}</span><span className="text-xs text-zinc-500">{link.commission_note || "Affiliate disclosure available."}</span></span>
                <ExternalLink className="h-4 w-4 text-zinc-400" />
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-3">
          <Button asChild className="h-12 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200">
            <Link href={`/u/${page.username || page.slug}/contact`}><Mail className="h-4 w-4" /> Contact or brand inquiry</Link>
          </Button>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-rose-200" />
            <p className="mt-2 text-xs font-bold text-zinc-500">Powered by CreatorOS Smart Link</p>
          </div>
        </div>
      </section>
      <PublicAssistantWidget pageId={page.id} welcomeMessage={data.assistant?.greeting || data.assistant?.welcome_message} />
    </main>
  );
}

export function PublicShopPage({ data }: { data: PublicData }) {
  const visitorId = useVisitorId();
  const page = data.page;
  const products = data.products.filter((product) => product.show_on_shop);

  useEffect(() => {
    track(data, visitorId, "shop.viewed", "creator_page", page.id);
  }, [visitorId]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href={`/u/${page.username || page.slug}`} className="text-sm font-black text-rose-200">Back to profile</Link>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">{page.display_name} Shop</h1>
            <p className="mt-2 text-zinc-400">Digital products, downloads, and creator resources.</p>
          </div>
          <Bot className="h-8 w-8 text-rose-200" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/u/${page.username || page.slug}/product/${product.slug}`} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-1 hover:border-rose-200/40">
              <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-white/10">
                {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-zinc-500" />}
              </div>
              <h2 className="mt-4 text-lg font-black">{product.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{product.description}</p>
              <p className="mt-4 text-xl font-black text-rose-100">{money(product.price_cents, product.currency)}</p>
            </Link>
          ))}
          {!products.length ? <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-zinc-500 md:col-span-3">No products are published yet.</div> : null}
        </div>
      </div>
      <PublicAssistantWidget pageId={page.id} welcomeMessage="Ask me which product is right for you." />
    </main>
  );
}
