"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Bot, ExternalLink, Mail, ShoppingBag, Sparkles, Calendar, Clock, Video, CheckCircle2, CreditCard, X, Smartphone, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { analyticsEvents, captureClientEvent } from "@/client/posthog/events";
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
  bookings: Array<Record<string, any>>;
  calendarSlots?: Array<Record<string, any>>;
};

function publicDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function publicDateLabel(value: string) {
  return new Date(value).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function publicDateShortLabel(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function publicTimeLabel(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

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
  captureClientEvent(analyticsEvents.publicLinkClicked, {
    event_type: eventType,
    workspace_id: data.page.workspace_id,
    page_id: data.page.id,
    visitor_id: visitorId,
    ref_type: refType,
    ref_id: refId,
  });

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
  accentBgClass: string;
  accentBorderClass: string;
  avatarBorderClass: string;
  poweredClass: string;
  isLight: boolean;
  bgStyle?: React.CSSProperties;
  cardStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
};

export function getThemeClasses(mode = "dark", accent = "coral", customTheme?: any): ThemeConfig {
  const isLight = mode === "light" || (mode === "custom" && (customTheme?.isLight === true || customTheme?.isLight === "true"));
  const isSunset = mode === "sunset";
  const isNeon = mode === "cyber";
  const isGlass = mode === "glass";

  // Base accent calculations
  let accentText = "text-rose-300";
  let accentBg = "bg-rose-400";
  let accentBorder = "hover:border-rose-300/40";
  let productCardBg = "bg-rose-300/10 border-rose-200/20";
  let productText = "text-rose-100";
  let shopLink = "text-rose-200";

  if (accent === "rose") {
    accentText = isLight ? "text-rose-600" : "text-rose-300";
    accentBg = isLight ? "bg-rose-500" : "bg-rose-400";
    accentBorder = isLight ? "hover:border-rose-400/40" : "hover:border-rose-300/40";
    productCardBg = isLight ? "bg-rose-50 border-rose-200/80 text-zinc-900" : "bg-rose-300/10 border-rose-200/20";
    productText = isLight ? "text-rose-700 font-bold" : "text-rose-100";
    shopLink = isLight ? "text-rose-600" : "text-rose-200";
  } else if (accent === "emerald") {
    accentText = isLight ? "text-emerald-600" : "text-emerald-300";
    accentBg = isLight ? "bg-emerald-500" : "bg-emerald-400";
    accentBorder = isLight ? "hover:border-emerald-400/40" : "hover:border-emerald-300/40";
    productCardBg = isLight ? "bg-emerald-50/50 border-emerald-200/80 text-zinc-900" : "bg-emerald-300/10 border-emerald-200/20";
    productText = isLight ? "text-emerald-700 font-bold" : "text-emerald-100";
    shopLink = isLight ? "text-emerald-600" : "text-emerald-200";
  } else if (accent === "indigo") {
    accentText = isLight ? "text-indigo-600" : "text-indigo-300";
    accentBg = isLight ? "bg-indigo-500" : "bg-indigo-400";
    accentBorder = isLight ? "hover:border-indigo-400/40" : "hover:border-indigo-300/40";
    productCardBg = isLight ? "bg-indigo-50/50 border-indigo-200/80 text-zinc-900" : "bg-indigo-300/10 border-indigo-200/20";
    productText = isLight ? "text-indigo-700 font-bold" : "text-indigo-100";
    shopLink = isLight ? "text-indigo-600" : "text-indigo-200";
  } else if (accent === "amber") {
    accentText = isLight ? "text-amber-600" : "text-amber-300";
    accentBg = isLight ? "bg-amber-500" : "bg-amber-400";
    accentBorder = isLight ? "hover:border-amber-400/40" : "hover:border-amber-300/40";
    productCardBg = isLight ? "bg-amber-50/50 border-amber-200/80 text-zinc-900" : "bg-amber-300/10 border-amber-200/20";
    productText = isLight ? "text-amber-700 font-bold" : "text-amber-100";
    shopLink = isLight ? "text-amber-600" : "text-amber-200";
  } else {
    // coral / default
    accentText = isLight ? "text-orange-600" : "text-orange-300";
    accentBg = isLight ? "bg-orange-500" : "bg-orange-400";
    accentBorder = isLight ? "hover:border-orange-400/40" : "hover:border-orange-300/40";
    productCardBg = isLight ? "bg-orange-50/50 border-orange-200/80 text-zinc-900" : "bg-orange-300/10 border-orange-200/20";
    productText = isLight ? "text-orange-700 font-bold" : "text-orange-100";
    shopLink = isLight ? "text-orange-600" : "text-orange-200";
  }

  if (mode === "custom" && customTheme) {
    const bgType = customTheme.bgType || "color";
    const bgStyle: React.CSSProperties = {};
    if (bgType === "gradient" && customTheme.bgGradient) {
      bgStyle.background = customTheme.bgGradient;
    } else {
      bgStyle.backgroundColor = customTheme.bgColor || "#000000";
    }

    const cardStyle: React.CSSProperties = {
      backgroundColor: customTheme.cardBg || "rgba(255,255,255,0.08)",
      borderColor: customTheme.cardBorder || "rgba(255,255,255,0.1)",
      color: customTheme.cardText || "#ffffff",
    };

    const buttonStyle: React.CSSProperties = {
      backgroundColor: customTheme.buttonBg || "#ffffff",
      color: customTheme.buttonText || "#000000",
    };

    const fontClass = customTheme.fontFamily || "font-sans";

    return {
      bgClass: cn("min-h-screen text-white antialiased", fontClass),
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-950 to-black opacity-80",
      cardClass: cn(
        "flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-md border",
        customTheme.buttonRadius || "rounded-3xl"
      ),
      productCardClass: cn(
        "flex gap-3 p-3 transition-all border",
        customTheme.buttonRadius || "rounded-3xl"
      ),
      buttonClass: cn(
        "h-12 transition-all font-semibold w-full flex items-center justify-center gap-2 shadow-sm",
        customTheme.buttonRadius || "rounded-2xl"
      ),
      textMutedClass: isLight ? "text-zinc-500 font-medium" : "text-zinc-400/80 font-medium",
      accentTextClass: cn("font-bold", accentText),
      accentBgClass: accentBg,
      accentBorderClass: accentBorder,
      avatarBorderClass: isLight ? "border-zinc-200/80 shadow-md ring-4 ring-slate-100" : "border-black shadow-sm",
      poweredClass: cn(
        "p-4 text-center border",
        customTheme.buttonRadius || "rounded-3xl"
      ),
      isLight,
      bgStyle,
      cardStyle,
      buttonStyle,
    };
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
      accentBgClass: accentBg,
      accentBorderClass: accentBorder,
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
      accentBgClass: accentBg,
      accentBorderClass: accentBorder,
      avatarBorderClass: "border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] ring-4 ring-white/5",
      poweredClass: "rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 text-center",
      isLight: false
    };
  }

  if (isSunset) {
    let sunsetAccentText = "text-[#D65D3C]";
    let sunsetAccentBg = "bg-[#D65D3C]";
    let sunsetButtonClass = "h-12 rounded-2xl bg-[#D65D3C] text-white hover:bg-[#B84E30] transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2";
    let sunsetCardHoverBorder = "hover:border-orange-400";
    let sunsetAvatarRing = "ring-orange-200/50";

    if (accent === "rose") {
      sunsetAccentText = "text-[#D1475E]";
      sunsetAccentBg = "bg-[#D1475E]";
      sunsetButtonClass = "h-12 rounded-2xl bg-[#D1475E] text-white hover:bg-[#BD354B] transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2";
      sunsetCardHoverBorder = "hover:border-rose-400";
      sunsetAvatarRing = "ring-rose-200/50";
    } else if (accent === "emerald") {
      sunsetAccentText = "text-[#047857]";
      sunsetAccentBg = "bg-[#047857]";
      sunsetButtonClass = "h-12 rounded-2xl bg-[#047857] text-white hover:bg-[#065F46] transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2";
      sunsetCardHoverBorder = "hover:border-emerald-400";
      sunsetAvatarRing = "ring-emerald-200/50";
    } else if (accent === "indigo") {
      sunsetAccentText = "text-[#4F46E5]";
      sunsetAccentBg = "bg-[#4F46E5]";
      sunsetButtonClass = "h-12 rounded-2xl bg-[#4F46E5] text-white hover:bg-[#3730A3] transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2";
      sunsetCardHoverBorder = "hover:border-indigo-400";
      sunsetAvatarRing = "ring-indigo-200/50";
    } else if (accent === "amber") {
      sunsetAccentText = "text-[#B45309]";
      sunsetAccentBg = "bg-[#B45309]";
      sunsetButtonClass = "h-12 rounded-2xl bg-[#B45309] text-white hover:bg-[#92400E] transition-all font-semibold shadow-md w-full flex items-center justify-center gap-2";
      sunsetCardHoverBorder = "hover:border-amber-400";
      sunsetAvatarRing = "ring-amber-200/50";
    }

    return {
      bgClass: "min-h-screen bg-gradient-to-b from-[#FFF5F2] via-[#FFFBF9] to-[#FCEEE9] text-[#4A281E] font-sans antialiased",
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-amber-200 via-orange-300 to-rose-400",
      cardClass: "flex items-center justify-between rounded-3xl border border-[#F2D7CE]/70 bg-white/90 backdrop-blur-sm p-4 transition shadow-sm hover:-translate-y-0.5 " + sunsetCardHoverBorder + " hover:shadow-md text-[#4A281E]",
      productCardClass: "flex gap-3 rounded-3xl border border-[#ECC0B2]/60 bg-orange-100/30 p-3 hover:bg-orange-100/40 transition-all text-[#4A281E]",
      buttonClass: sunsetButtonClass,
      textMutedClass: "text-[#8E6E64] font-medium",
      accentTextClass: sunsetAccentText,
      accentBgClass: sunsetAccentBg,
      accentBorderClass: sunsetCardHoverBorder,
      avatarBorderClass: "border-[#FFF5F2] shadow-md ring-4 " + sunsetAvatarRing,
      poweredClass: "rounded-3xl border border-[#F2D7CE]/50 bg-white/60 p-4 text-center shadow-sm",
      isLight: true
    };
  }

  if (isNeon) {
    let neonAccentText = "text-cyan-300 font-bold";
    let neonAccentBg = "bg-cyan-400";
    let neonButtonClass = "h-12 rounded-2xl bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2";
    let neonCardHoverBorder = "hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]";
    let neonProductCardHover = "hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]";

    if (accent === "rose") {
      neonAccentText = "text-rose-300 font-bold";
      neonAccentBg = "bg-rose-400";
      neonButtonClass = "h-12 rounded-2xl bg-rose-500 text-white hover:bg-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2";
      neonCardHoverBorder = "hover:border-rose-400/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]";
      neonProductCardHover = "hover:border-rose-400/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]";
    } else if (accent === "emerald") {
      neonAccentText = "text-emerald-300 font-bold";
      neonAccentBg = "bg-emerald-400";
      neonButtonClass = "h-12 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2";
      neonCardHoverBorder = "hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]";
      neonProductCardHover = "hover:border-emerald-400/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]";
    } else if (accent === "indigo") {
      neonAccentText = "text-indigo-300 font-bold";
      neonAccentBg = "bg-indigo-400";
      neonButtonClass = "h-12 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2";
      neonCardHoverBorder = "hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]";
      neonProductCardHover = "hover:border-[#6366f1]/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]";
    } else if (accent === "amber") {
      neonAccentText = "text-amber-300 font-bold";
      neonAccentBg = "bg-amber-400";
      neonButtonClass = "h-12 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2";
      neonCardHoverBorder = "hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]";
      neonProductCardHover = "hover:border-amber-400/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]";
    } else if (accent === "coral") {
      neonAccentText = "text-orange-300 font-bold";
      neonAccentBg = "bg-orange-400";
      neonButtonClass = "h-12 rounded-2xl bg-orange-500 text-black hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all font-bold uppercase w-full flex items-center justify-center gap-2";
      neonCardHoverBorder = "hover:border-orange-400/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]";
      neonProductCardHover = "hover:border-orange-400/40 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]";
    }

    return {
      bgClass: "min-h-screen bg-[#05060b] text-[#D1F3FF] font-mono antialiased",
      bannerClass: "relative -mx-4 h-56 overflow-hidden bg-gradient-to-br from-purple-950/60 via-[#0B1530] to-[#0A0D1A]",
      cardClass: "flex items-center justify-between rounded-3xl border border-purple-500/20 bg-[#0B0D19]/80 p-4 transition hover:-translate-y-0.5 " + neonCardHoverBorder + " text-[#D1F3FF]",
      productCardClass: "flex gap-3 rounded-3xl border border-purple-500/30 bg-[#0B0D19]/60 p-3 transition-all text-[#D1F3FF] " + neonProductCardHover,
      buttonClass: neonButtonClass,
      textMutedClass: "text-purple-400/80",
      accentTextClass: neonAccentText,
      accentBgClass: neonAccentBg,
      accentBorderClass: neonCardHoverBorder,
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
    accentBgClass: accentBg,
    accentBorderClass: accentBorder,
    avatarBorderClass: "border-black shadow-sm",
    poweredClass: "rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center",
    isLight: false
  };
}

export function PublicSmartLinkPage({ data }: { data: PublicData }) {
  const visitorId = useVisitorId();
  const page = data.page;
  const searchParams = useSearchParams();
  const linkTheme = searchParams.get("link_theme");
  const queryStr = linkTheme ? `?link_theme=${linkTheme}` : "";

  useEffect(() => {
    track(data, visitorId, "page.viewed", "creator_page", page.id);
  }, [visitorId]);

  // Booking system state hooks
  const [activeBookingModal, setActiveBookingModal] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // stripe payment details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const mode = page.theme?.mode || "dark";
  const accent = page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent, page.theme?.custom);
  const bookingDateGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; shortLabel: string; slots: Array<Record<string, any>> }>();
    for (const slot of data.calendarSlots ?? []) {
      if (slot.status && slot.status !== "available") continue;
      if (!slot.starts_at || new Date(slot.starts_at) < new Date()) continue;
      const key = publicDateKey(slot.starts_at);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: publicDateLabel(slot.starts_at),
          shortLabel: publicDateShortLabel(slot.starts_at),
          slots: [],
        });
      }
      groups.get(key)?.slots.push(slot);
    }
    return [...groups.values()].slice(0, 7);
  }, [data.calendarSlots]);
  const selectedDateGroup = bookingDateGroups.find((group) => group.key === selectedDate) ?? bookingDateGroups[0];
  const selectedBookingDateLabel = selectedDateGroup?.label ?? "Selected date";

  useEffect(() => {
    if (!activeBookingModal) return;
    const firstDate = bookingDateGroups[0];
    setSelectedDate(firstDate?.key ?? "");
    setSelectedTime("");
    setSelectedSlotStartAt("");
  }, [activeBookingModal, bookingDateGroups]);

  return (
    <main className={`relative min-h-screen overflow-hidden ${styling.bgClass}`} style={styling.bgStyle}>
      {page.theme?.custom?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: page.theme.custom.customCss }} />
      )}
      
      {linkTheme && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in duration-300">
          <Link 
            href={`/u/${page.username || page.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-black/80 hover:scale-105 transition-all"
          >
            <span>🏠 View Main Storefront</span>
          </Link>
        </div>
      )}
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
            <div className={`mx-auto grid h-32 w-32 place-items-center rounded-full border-4 ${styling.avatarBorderClass} ${styling.accentBgClass || "bg-rose-300"} text-4xl font-black text-zinc-950`}>
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
                  : `border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12] ${styling.accentBorderClass || "hover:border-rose-300/40"}`
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
              style={styling.cardStyle}
            >
              <span className="text-left">
                <span className="block text-sm font-black">{link.title}</span>
                {link.description ? <span className={`mt-1 block text-xs ${styling.textMutedClass}`}>{link.description}</span> : null}
              </span>
              <ArrowUpRight className={`h-4 w-4 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />
            </a>
          ))}
        </div>

        {data.gallery.length ? (
          <div className="mt-8">
            <h2 className="text-xl font-black mb-3.5">Gallery</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {data.gallery.map((item) => (
                <div
                  key={item.id}
                  className={`group relative aspect-square rounded-3xl overflow-hidden border ${
                    styling.isLight
                      ? "border-zinc-200/80 bg-white shadow-sm"
                      : "border-white/10 bg-white/[0.04] backdrop-blur-md"
                  }`}
                >
                  <img
                    src={item.image_url}
                    alt={item.alt_text ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3.5">
                      <p className="text-xs font-semibold text-white truncate drop-shadow-sm w-full text-left">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data.products.filter((product) => product.show_on_bio).length ? (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">Featured products</h2>
              <Link href={`/u/${page.username || page.slug}/shop${queryStr}`} className={`text-xs font-black ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>Shop all</Link>
            </div>
            <div className="space-y-3">
              {data.products.filter((product) => product.show_on_bio).slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/u/${page.username || page.slug}/product/${product.slug}${queryStr}`}
                  onClick={() => track(data, visitorId, "product.clicked", "digital_product", product.id)}
                  className={styling.productCardClass}
                  style={styling.cardStyle}
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 border border-white/5">
                    {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className={`h-5 w-5 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />}
                  </div>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-black">{product.title}</span>
                    <span className={`mt-1 line-clamp-2 text-xs ${styling.textMutedClass}`}>{product.description}</span>
                    <span className={`mt-2 block text-sm font-black ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>{money(product.price_cents, product.currency)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Booking Sessions Block */}
        <div className="mt-8">
          <h2 className="text-xl font-black mb-3">Book a 1:1 Session</h2>
          <div className="space-y-3">
            {(data.bookings && data.bookings.length > 0 ? data.bookings : [
              {
                id: "strategy-session",
                title: "AI Strategy Session",
                description: "Deep-dive consulting slot. We review your creator goals and set up your automations.",
                price_cents: 4900,
                currency: "usd",
                config: {
                  duration: "30 min",
                  type: "Paid",
                  emailConfirm: true,
                  emailTemplate: "Hey {customer_name}, look forward to our AI Strategy Session! Call coordinates: {meeting_url}.",
                  whatsappConfirm: true,
                  whatsappTemplate: "Hi {customer_name}! Strategy session scheduled on {start_time}."
                }
              },
              {
                id: "discovery-call",
                title: "Brand Discovery Call",
                description: "Introductory slot for sponsorships, partnerships, and retainer planning.",
                price_cents: 0,
                currency: "usd",
                config: {
                  duration: "20 min",
                  type: "Free",
                  emailConfirm: true,
                  emailTemplate: "Confirmed discover call, {customer_name}! Meeting link is: {meeting_url}.",
                  whatsappConfirm: false
                }
              }
            ]).map((offer: any) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => {
                  setActiveBookingModal(offer);
                  setBookingSuccess(false);
                  setSelectedTime("");
                  setGuestName("");
                  setGuestEmail("");
                  setGuestPhone("");
                  setGuestNote("");
                  setCardNumber("");
                  setCardExpiry("");
                  setCardCvc("");
                }}
                className={styling.productCardClass + " w-full flex text-left transition hover:scale-[1.01] hover:shadow-md cursor-pointer duration-300"}
                style={styling.cardStyle}
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 border border-white/5 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex items-center justify-between">
                    <span className="block truncate text-sm font-black text-foreground">{offer.title}</span>
                    <Badge variant="accent" className="text-[8px] uppercase tracking-wider px-1 font-bold">
                      {offer.price_cents > 0 ? "Paid" : "Free"}
                    </Badge>
                  </span>
                  <span className={`mt-1 line-clamp-2 text-xs leading-normal ${styling.textMutedClass}`}>
                    {offer.description || "1:1 video consultation slot synced with calendar."}
                  </span>
                  <span className="mt-2.5 flex items-center gap-3 text-xs font-black">
                    <span className="flex items-center gap-1 text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {offer.config?.duration || "30 min"}
                    </span>
                    <span className={styling.accentTextClass}>
                      {offer.price_cents > 0 ? money(offer.price_cents, offer.currency) : "Free"}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {data.affiliateLinks.length ? (
          <div className="mt-8 space-y-3">
            <h2 className="text-xl font-black">Recommended tools</h2>
            {data.affiliateLinks.map((link) => (
              <a key={link.id} href={link.destination_url} onClick={() => track(data, visitorId, "affiliate.clicked", "affiliate_link", link.id)} className={styling.cardClass} style={styling.cardStyle}>
                <span>
                  <span className="block text-sm font-black">{link.title}</span>
                  <span className={`text-xs ${styling.textMutedClass}`}>{link.commission_note || "Affiliate disclosure available."}</span>
                </span>
                <ExternalLink className={`h-4 w-4 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-3">
          <Button asChild className={styling.buttonClass} style={styling.buttonStyle}>
            <Link href={`/u/${page.username || page.slug}/contact${queryStr}`}>
              <Mail className="h-4 w-4" /> Contact or brand inquiry
            </Link>
          </Button>
          <div className={styling.poweredClass} style={styling.cardStyle}>
            <Sparkles className={`mx-auto h-5 w-5 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />
            <p className={`mt-2 text-xs font-bold ${styling.textMutedClass}`}>Powered by CreatorOS Smart Link</p>
          </div>
        </div>
      </section>

      {/* MODAL POPUP: SCHEDULER & BOOKING INTAKE ENGINE */}
      {activeBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-card flex flex-col justify-between max-h-[90vh]">
            
            {/* Modal Close */}
            <button
              onClick={() => setActiveBookingModal(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {bookingSuccess ? (
              /* SUCCESS STATE SCREEN & TEMPLATE LIVE PREVIEW */
              <div className="space-y-5 py-4 overflow-y-auto pr-1">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-white">Booking Confirmed!</h3>
                  <p className="mt-1 text-xs text-zinc-400 leading-normal">
                    Your appointment has been booked and blocked on {page.display_name}&apos;s calendar.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Meeting Session:</span>
                    <span className="font-bold text-white">{activeBookingModal.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Scheduled Slot:</span>
                    <span className="font-bold text-white font-mono">{selectedBookingDateLabel} @ {selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Video Meeting coordinates:</span>
                    <a 
                      href="https://meet.google.com/hzo-wsjc-pqy" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Video className="h-3.5 w-3.5 shrink-0" /> Join Google Meet
                    </a>
                  </div>
                </div>

                {/* Automation triggers display */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Automation Notifications Dispatch</h4>

                  {/* Resend Email Preview */}
                  {activeBookingModal.config?.emailConfirm !== false && (
                    <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] p-4 text-[11px] leading-relaxed">
                      <div className="flex items-center justify-between text-blue-400 font-bold border-b border-blue-500/10 pb-1.5 mb-2">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Resend SMTP Transactional Dispatch</span>
                        <span>Pre-queued</span>
                      </div>
                      <p className="text-zinc-400"><span className="font-bold text-white">To:</span> {guestEmail}</p>
                      <p className="text-zinc-400 mt-0.5"><span className="font-bold text-white">Subject:</span> Confirmed: {activeBookingModal.title}</p>
                      <p className="text-zinc-300 mt-2 rounded bg-black/40 p-2.5 font-mono text-[10px] border border-white/5 leading-normal">
                        {activeBookingModal.config?.emailTemplate
                          ? activeBookingModal.config.emailTemplate
                              .replace("{customer_name}", guestName)
                              .replace("{event_title}", activeBookingModal.title)
                              .replace("{meeting_url}", "https://meet.google.com/hzo-wsjc-pqy")
                              .replace("{start_time}", `${selectedBookingDateLabel} ${selectedTime}`)
                          : `Hey ${guestName}, look forward to our Strategy Call! Coordinates: https://meet.google.com/hzo-wsjc-pqy.`
                        }
                      </p>
                    </div>
                  )}

                  {/* WhatsApp API Preview */}
                  {activeBookingModal.config?.whatsappConfirm !== false && (
                    <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4 text-[11px] leading-relaxed">
                      <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-emerald-500/10 pb-1.5 mb-2">
                        <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> WhatsApp Business API Dispatch</span>
                        <span>Delivered</span>
                      </div>
                      <p className="text-zinc-400"><span className="font-bold text-white">To:</span> {guestPhone || "+1 (555) 019-2831"}</p>
                      <p className="text-zinc-300 mt-2 rounded bg-black/40 p-2.5 font-mono text-[10px] border border-white/5 leading-normal">
                        {activeBookingModal.config?.whatsappTemplate
                          ? activeBookingModal.config.whatsappTemplate
                              .replace("{customer_name}", guestName)
                              .replace("{event_title}", activeBookingModal.title)
                              .replace("{meeting_url}", "https://meet.google.com/hzo-wsjc-pqy")
                              .replace("{start_time}", `${selectedBookingDateLabel} ${selectedTime}`)
                          : `Hi ${guestName}! Confirmation for ${activeBookingModal.title} on ${selectedBookingDateLabel} @ ${selectedTime}.`
                        }
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => setActiveBookingModal(null)}
                  className="w-full mt-3 h-11 bg-white text-zinc-950 font-bold hover:bg-zinc-200"
                >
                  Done
                </Button>
              </div>
            ) : (
              /* SCHEDULER INTAKE AND MOCK PAYMENT FORM */
              <div className="space-y-4 py-3 overflow-y-auto pr-1">
                <div>
                  <h3 className="text-lg font-black text-white">{activeBookingModal.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">{activeBookingModal.description}</p>
                </div>

                <div className="space-y-3 text-left">
                  {/* Select Date */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">1. Select Call Date</span>
                    {bookingDateGroups.length ? (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {bookingDateGroups.map((group) => (
                          <button
                            key={group.key}
                            type="button"
                            onClick={() => {
                              setSelectedDate(group.key);
                              setSelectedTime("");
                              setSelectedSlotStartAt("");
                            }}
                            className={cn(
                              "h-9 px-3.5 rounded-xl shrink-0 text-xs font-bold border transition-all",
                              selectedDate === group.key
                                ? "bg-primary border-primary text-white"
                                : "bg-white/[0.04] border-white/10 text-zinc-400 hover:bg-white/[0.08]"
                            )}
                          >
                            {group.shortLabel}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-zinc-400">
                        No public booking times are available right now.
                      </div>
                    )}
                  </div>

                  {/* Select Time */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">2. Select Availability Slot</span>
                    {selectedDateGroup?.slots.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedDateGroup.slots.map((slot) => {
                          const label = publicTimeLabel(slot.starts_at);
                          return (
                            <button
                              key={slot.id ?? slot.starts_at}
                              type="button"
                              onClick={() => {
                                setSelectedTime(label);
                                setSelectedSlotStartAt(slot.starts_at);
                              }}
                              className={cn(
                                "h-9 px-3 rounded-xl text-xs font-bold border transition-all",
                                selectedSlotStartAt === slot.starts_at
                                  ? "bg-primary border-primary text-white"
                                  : "bg-white/[0.04] border-white/10 text-zinc-400 hover:bg-white/[0.08]"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs font-semibold text-zinc-400">
                        No open slots on this date.
                      </div>
                    )}
                  </div>

                  {/* Customer details */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">3. Complete Guest Details</span>
                    <div className="grid gap-2">
                      <input 
                        type="text" 
                        value={guestName} 
                        onChange={(e) => setGuestName(e.target.value)} 
                        placeholder="Your full name" 
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white outline-none focus:border-primary/50"
                      />
                      <input 
                        type="email" 
                        value={guestEmail} 
                        onChange={(e) => setGuestEmail(e.target.value)} 
                        placeholder="Your email address" 
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white outline-none focus:border-primary/50"
                      />
                      <input 
                        type="tel" 
                        value={guestPhone} 
                        onChange={(e) => setGuestPhone(e.target.value)} 
                        placeholder="WhatsApp Number (e.g. +1...)" 
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white outline-none focus:border-primary/50"
                      />
                      <textarea 
                        value={guestNote} 
                        onChange={(e) => setGuestNote(e.target.value)} 
                        placeholder="Any goals or prep questions for the call?" 
                        className="min-h-16 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary/50 resize-none font-semibold"
                      />
                    </div>
                  </div>

                  {/* Payment checkout deposit for Paid session */}
                  {activeBookingModal.price_cents > 0 && (
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-zinc-400">Stripe Escrow Deposit:</span>
                        <span className={styling.accentTextClass}>{money(activeBookingModal.price_cents, activeBookingModal.currency)}</span>
                      </div>
                      
                      {/* Premium mock Card input */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 grid gap-3">
                        <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wider text-zinc-400">
                          Credit Card Number
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4242 •••• •••• 4242"
                              maxLength={19}
                              className="h-9 w-full rounded-xl border border-white/10 bg-black/60 px-3 pl-9 text-xs text-white outline-none font-mono focus:border-primary/50"
                            />
                            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          </div>
                        </label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wider text-zinc-400">
                            Expiry
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="h-9 w-full rounded-xl border border-white/10 bg-black/60 px-3 text-xs text-white outline-none font-mono focus:border-primary/50"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wider text-zinc-400">
                            CVC
                            <input
                              type="password"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="•••"
                              maxLength={4}
                              className="h-9 w-full rounded-xl border border-white/10 bg-black/60 px-3 text-xs text-white outline-none font-mono focus:border-primary/50"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Interactive Booking Trigger Button */}
                {/* Interactive Booking Trigger Button */}
                <Button
                  onClick={async () => {
                    if (!selectedSlotStartAt) {
                      alert("Please select a time slot first!");
                      return;
                    }
                    if (!guestName || !guestEmail) {
                      alert("Name and email are required!");
                      return;
                    }
                    
                    setPaymentProcessing(true);
                    try {
                      // 1. Use a real published availability slot from the creator calendar.
                      const startsAt = selectedSlotStartAt;

                      // 2. POST to Hold Slot
                      const holdRes = await fetch("/api/bookings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          workspaceId: data.page.workspace_id,
                          offerId: activeBookingModal.id,
                          startsAt,
                          customer: {
                            email: guestEmail,
                            name: guestName,
                            phone: guestPhone || null,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                          },
                        }),
                      });

                      if (!holdRes.ok) {
                        const holdErr = await holdRes.json();
                        throw new Error(holdErr.message || "Failed to create booking hold.");
                      }

                      const holdData = await holdRes.json();
                      const { booking, confirmed } = holdData.data || holdData;

                      if (confirmed) {
                        // Free session auto-confirmed on server!
                        setBookingSuccess(true);
                        track(data, visitorId, "booking.confirmed", "offer", activeBookingModal.id);
                      } else {
                        // Paid session - initialize checkout intent
                        const checkoutRes = await fetch("/api/payments/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            workspaceId: data.page.workspace_id,
                            offerId: activeBookingModal.id,
                            bookingId: booking.id,
                            customer: {
                              email: guestEmail,
                              name: guestName,
                            },
                            returnUrl: window.location.origin + "/u/" + (data.page.username || data.page.slug),
                          }),
                        });

                        if (!checkoutRes.ok) {
                          const checkErr = await checkoutRes.json();
                          throw new Error(checkErr.message || "Checkout initialization failed.");
                        }

                        const checkoutData = await checkoutRes.json();
                        const { order, intent } = checkoutData.data || checkoutData;

                        // Simulate payment completion via mock checkout
                        const completeRes = await fetch(`/api/payments/checkout/mock-complete?order_id=${order.id}&intent_id=${intent.id}`);
                        if (!completeRes.ok) {
                          const compErr = await completeRes.json();
                          throw new Error(compErr.error || "Mock payment simulation failed.");
                        }

                        setBookingSuccess(true);
                        track(data, visitorId, "booking.confirmed", "offer", activeBookingModal.id);
                      }
                    } catch (err: any) {
                      console.error("[Booking flow error]", err);
                      alert(err.message || "An error occurred while booking. Please try again.");
                    } finally {
                      setPaymentProcessing(false);
                    }
                  }}
                  disabled={paymentProcessing || !selectedSlotStartAt || bookingDateGroups.length === 0}
                  className={cn("mt-2", styling.buttonClass)}
                  style={styling.buttonStyle}
                >
                  {paymentProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-zinc-900" /> 
                      {activeBookingModal.price_cents > 0 ? "Authorizing Stripe Payment..." : "Processing booking..."}
                    </span>
                  ) : (
                    <span>{activeBookingModal.price_cents > 0 ? `Pay ${money(activeBookingModal.price_cents, activeBookingModal.currency)} & Schedule Session` : "Schedule Free Session"}</span>
                  )}
                </Button>
              </div>
            )}

          </div>
        </div>
      )}
      <PublicAssistantWidget pageId={page.id} welcomeMessage={data.assistant?.greeting || data.assistant?.welcome_message} />
    </main>
  );
}

export function PublicShopPage({ data }: { data: PublicData }) {
  const visitorId = useVisitorId();
  const page = data.page;
  const products = data.products.filter((product) => product.show_on_shop);
  const searchParams = useSearchParams();
  const linkTheme = searchParams.get("link_theme");
  const queryStr = linkTheme ? `?link_theme=${linkTheme}` : "";

  useEffect(() => {
    track(data, visitorId, "shop.viewed", "creator_page", page.id);
  }, [visitorId]);

  const mode = page.theme?.mode || "dark";
  const accent = page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent, page.theme?.custom);

  return (
    <main className={styling.bgClass} style={styling.bgStyle}>
      {page.theme?.custom?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: page.theme.custom.customCss }} />
      )}
      
      {linkTheme && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Link 
            href={`/u/${page.username || page.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-black/80 hover:scale-105 transition-all"
          >
            <span>🏠 View Main Storefront</span>
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href={`/u/${page.username || page.slug}${queryStr}`} className={`text-sm font-black ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>
          Back to profile
        </Link>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">{page.display_name} Shop</h1>
            <p className={`mt-2 ${styling.textMutedClass}`}>Digital products, downloads, and creator resources.</p>
          </div>
          <Bot className={`h-8 w-8 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/u/${page.username || page.slug}/product/${product.slug}${queryStr}`} className={styling.cardClass + " flex flex-col gap-3"} style={styling.cardStyle}>
              <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl bg-white/10 border border-white/5">
                {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-zinc-500" />}
              </div>
              <h2 className="mt-4 text-lg font-black text-left w-full">{product.title}</h2>
              <p className={`mt-2 line-clamp-2 text-sm text-left w-full ${styling.textMutedClass}`}>{product.description}</p>
              <p className={`mt-4 text-xl font-black text-left w-full ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>{money(product.price_cents, product.currency)}</p>
            </Link>
          ))}
          {!products.length ? <div className={`rounded-3xl border border-dashed border-zinc-700 p-12 text-center ${styling.textMutedClass} md:col-span-3`}>No products are published yet.</div> : null}
        </div>
      </div>
      <PublicAssistantWidget pageId={page.id} welcomeMessage="Ask me which product is right for you." />
    </main>
  );
}
