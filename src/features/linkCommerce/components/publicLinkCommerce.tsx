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

export type ThemeConfig = {
  bgClass: string;
  bannerClass: string;
  cardClass: string;
  productCardClass: string;
  buttonClass: string;
  textMutedClass: string;
  accentTextClass: string;
  avatarBorderClass: string;
  poweredClass: string;
  isLight: boolean;
};

export function getThemeClasses(mode = "dark", accent = "coral"): ThemeConfig {
  const isLight = mode === "light";
  const isSunset = mode === "sunset";
  const isNeon = mode === "cyber";
  const isGlass = mode === "glass";

  let accentText = "text-rose-300";
  let accentBorder = "hover:border-rose-300/40";
  let productCardBg = "bg-rose-300/10 border-rose-200/20";
  let productText = "text-rose-100";
  let shopLink = "text-rose-200";

  if (accent === "rose") {
    accentText = isLight ? "text-rose-600" : "text-rose-300";
    accentBorder = isLight ? "hover:border-rose-400/40" : "hover:border-rose-300/40";
    productCardBg = isLight ? "bg-rose-50 border-rose-200/80 text-zinc-900" : "bg-rose-300/10 border-rose-200/20";
    productText = isLight ? "text-rose-700 font-bold" : "text-rose-100";
    shopLink = isLight ? "text-rose-600" : "text-rose-200";
  } else if (accent === "emerald") {
    accentText = isLight ? "text-emerald-600" : "text-emerald-300";
    accentBorder = isLight ? "hover:border-emerald-400/40" : "hover:border-emerald-300/40";
    productCardBg = isLight ? "bg-emerald-50/50 border-emerald-200/80 text-zinc-900" : "bg-emerald-300/10 border-emerald-200/20";
    productText = isLight ? "text-emerald-700 font-bold" : "text-emerald-100";
    shopLink = isLight ? "text-emerald-600" : "text-emerald-200";
  } else if (accent === "indigo") {
    accentText = isLight ? "text-indigo-600" : "text-indigo-300";
    accentBorder = isLight ? "hover:border-indigo-400/40" : "hover:border-indigo-300/40";
    productCardBg = isLight ? "bg-indigo-50/50 border-indigo-200/80 text-zinc-900" : "bg-indigo-300/10 border-indigo-200/20";
    productText = isLight ? "text-indigo-700 font-bold" : "text-indigo-100";
    shopLink = isLight ? "text-indigo-600" : "text-indigo-200";
  } else if (accent === "amber") {
    accentText = isLight ? "text-amber-600" : "text-amber-300";
    accentBorder = isLight ? "hover:border-amber-400/40" : "hover:border-amber-300/40";
    productCardBg = isLight ? "bg-amber-50/50 border-amber-200/80 text-zinc-900" : "bg-amber-300/10 border-amber-200/20";
    productText = isLight ? "text-amber-700 font-bold" : "text-amber-100";
    shopLink = isLight ? "text-amber-600" : "text-amber-200";
  } else {
    // coral / default
    accentText = isLight ? "text-orange-600" : "text-orange-300";
    accentBorder = isLight ? "hover:border-orange-400/40" : "hover:border-orange-300/40";
    productCardBg = isLight ? "bg-orange-50/50 border-orange-200/80 text-zinc-900" : "bg-orange-300/10 border-orange-200/20";
    productText = isLight ? "text-orange-700 font-bold" : "text-orange-100";
    shopLink = isLight ? "text-orange-600" : "text-orange-200";
  }

  if (isLight) {
    return {
      bgClass: "min-h-screen bg-slate-50 text-zinc-900 font-sans antialiased",
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-indigo-100/60 via-slate-100 to-emerald-50/40",
      cardClass: "flex items-center justify-between rounded-3xl border border-zinc-200 bg-white p-4 transition shadow-sm hover:-translate-y-0.5 " + accentBorder + " hover:shadow-md text-zinc-900",
      productCardClass: "flex gap-3 rounded-3xl border p-3 shadow-sm hover:shadow-md transition-all " + productCardBg,
      buttonClass: "h-12 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-semibold shadow-sm w-full flex items-center justify-center gap-2",
      textMutedClass: "text-zinc-500 font-medium",
      accentTextClass: accentText,
      avatarBorderClass: "border-white shadow-md ring-4 ring-slate-100",
      poweredClass: "rounded-3xl border border-zinc-200 bg-white p-4 text-center shadow-sm",
      isLight: true
    };
  }

  if (isGlass) {
    return {
      bgClass: "min-h-screen bg-[#090e1a] bg-gradient-to-tr from-[#050811] via-[#0e1628] to-[#050811] text-white font-sans antialiased",
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-tr from-indigo-950/70 via-slate-900/60 to-purple-950/70",
      cardClass: "flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 transition hover:-translate-y-0.5 " + accentBorder + " hover:bg-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.2)] text-white",
      productCardClass: "flex gap-3 rounded-3xl border p-3 backdrop-blur-md hover:bg-white/[0.03] transition-all " + productCardBg + " shadow-[0_4px_30px_rgba(0,0,0,0.2)]",
      buttonClass: "h-12 rounded-2xl bg-white/90 backdrop-blur text-zinc-950 hover:bg-white transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2",
      textMutedClass: "text-zinc-400 font-medium",
      accentTextClass: accentText,
      avatarBorderClass: "border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] ring-4 ring-white/5",
      poweredClass: "rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 text-center",
      isLight: false
    };
  }

  if (isSunset) {
    return {
      bgClass: "min-h-screen bg-gradient-to-b from-[#FFF5F2] via-[#FFFBF9] to-[#FCEEE9] text-[#4A281E] font-sans antialiased",
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-amber-200 via-orange-300 to-rose-400",
      cardClass: "flex items-center justify-between rounded-3xl border border-[#F2D7CE]/70 bg-white/90 backdrop-blur-sm p-4 transition shadow-sm hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md text-[#4A281E]",
      productCardClass: "flex gap-3 rounded-3xl border border-[#ECC0B2]/60 bg-orange-100/30 p-3 hover:bg-orange-100/40 transition-all text-[#4A281E]",
      buttonClass: "h-12 rounded-2xl bg-[#D65D3C] text-white hover:bg-[#B84E30] transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2",
      textMutedClass: "text-[#8E6E64] font-medium",
      accentTextClass: "text-[#D65D3C]",
      avatarBorderClass: "border-[#FFF5F2] shadow-md ring-4 ring-orange-200/50",
      poweredClass: "rounded-3xl border border-[#F2D7CE]/50 bg-white/60 p-4 text-center shadow-sm",
      isLight: true
    };
  }

  if (isNeon) {
    return {
      bgClass: "min-h-screen bg-[#05060b] text-[#D1F3FF] font-mono antialiased",
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-purple-950/60 via-[#0B1530] to-[#0A0D1A]",
      cardClass: "flex items-center justify-between rounded-3xl border border-purple-500/20 bg-[#0B0D19]/80 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] text-[#D1F3FF]",
      productCardClass: "flex gap-3 rounded-3xl border border-purple-500/30 bg-[#0B0D19]/60 p-3 hover:border-cyan-400/40 transition-all text-[#D1F3FF] hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]",
      buttonClass: "h-12 rounded-2xl bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2",
      textMutedClass: "text-purple-400/80",
      accentTextClass: "text-cyan-300 font-bold",
      avatarBorderClass: "border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-4 ring-purple-950/80",
      poweredClass: "rounded-3xl border border-purple-500/20 bg-[#0B0D19]/50 p-4 text-center",
      isLight: false
    };
  }

  // default / dark
  return {
    bgClass: "min-h-screen bg-black text-white font-sans antialiased",
    bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-sky-950 via-zinc-950 to-black",
    cardClass: "flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.08] p-4 transition hover:-translate-y-0.5 " + accentBorder + " hover:bg-white/[0.12] shadow-sm text-white",
    productCardClass: "flex gap-3 rounded-3xl border p-3 hover:bg-white/[0.02] transition-all " + productCardBg,
    buttonClass: "h-12 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 transition-all font-semibold w-full flex items-center justify-center gap-2",
    textMutedClass: "text-zinc-400 font-medium",
    accentTextClass: accentText,
    avatarBorderClass: "border-black shadow-sm",
    poweredClass: "rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center",
    isLight: false
  };
}

export function PublicSmartLinkPage({ data }: { data: PublicData }) {
  const visitorId = useVisitorId();
  const page = data.page;

  useEffect(() => {
    track(data, visitorId, "page.viewed", "creator_page", page.id);
  }, [visitorId]);

  const mode = page.theme?.mode || "dark";
  const accent = page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent);

  return (
    <main className={`relative min-h-screen overflow-hidden ${styling.bgClass}`}>
      {page.background_image_url ? (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-[0.12] pointer-events-none scale-110" 
          style={{ backgroundImage: `url(${page.background_image_url})` }}
        />
      ) : null}
      <section className="relative mx-auto max-w-md px-4 pb-12 z-10">
        <div className={styling.bannerClass}>
          {page.background_image_url ? <img src={page.background_image_url} alt="" className="h-full w-full object-cover opacity-75" /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30" />
        </div>

        <div className="-mt-16 text-center relative z-10">
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" className={`mx-auto h-32 w-32 rounded-full object-cover border-4 ${styling.avatarBorderClass}`} />
          ) : (
            <div className={`mx-auto grid h-32 w-32 place-items-center rounded-full border-4 ${styling.avatarBorderClass} bg-rose-300 text-4xl font-black text-zinc-950`}>
              {(page.display_name ?? "C").slice(0, 1)}
            </div>
          )}
          <h1 className="mt-4 text-4xl font-black tracking-tight">{page.display_name}</h1>
          <p className={`mt-1 text-sm font-bold ${styling.accentTextClass}`}>@{page.username || page.slug}</p>
          <p className={`mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 ${styling.textMutedClass}`}>{page.bio || page.headline}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {data.socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(data, visitorId, "social_link.clicked", "creator_social_link", link.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-1 hover:shadow-md ${
                styling.isLight
                  ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                  : "border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12] hover:border-rose-300/40"
              }`}
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
              className={styling.cardClass}
            >
              <span className="text-left">
                <span className="block text-sm font-black">{link.title}</span>
                {link.description ? <span className={`mt-1 block text-xs ${styling.textMutedClass}`}>{link.description}</span> : null}
              </span>
              <ArrowUpRight className={`h-4 w-4 ${styling.accentTextClass}`} />
            </a>
          ))}
        </div>

        {data.products.filter((product) => product.show_on_bio).length ? (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">Featured products</h2>
              <Link href={`/u/${page.username || page.slug}/shop`} className={`text-xs font-black ${styling.accentTextClass}`}>Shop all</Link>
            </div>
            <div className="space-y-3">
              {data.products.filter((product) => product.show_on_bio).slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/u/${page.username || page.slug}/product/${product.slug}`}
                  onClick={() => track(data, visitorId, "product.clicked", "digital_product", product.id)}
                  className={styling.productCardClass}
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 border border-white/5">
                    {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className={`h-5 w-5 ${styling.accentTextClass}`} />}
                  </div>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-black">{product.title}</span>
                    <span className={`mt-1 line-clamp-2 text-xs ${styling.textMutedClass}`}>{product.description}</span>
                    <span className={`mt-2 block text-sm font-black ${styling.accentTextClass}`}>{money(product.price_cents, product.currency)}</span>
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
              <a key={link.id} href={link.destination_url} onClick={() => track(data, visitorId, "affiliate.clicked", "affiliate_link", link.id)} className={styling.cardClass}>
                <span>
                  <span className="block text-sm font-black">{link.title}</span>
                  <span className={`text-xs ${styling.textMutedClass}`}>{link.commission_note || "Affiliate disclosure available."}</span>
                </span>
                <ExternalLink className={`h-4 w-4 ${styling.accentTextClass}`} />
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-3">
          <Button asChild className={styling.buttonClass}>
            <Link href={`/u/${page.username || page.slug}/contact`}>
              <Mail className="h-4 w-4" /> Contact or brand inquiry
            </Link>
          </Button>
          <div className={styling.poweredClass}>
            <Sparkles className={`mx-auto h-5 w-5 ${styling.accentTextClass}`} />
            <p className={`mt-2 text-xs font-bold ${styling.textMutedClass}`}>Powered by CreatorOS Smart Link</p>
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

  const mode = page.theme?.mode || "dark";
  const accent = page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent);

  return (
    <main className={styling.bgClass}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href={`/u/${page.username || page.slug}`} className={`text-sm font-black ${styling.accentTextClass}`}>
          Back to profile
        </Link>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">{page.display_name} Shop</h1>
            <p className={`mt-2 ${styling.textMutedClass}`}>Digital products, downloads, and creator resources.</p>
          </div>
          <Bot className={`h-8 w-8 ${styling.accentTextClass}`} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/u/${page.username || page.slug}/product/${product.slug}`} className={styling.cardClass + " flex flex-col gap-3"}>
              <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-white/10 border border-white/5">
                {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-zinc-500" />}
              </div>
              <h2 className="mt-4 text-lg font-black text-left w-full">{product.title}</h2>
              <p className={`mt-2 line-clamp-2 text-sm text-left w-full ${styling.textMutedClass}`}>{product.description}</p>
              <p className={`mt-4 text-xl font-black text-left w-full ${styling.accentTextClass}`}>{money(product.price_cents, product.currency)}</p>
            </Link>
          ))}
          {!products.length ? <div className={`rounded-3xl border border-dashed border-zinc-700 p-12 text-center ${styling.textMutedClass} md:col-span-3`}>No products are published yet.</div> : null}
        </div>
      </div>
      <PublicAssistantWidget pageId={page.id} welcomeMessage="Ask me which product is right for you." />
    </main>
  );
}
