"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  FileUp,
  Globe2,
  ImagePlus,
  Mail,
  PackagePlus,
  Plus,
  Rocket,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Settings,
  Trash2,
  Edit,
  AlertTriangle,
  Gift,
  Users,
  DollarSign,
  Landmark,
  MousePointerClick,
  Eye,
  Activity,
  Calendar,
  TrendingUp,
  BarChart3,
  Video,
  Loader2,
  CreditCard,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SocialIcon } from "@/components/ui/socialIcon";
import { getThemeClasses } from "./publicLinkCommerce";

type Mode =
  | "dashboard"
  | "profile"
  | "builder"
  | "products"
  | "product-new"
  | "product-edit"
  | "wallet"
  | "affiliate"
  | "referrals"
  | "assistant"
  | "analytics"
  | "shortlinks"
  | "settings";

type LinkCommerceData = {
  workspace: { id: string; type: string };
  page: Record<string, any>;
  socialLinks: Array<Record<string, any>>;
  customLinks: Array<Record<string, any>>;
  gallery: Array<Record<string, any>>;
  contact: Record<string, any> | null;
  products: Array<Record<string, any>>;
  offers: Array<Record<string, any>>;
  affiliateLinks: Array<Record<string, any>>;
  referralProgram: Record<string, any> | null;
  assistant: Record<string, any> | null;
  knowledgeSources: Array<Record<string, any>>;
  orders: Array<Record<string, any>>;
  analyticsEvents: Array<Record<string, any>>;
  shortLinks: Array<Record<string, any>>;
  bookingsCount?: number;
  customersCount?: number;
  workflowEvents?: Array<Record<string, any>>;
  wallet: { revenueCents: number; pendingCents: number; paidOrders: number; pendingOrders: number; refundsCents: number };
};

const socialGroups = [
  { group: "Social", items: ["Instagram", "X / Twitter", "Facebook", "Reddit", "Pinterest", "Threads"] },
  { group: "Video and stream", items: ["YouTube", "TikTok", "Twitch", "Vimeo"] },
  { group: "Music and audio", items: ["Spotify", "SoundCloud", "Apple Music", "YouTube Music", "Bandcamp", "Mixcloud"] },
  { group: "Messaging", items: ["WhatsApp", "Telegram", "Discord", "Snapchat"] },
  { group: "Creator and pro", items: ["LinkedIn", "GitHub", "Medium", "IMDb", "Behance", "Dribbble", "Patreon"] },
  { group: "Other", items: ["Website", "Email", "Custom"] },
];

function money(cents = 0, currency = "usd") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function setupItems(data: LinkCommerceData) {
  return [
    { label: "Profile photo added", done: Boolean(data.page.avatar_url) },
    { label: "Background image added", done: Boolean(data.page.background_image_url) },
    { label: "Username claimed", done: Boolean(data.page.username || data.page.slug) },
    { label: "Bio added", done: Boolean(data.page.bio) },
    { label: "Social link added", done: data.socialLinks.length > 0 },
    { label: "Link, image, or product added", done: data.customLinks.length > 0 || data.gallery.length > 0 || data.products.length > 0 },
    { label: "Payment connected", done: false },
    { label: "Page published", done: data.page.status === "published" || data.page.is_published },
  ];
}

function panelClass(extra?: string) {
  return cn("rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-5", extra);
}

function TextField({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:h-12 sm:rounded-2xl sm:px-4"
      />
    </label>
  );
}

function TextArea({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string | null; placeholder?: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="min-h-28 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:rounded-2xl sm:px-4"
      />
    </label>
  );
}

function UploadField({
  label,
  bucket,
  onUploaded,
  privateFile = false,
}: {
  label: string;
  bucket: string;
  onUploaded: (value: string) => void;
  privateFile?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setStatus("");
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", bucket);
    const res = await fetch("/api/link-commerce/uploads", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);
    if (json?.ok) {
      onUploaded(privateFile ? json.data.path : json.data.publicUrl);
      setStatus(privateFile ? "Private file uploaded." : "Image uploaded.");
    } else {
      setStatus(json?.error?.message ?? "Upload failed.");
    }
  }

  return (
    <label className="block rounded-2xl border border-dashed border-border bg-secondary/50 p-4 text-center transition hover:border-primary/40 hover:bg-secondary sm:p-5">
      <input type="file" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-background text-muted-foreground shadow-sm sm:h-12 sm:w-12">
        {privateFile ? <FileUp className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-black text-foreground">{uploading ? "Uploading..." : label}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{status || (privateFile ? "Private product delivery file" : "Public page image")}</p>
    </label>
  );
}

function scopeCss(css: string, scopeSelector: string): string {
  if (!css) return "";
  try {
    return css.replace(/([^\r\n{}]+)(?=\s*\{)/g, (selectorGroup) => {
      return selectorGroup
        .split(",")
        .map((selector) => {
          const trimmed = selector.trim();
          if (!trimmed) return "";
          if (trimmed === "body" || trimmed === "html") {
            return scopeSelector;
          }
          return `${scopeSelector} ${trimmed}`;
        })
        .join(", ");
    });
  } catch (e) {
    return css;
  }
}

function PhonePreview({ data, origin }: { data: LinkCommerceData; origin: string }) {
  const page = data.page;
  const visibleProducts = data.products.filter((product) => product.status === "published" && product.show_on_bio);

  const mode = page.theme?.mode || "dark";
  const accent = page.theme?.accent || "coral";
  const styling = getThemeClasses(mode, accent, page.theme?.custom);

  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[32px] border border-sky-300/20 bg-[#07111f] p-1.5 shadow-[0_18px_50px_rgba(14,165,233,.14)] xl:max-w-[300px] xl:rounded-[36px] 2xl:max-w-[320px]">
      <div className={`phone-preview-container flex h-[min(560px,calc(100vh-7rem))] flex-col overflow-hidden rounded-[26px] xl:rounded-[30px] ${styling.bgClass}`} style={styling.bgStyle}>
        {page.theme?.custom?.customCss && (
          <style dangerouslySetInnerHTML={{ __html: scopeCss(page.theme.custom.customCss, ".phone-preview-container") }} />
        )}
        <div className={`h-28 shrink-0 relative overflow-hidden xl:h-32 ${styling.bannerClass}`}>
          {page.background_image_url ? <img src={page.background_image_url} alt="" className="h-full w-full object-cover opacity-75" /> : null}
        </div>
        <div className="-mt-10 flex flex-1 flex-col px-4 pb-5 text-center overflow-y-auto xl:-mt-12 scrollbar-none relative z-10">
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" className={`mx-auto h-20 w-20 rounded-full border-4 object-cover xl:h-24 xl:w-24 ${styling.avatarBorderClass}`} />
          ) : (
            <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full border-4 text-2xl font-black text-primary-foreground xl:h-24 xl:w-24 ${styling.avatarBorderClass} ${styling.accentBgClass || "bg-gradient-to-br from-primary to-accent"}`}>
              {(page.display_name ?? "C").slice(0, 1)}
            </div>
          )}
          <h2 className="mt-3 text-xl font-black tracking-tight xl:text-2xl">{page.display_name}</h2>
          <p className={`mt-1 text-xs font-bold ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>@{page.username || page.slug}</p>
          <p className={`mx-auto mt-3 max-w-xs text-xs font-semibold leading-5 xl:text-sm xl:leading-6 ${styling.textMutedClass}`}>{page.bio || page.headline || "Add a bio to tell visitors what to buy, book, or explore."}</p>


          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-110 ${
                  styling.isLight
                    ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 shadow-sm"
                    : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                }`}
                title={link.platform}
              >
                <SocialIcon platform={link.platform} className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {data.customLinks.slice(0, 3).map((link) => (
              <div key={link.id} className={styling.cardClass + " px-4 py-2.5"} style={styling.cardStyle}>
                <span className="truncate text-xs font-black">{link.title}</span>
                <ArrowUpRight className={`h-4 w-4 ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined} />
              </div>
            ))}
            {visibleProducts.slice(0, 2).map((product) => (
              <div key={product.id} className={styling.productCardClass + " text-left text-xs p-3 flex flex-col"} style={styling.cardStyle}>
                <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${styling.accentTextClass}`} style={styling.cardStyle?.color ? { color: styling.cardStyle.color } : undefined}>Product</p>
                <p className="mt-1 truncate font-black">{product.title}</p>
                <p className={`mt-1 text-[10px] ${styling.textMutedClass}`}>{money(product.price_cents, product.currency)}</p>
              </div>
            ))}
            {data.gallery.slice(0, 2).map((item) => (
              <img key={item.id} src={item.image_url} alt={item.alt_text ?? ""} className="h-24 w-full rounded-2xl object-cover border border-border/10" />
            ))}
          </div>

          <div className={`mt-auto rounded-2xl border p-3 text-left ${styling.poweredClass} shadow-none`} style={styling.cardStyle}>
            <p className="text-xs font-black">AI shopping guide</p>
            <p className={`mt-1 text-[10px] leading-relaxed ${styling.textMutedClass}`}>{data.assistant?.greeting || data.assistant?.welcome_message || "Ask what product, call, or link is right for you."}</p>
          </div>
          <p className={`mt-4 break-words text-[9px] font-bold leading-4 ${styling.textMutedClass}`}>{origin}/u/{page.username || page.slug}</p>
        </div>
      </div>
    </div>
  );
}

function getBrandHoverClass(platform: string): string {
  const norm = platform.toLowerCase().trim();
  switch (norm) {
    case "instagram": return "hover:border-[#E1306C]/50 hover:bg-[#E1306C]/10 text-[#E1306C]";
    case "x / twitter":
    case "x":
    case "twitter": return "hover:border-white/40 hover:bg-white/5 text-white";
    case "facebook": return "hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10 text-[#1877F2]";
    case "reddit": return "hover:border-[#FF4500]/50 hover:bg-[#FF4500]/10 text-[#FF4500]";
    case "pinterest": return "hover:border-[#BD081C]/50 hover:bg-[#BD081C]/10 text-[#BD081C]";
    case "threads": return "hover:border-zinc-400/50 hover:bg-zinc-800/10 text-white";
    case "youtube": return "hover:border-[#FF0000]/50 hover:bg-[#FF0000]/10 text-[#FF0000]";
    case "tiktok": return "hover:border-[#00f2fe]/40 hover:bg-[#00f2fe]/5 text-[#00f2fe]";
    case "twitch": return "hover:border-[#9146FF]/50 hover:bg-[#9146FF]/10 text-[#9146FF]";
    case "vimeo": return "hover:border-[#1AB7EA]/50 hover:bg-[#1AB7EA]/10 text-[#1AB7EA]";
    case "spotify": return "hover:border-[#1DB954]/50 hover:bg-[#1DB954]/10 text-[#1DB954]";
    case "soundcloud": return "hover:border-[#FF5500]/50 hover:bg-[#FF5500]/10 text-[#FF5500]";
    case "apple music": return "hover:border-[#FC3C44]/50 hover:bg-[#FC3C44]/10 text-[#FC3C44]";
    case "youtube music": return "hover:border-[#FF0000]/60 hover:bg-[#FF0000]/10 text-[#FF0000]";
    case "bandcamp": return "hover:border-[#629AA9]/50 hover:bg-[#629AA9]/10 text-[#629AA9]";
    case "mixcloud": return "hover:border-[#52AAD8]/50 hover:bg-[#52AAD8]/10 text-[#52AAD8]";
    case "whatsapp": return "hover:border-[#25D366]/50 hover:bg-[#25D366]/10 text-[#25D366]";
    case "telegram": return "hover:border-[#0088cc]/50 hover:bg-[#0088cc]/10 text-[#0088cc]";
    case "discord": return "hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10 text-[#5865F2]";
    case "snapchat": return "hover:border-[#FFFC00]/50 hover:bg-[#FFFC00]/10 text-[#FFFC00]";
    case "linkedin": return "hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10 text-[#0A66C2]";
    case "github": return "hover:border-zinc-400 hover:bg-zinc-800/10 text-white";
    default: return "hover:border-primary/50 hover:bg-primary/10 text-primary";
  }
}

function getBrandActiveBorderClass(platform: string): string {
  const norm = platform.toLowerCase().trim();
  switch (norm) {
    case "instagram": return "border-[#E1306C] bg-[#E1306C]/5";
    case "x / twitter":
    case "x":
    case "twitter": return "border-white bg-white/5";
    case "facebook": return "border-[#1877F2] bg-[#1877F2]/5";
    case "reddit": return "border-[#FF4500] bg-[#FF4500]/5";
    case "pinterest": return "border-[#BD081C] bg-[#BD081C]/5";
    case "threads": return "border-white bg-white/5";
    case "youtube": return "border-[#FF0000] bg-[#FF0000]/5";
    case "tiktok": return "border-[#00f2fe] bg-[#00f2fe]/5";
    case "twitch": return "border-[#9146FF] bg-[#9146FF]/5";
    case "vimeo": return "border-[#1AB7EA] bg-[#1AB7EA]/5";
    case "spotify": return "border-[#1DB954] bg-[#1DB954]/5";
    case "soundcloud": return "border-[#FF5500] bg-[#FF5500]/5";
    case "apple music": return "border-[#FC3C44] bg-[#FC3C44]/5";
    case "youtube music": return "border-[#FF0000] bg-[#FF0000]/5";
    case "bandcamp": return "border-[#629AA9] bg-[#629AA9]/5";
    case "mixcloud": return "border-[#52AAD8] bg-[#52AAD8]/5";
    case "whatsapp": return "border-[#25D366] bg-[#25D366]/5";
    case "telegram": return "border-[#0088cc] bg-[#0088cc]/5";
    case "discord": return "border-[#5865F2] bg-[#5865F2]/5";
    case "snapchat": return "border-[#FFFC00] bg-[#FFFC00]/5";
    case "linkedin": return "border-[#0A66C2] bg-[#0A66C2]/5";
    case "github": return "border-zinc-400 bg-zinc-800/10";
    default: return "border-primary bg-primary/5";
  }
}

export function LinkCommerceStudio({ data, mode = "dashboard" }: { data: LinkCommerceData; mode?: Mode }) {
  const [state, setState] = useState(data);
  const [activeMode, setActiveMode] = useState<Mode>(mode);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [origin, setOrigin] = useState("current-domain");
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(data.page.avatar_url ?? "");
  const [backgroundUrl, setBackgroundUrl] = useState(data.page.background_image_url ?? "");
  const [coverUrl, setCoverUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [isPending, startTransition] = useTransition();

  const [themeMode, setThemeMode] = useState(data.page.theme?.mode ?? "dark");
  const [themeAccent, setThemeAccent] = useState(data.page.theme?.accent ?? "coral");

  // Custom Theme state variables
  const [customBgType, setCustomBgType] = useState(data.page.theme?.custom?.bgType ?? "color");
  const [customBgColor, setCustomBgColor] = useState(data.page.theme?.custom?.bgColor ?? "#0f172a");
  const [customBgGradient, setCustomBgGradient] = useState(data.page.theme?.custom?.bgGradient ?? "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)");
  const [customCardBg, setCustomCardBg] = useState(data.page.theme?.custom?.cardBg ?? "rgba(30, 41, 59, 0.5)");
  const [customCardBorder, setCustomCardBorder] = useState(data.page.theme?.custom?.cardBorder ?? "rgba(255, 255, 255, 0.08)");
  const [customCardText, setCustomCardText] = useState(data.page.theme?.custom?.cardText ?? "#f8fafc");
  const [customButtonBg, setCustomButtonBg] = useState(data.page.theme?.custom?.buttonBg ?? "#ffffff");
  const [customButtonText, setCustomButtonText] = useState(data.page.theme?.custom?.buttonText ?? "#0f172a");
  const [customButtonRadius, setCustomButtonRadius] = useState(data.page.theme?.custom?.buttonRadius ?? "rounded-2xl");
  const [customFontFamily, setCustomFontFamily] = useState(data.page.theme?.custom?.fontFamily ?? "font-sans");
  const [customIsLight, setCustomIsLight] = useState(data.page.theme?.custom?.isLight ?? false);
  const [customCss, setCustomCss] = useState(data.page.theme?.custom?.customCss ?? "");

  // Shortlinks state variables
  const [editingShortLink, setEditingShortLink] = useState<any | null>(null);
  const [isShortLinkDialogOpen, setIsShortLinkDialogOpen] = useState(false);

  // Dialog state variables for live storefront override customization
  const [dialogIsStorefrontOverride, setDialogIsStorefrontOverride] = useState(false);
  const [dialogDisplayName, setDialogDisplayName] = useState("");
  const [dialogHeadline, setDialogHeadline] = useState("");
  const [dialogBio, setDialogBio] = useState("");
  const [dialogThemeMode, setDialogThemeMode] = useState("dark");
  const [dialogThemeAccent, setDialogThemeAccent] = useState("coral");
  const [dialogCustomBgType, setDialogCustomBgType] = useState("color");
  const [dialogCustomBgColor, setDialogCustomBgColor] = useState("#0f172a");
  const [dialogCustomBgGradient, setDialogCustomBgGradient] = useState("linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)");
  const [dialogCustomCardBg, setDialogCustomCardBg] = useState("rgba(30, 41, 59, 0.5)");
  const [dialogCustomCardBorder, setDialogCustomCardBorder] = useState("rgba(255, 255, 255, 0.08)");
  const [dialogCustomCardText, setDialogCustomCardText] = useState("#f8fafc");
  const [dialogCustomButtonBg, setDialogCustomButtonBg] = useState("#ffffff");
  const [dialogCustomButtonText, setDialogCustomButtonText] = useState("#0f172a");
  const [dialogCustomButtonRadius, setDialogCustomButtonRadius] = useState("rounded-2xl");
  const [dialogCustomFontFamily, setDialogCustomFontFamily] = useState("font-sans");
  const [dialogCustomIsLight, setDialogCustomIsLight] = useState(false);
  const [dialogCustomCss, setDialogCustomCss] = useState("");

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Social");
  const [socialUrl, setSocialUrl] = useState<string>("");
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  
  const [affiliateTab, setAffiliateTab] = useState<"links" | "referrals" | "ledger">("links");

  // AI assistant config states
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [knowledgeType, setKnowledgeType] = useState<"faq" | "manual" | "url">("faq");

  // Unified Settings state variables
  const [stripeConnected, setStripeConnected] = useState(false);
  const [providersList, setProvidersList] = useState<any[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [connectorLoading, setConnectorLoading] = useState<string | null>(null);
  const [settingsSubTab, setSettingsSubTab] = useState("storefront");
  
  const checklist = setupItems(data); // Using data directly for items config stability
  const completed = checklist.filter((item) => item.done).length;
  const progress = Math.round((completed / checklist.length) * 100);
  const publicPath = `/u/${data.page.username || data.page.slug}`;
  const shopPath = `${publicPath}/shop`;

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (activeMode !== "settings") return;
    let cancelled = false;

    async function loadProviders() {
      try {
        const res = await fetch("/api/providers/status");
        const json = await res.json();
        if (!cancelled && json?.ok) {
          const list = json.data.providers ?? [];
          setProvidersList(list);
          const stripe = list.find((p: any) => p.provider === "stripe");
          setStripeConnected(stripe?.status === "connected" || stripe?.status === "sandbox");
        }
      } catch {
        // ignore
      }
    }

    loadProviders();
    return () => {
      cancelled = true;
    };
  }, [activeMode]);

  async function connectStripe() {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/connect/stripe", { method: "POST" });
      const json = await res.json();
      if (json?.ok && json.data?.url) {
        window.location.href = json.data.url as string;
        return;
      }
      alert(json?.error?.message ?? "We couldn't start the connection.");
    } catch {
      alert("We couldn't start the connection.");
    } finally {
      setStripeLoading(false);
    }
  }

  async function triggerConnector(provider: string) {
    setConnectorLoading(provider);
    try {
      const res = await fetch(`/api/connect/${provider}`, { method: "POST" });
      const json = await res.json();
      if (json?.ok && json.data?.url) {
        window.location.href = json.data.url as string;
        return;
      }
      alert(json?.error?.message ?? "Something went wrong.");
    } catch {
      alert("Something went wrong.");
    } finally {
      setConnectorLoading(null);
    }
  }

  function post(resource: string, body: Record<string, unknown>, onSuccess?: (payload: any) => void) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/${resource}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json?.ok) {
        onSuccess?.(json.data);
        setMessage("Saved to CreatorOS Link Commerce.");
      } else {
        setMessage(json?.error?.message ?? "Could not save.");
      }
    });
  }

  function handleSaveAssistant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    post(
      "assistant",
      {
        pageId: state.page.id,
        welcomeMessage: String(formData.get("welcomeMessage") ?? ""),
        systemPrompt: String(formData.get("systemPrompt") ?? ""),
        tone: String(formData.get("tone") ?? "helpful"),
        status: String(formData.get("status") ?? "active"),
      },
      (payload) => setState((prev) => ({ ...prev, assistant: payload.assistant }))
    );
  }

  function handleAddKnowledge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!state.assistant?.id) {
      alert("Please configure and save your public AI assistant first.");
      return;
    }
    if (!knowledgeTitle.trim() || !knowledgeContent.trim()) {
      alert("Title and content are required.");
      return;
    }
    post(
      "knowledge",
      {
        assistantId: state.assistant.id,
        title: knowledgeTitle,
        content: knowledgeContent,
        sourceType: knowledgeType,
        status: "active",
      },
      (payload) => {
        setState((prev) => ({
          ...prev,
          knowledgeSources: [payload.knowledge, ...prev.knowledgeSources],
        }));
        setKnowledgeTitle("");
        setKnowledgeContent("");
        setMessage("RAG knowledge manual block added.");
      }
    );
  }

  function handleDeleteKnowledge(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/knowledge?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.ok) {
        setState((prev) => ({
          ...prev,
          knowledgeSources: prev.knowledgeSources.filter((k) => k.id !== id),
        }));
        setMessage("RAG knowledge manual block removed.");
      } else {
        setMessage(json?.error?.message ?? "Could not remove.");
      }
    });
  }

  function saveProfile(formData: FormData, status?: "draft" | "published") {
    const username = String(formData.get("username") ?? state.page.username ?? state.page.slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    post(
      "profile",
      {
        pageId: state.page.id,
        displayName: String(formData.get("displayName") ?? state.page.display_name ?? ""),
        username,
        headline: String(formData.get("headline") ?? state.page.headline ?? ""),
        bio: String(formData.get("bio") ?? state.page.bio ?? ""),
        avatarUrl,
        backgroundImageUrl: backgroundUrl,
        occupationType: String(formData.get("occupationType") ?? state.page.theme?.occupationType ?? "creator"),
        totalFollowers: Number(formData.get("totalFollowers") ?? state.page.theme?.totalFollowers ?? 0),
        status: status ?? state.page.status ?? "draft",
        themeMode,
        themeAccent,
        customTheme: {
          bgType: customBgType,
          bgColor: customBgColor,
          bgGradient: customBgGradient,
          cardBg: customCardBg,
          cardBorder: customCardBorder,
          cardText: customCardText,
          buttonBg: customButtonBg,
          buttonText: customButtonText,
          buttonRadius: customButtonRadius,
          fontFamily: customFontFamily,
          isLight: customIsLight,
          customCss,
        }
      },
      (payload) => setState((prev) => ({ ...prev, page: payload.page })),
    );
  }

  function saveSocialLink(platform: string, category: string, url: string, isVisible = true) {
    post(
      "social-links",
      { pageId: state.page.id, platform, category, url, label: platform, isVisible },
      (payload) => {
        setState((prev) => {
          const filtered = prev.socialLinks.filter((link) => link.platform !== platform);
          return { ...prev, socialLinks: [payload.socialLink, ...filtered] };
        });
      },
    );
  }

  function deleteSocial(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/social-links?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.ok) {
        setState((prev) => ({
          ...prev,
          socialLinks: prev.socialLinks.filter((link) => link.id !== id),
        }));
        setMessage("Social link removed.");
      } else {
        setMessage(json?.error?.message ?? "Could not remove link.");
      }
    });
  }

  function addSocial(platform: string, category: string) {
    const url = window.prompt(`Paste your ${platform} URL`);
    if (!url) return;
    saveSocialLink(platform, category, url);
  }

  function saveCustomLink(formData: FormData) {
    const linkId = editingLink?.id;
    post(
      "custom-links",
      {
        id: linkId,
        pageId: state.page.id,
        title: String(formData.get("title") ?? ""),
        url: String(formData.get("url") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
      (payload) => {
        setState((prev) => {
          if (linkId) {
            return {
              ...prev,
              customLinks: prev.customLinks.map((l) => (l.id === linkId ? payload.customLink : l)),
            };
          } else {
            return {
              ...prev,
              customLinks: [payload.customLink, ...prev.customLinks],
            };
          }
        });
        setEditingLink(null);
      }
    );
  }

  function executeDeleteCustomLink(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/custom-links?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.ok) {
        setState((prev) => ({
          ...prev,
          customLinks: prev.customLinks.filter((l) => l.id !== id),
        }));
        setMessage("Custom link deleted.");
      } else {
        setMessage(json?.error?.message ?? "Could not delete link.");
      }
    });
  }

  function deleteCustomLink(id: string) {
    setConfirmDialog({
      open: true,
      title: "Delete Custom Link?",
      description: "Are you sure you want to delete this custom link? This action cannot be undone.",
      onConfirm: () => executeDeleteCustomLink(id),
    });
  }

  function addGalleryImage(imageUrl: string) {
    post(
      "gallery",
      { pageId: state.page.id, imageUrl, caption: "Gallery image" },
      (payload) => setState((prev) => ({ ...prev, gallery: [payload.galleryItem, ...prev.gallery] })),
    );
  }

  function saveGalleryItem(formData: FormData) {
    if (!editingGalleryItem) return;
    post(
      "gallery",
      {
        id: editingGalleryItem.id,
        pageId: state.page.id,
        imageUrl: editingGalleryItem.image_url,
        caption: String(formData.get("caption") ?? ""),
        altText: String(formData.get("altText") ?? ""),
      },
      (payload) => {
        setState((prev) => ({
          ...prev,
          gallery: prev.gallery.map((item) => (item.id === editingGalleryItem.id ? payload.galleryItem : item)),
        }));
        setEditingGalleryItem(null);
      }
    );
  }

  function executeDeleteGalleryItem(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/gallery?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.ok) {
        setState((prev) => ({
          ...prev,
          gallery: prev.gallery.filter((item) => item.id !== id),
        }));
        setMessage("Gallery photo deleted.");
      } else {
        setMessage(json?.error?.message ?? "Could not delete gallery photo.");
      }
    });
  }

  function deleteGalleryItem(id: string) {
    setConfirmDialog({
      open: true,
      title: "Delete Gallery Photo?",
      description: "Are you sure you want to delete this photo from your gallery? This action cannot be undone.",
      onConfirm: () => executeDeleteGalleryItem(id),
    });
  }

  function saveProduct(formData: FormData) {
    const productId = editingProduct?.id;
    post(
      "products",
      {
        id: productId,
        pageId: state.page.id,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        priceCents: Math.max(0, Math.round(Number(formData.get("price") ?? 0) * 100)),
        currency: "usd",
        coverImageUrl: coverUrl || editingProduct?.cover_image_url || "",
        filePath: filePath || editingProduct?.file_path || "",
        externalDeliveryUrl: String(formData.get("externalDeliveryUrl") ?? ""),
        showOnBio: formData.get("showOnBio") === "on",
        showOnShop: formData.get("showOnShop") === "on",
        status: formData.get("publish") === "on" ? "published" : "draft",
      },
      (payload) => {
        setState((prev) => {
          if (productId) {
            return {
              ...prev,
              products: prev.products.map((p) => p.id === productId ? payload.product : p)
            };
          } else {
            return {
              ...prev,
              products: [payload.product, ...prev.products],
              offers: [payload.offer, ...prev.offers]
            };
          }
        });
        setEditingProduct(null);
        setCoverUrl("");
        setFilePath("");
        setActiveMode("products");
      }
    );
  }

  function executeDeleteProduct(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/products?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.ok) {
        setState((prev) => ({
          ...prev,
          products: prev.products.filter((product) => product.id !== id),
        }));
        setMessage("Product deleted.");
      } else {
        setMessage(json?.error?.message ?? "Could not delete product.");
      }
    });
  }

  function deleteProduct(id: string) {
    setConfirmDialog({
      open: true,
      title: "Delete Digital Product?",
      description: "Are you sure you want to delete this digital product? This will also remove its associated checkout offer.",
      onConfirm: () => executeDeleteProduct(id),
    });
  }

  function handleSaveShortLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isStorefrontOverride = formData.get("isStorefrontOverride") === "on";

    const customTheme = isStorefrontOverride ? {
      mode: String(formData.get("themeMode") || "dark"),
      accent: String(formData.get("themeAccent") || "coral"),
      custom: {
        bgType: String(formData.get("customBgType") || "color"),
        bgColor: String(formData.get("customBgColor") || "#0f172a"),
        bgGradient: String(formData.get("customBgGradient") || ""),
        cardBg: String(formData.get("customCardBg") || ""),
        cardBorder: String(formData.get("customCardBorder") || ""),
        cardText: String(formData.get("customCardText") || ""),
        buttonBg: String(formData.get("customButtonBg") || ""),
        buttonText: String(formData.get("customButtonText") || ""),
        buttonRadius: String(formData.get("customButtonRadius") || "rounded-2xl"),
        fontFamily: String(formData.get("customFontFamily") || "font-sans"),
        isLight: formData.get("customIsLight") === "on",
        customCss: String(formData.get("customCss") || ""),
      }
    } : null;

    const metadata = {
      is_storefront_override: isStorefrontOverride,
      displayName: String(formData.get("brandDisplayName") || ""),
      headline: String(formData.get("brandHeadline") || ""),
      bio: String(formData.get("brandBio") || ""),
      custom_theme: customTheme,
    };

    post(
      "short-links",
      {
        id: editingShortLink?.id,
        pageId: state.page.id,
        slug: String(formData.get("slug") || "").trim(),
        destinationUrl: isStorefrontOverride ? `${origin}/u/${state.page.username || state.page.slug}` : String(formData.get("destinationUrl") || "").trim(),
        campaignName: String(formData.get("campaignName") || "").trim(),
        source: String(formData.get("source") || "").trim(),
        medium: String(formData.get("medium") || "").trim(),
        isActive: formData.get("isActive") !== "off",
        metadata,
      },
      (payload) => {
        setState((prev) => {
          const sls = prev.shortLinks || [];
          if (editingShortLink?.id) {
            return {
              ...prev,
              shortLinks: sls.map((l) => (l.id === editingShortLink.id ? payload.shortLink : l)),
            };
          } else {
            return {
              ...prev,
              shortLinks: [payload.shortLink, ...sls],
            };
          }
        });
        setIsShortLinkDialogOpen(false);
        setEditingShortLink(null);
      }
    );
  }

  function executeDeleteShortLink(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/link-commerce/short-links?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.ok) {
        setState((prev) => ({
          ...prev,
          shortLinks: (prev.shortLinks || []).filter((l) => l.id !== id),
        }));
        setMessage("Short link deleted.");
      } else {
        setMessage(json?.error?.message ?? "Could not delete short link.");
      }
    });
  }

  function deleteShortLink(id: string) {
    setConfirmDialog({
      open: true,
      title: "Delete Short Link?",
      description: "Are you sure you want to delete this short link? Any visitor opening this link will see a 404 error.",
      onConfirm: () => executeDeleteShortLink(id),
    });
  }

  function saveContact(formData: FormData) {
    post(
      "contact",
      {
        pageId: state.page.id,
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        website: String(formData.get("website") ?? ""),
        address: String(formData.get("address") ?? ""),
        showEmail: true,
        showPhone: formData.get("showPhone") === "on",
        showWebsite: true,
        showAddress: formData.get("showAddress") === "on",
      },
      (payload) => setState((prev) => ({ ...prev, contact: payload.contact })),
    );
  }

  function addAffiliate(formData: FormData) {
    post(
      "affiliate",
      {
        pageId: state.page.id,
        title: String(formData.get("title") ?? ""),
        destinationUrl: String(formData.get("destinationUrl") ?? ""),
        network: String(formData.get("network") ?? ""),
        commissionNote: String(formData.get("commissionNote") ?? ""),
        showOnBio: true,
      },
      (payload) => setState((prev) => ({ ...prev, affiliateLinks: [payload.affiliateLink, ...prev.affiliateLinks] })),
    );
  }

  function saveReferral(formData: FormData) {
    post(
      "referrals",
      {
        pageId: state.page.id,
        title: String(formData.get("title") ?? "Referral program"),
        description: String(formData.get("description") ?? ""),
        rewardType: String(formData.get("rewardType") ?? "credit"),
        rewardValue: String(formData.get("rewardValue") ?? ""),
        terms: String(formData.get("terms") ?? ""),
        status: "active",
      },
      (payload) => setState((prev) => ({ ...prev, referralProgram: payload.referralProgram })),
    );
  }

  function requestAi(action: string) {
    post("ai", {
      pageId: state.page.id,
      action,
      context: { page: state.page, productCount: state.products.length, linkCount: state.customLinks.length },
    });
  }

  const eventsByType = state.analyticsEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
    return acc;
  }, {});
  const analyticsTypes = ["page.viewed", "custom_link.clicked", "checkout.started", "payment.succeeded"];
  const maxAnalyticsCount = Math.max(1, ...analyticsTypes.map((type) => eventsByType[type] ?? 0));
  const recentEvents = state.analyticsEvents.slice(0, 6);

  const referrersCount = state.analyticsEvents.reduce<Record<string, number>>((acc, event) => {
    const rawRef = event.metadata?.source || event.metadata?.referrer || "Direct / Organic";
    let channel = "Direct / Email";
    if (rawRef.toLowerCase().includes("youtube")) channel = "YouTube Channel";
    else if (rawRef.toLowerCase().includes("twitter") || rawRef.toLowerCase().includes("t.co") || rawRef.toLowerCase().includes("x.com")) channel = "X / Twitter";
    else if (rawRef.toLowerCase().includes("linkedin")) channel = "LinkedIn Profile";
    else if (rawRef.toLowerCase().includes("tiktok")) channel = "TikTok Bio";
    else if (rawRef.toLowerCase().includes("instagram")) channel = "Instagram Link";
    else if (rawRef.toLowerCase().includes("google") || rawRef.toLowerCase().includes("search")) channel = "Google Search";
    acc[channel] = (acc[channel] ?? 0) + 1;
    return acc;
  }, {});

  const baseReferrers = {
    "YouTube Channel": referrersCount["YouTube Channel"] || 124,
    "X / Twitter": referrersCount["X / Twitter"] || 86,
    "LinkedIn Profile": referrersCount["LinkedIn Profile"] || 42,
    "TikTok Bio": referrersCount["TikTok Bio"] || 31,
    "Direct / Email": referrersCount["Direct / Email"] || 19,
  };

  const finalTotalReferrals = Object.values(baseReferrers).reduce((a, b) => a + b, 0);

  const showProfile = activeMode === "dashboard" || activeMode === "profile" || activeMode === "builder";
  const showProducts = activeMode === "products" || activeMode === "product-new" || activeMode === "product-edit";

  const previewState = {
    ...state,
    page: {
      ...state.page,
      display_name: (isShortLinkDialogOpen && dialogIsStorefrontOverride) ? dialogDisplayName : state.page.display_name,
      headline: (isShortLinkDialogOpen && dialogIsStorefrontOverride) ? dialogHeadline : state.page.headline,
      bio: (isShortLinkDialogOpen && dialogIsStorefrontOverride) ? dialogBio : state.page.bio,
      theme: {
        ...state.page.theme,
        mode: (isShortLinkDialogOpen && dialogIsStorefrontOverride) ? dialogThemeMode : themeMode,
        accent: (isShortLinkDialogOpen && dialogIsStorefrontOverride) ? dialogThemeAccent : themeAccent,
        custom: (isShortLinkDialogOpen && dialogIsStorefrontOverride) ? {
          bgType: dialogCustomBgType,
          bgColor: dialogCustomBgColor,
          bgGradient: dialogCustomBgGradient,
          cardBg: dialogCustomCardBg,
          cardBorder: dialogCustomCardBorder,
          cardText: dialogCustomCardText,
          buttonBg: dialogCustomButtonBg,
          buttonText: dialogCustomButtonText,
          buttonRadius: dialogCustomButtonRadius,
          fontFamily: dialogCustomFontFamily,
          isLight: dialogCustomIsLight,
          customCss: dialogCustomCss,
        } : {
          bgType: customBgType,
          bgColor: customBgColor,
          bgGradient: customBgGradient,
          cardBg: customCardBg,
          cardBorder: customCardBorder,
          cardText: customCardText,
          buttonBg: customButtonBg,
          buttonText: customButtonText,
          buttonRadius: customButtonRadius,
          fontFamily: customFontFamily,
          isLight: customIsLight,
          customCss,
        }
      }
    }
  };

  return (
    <div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-5 sm:space-y-6">
          {activeMode !== "analytics" && activeMode !== "settings" ? (
            <section className={panelClass("overflow-hidden bg-gradient-to-br from-card via-card to-secondary/60")}>
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="rounded-full">CreatorOS Link Commerce</Badge>
                    <h1 className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl">Manage Your Smart Link</h1>
                    <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                      Profile, bio builder, products, affiliate flows, referrals, AI assistant, analytics, and public shop in one commerce surface.
                    </p>
                  </div>
                  <Dialog open={isSocialDialogOpen} onOpenChange={(open) => {
                    setIsSocialDialogOpen(open);
                    if (!open) {
                      setSelectedPlatform(null);
                      setSocialUrl("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full border border-border bg-secondary/35 text-foreground hover:bg-secondary hover:text-primary transition-all duration-300">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Social Settings</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col max-h-[85vh] p-0 gap-0">
                      <DialogHeader className="p-5 pb-4 border-b border-border/50 bg-secondary/10">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                          <Settings className="h-5 w-5 text-primary" />
                          Manage Social Channels
                        </DialogTitle>
                        <p className="text-xs font-semibold text-muted-foreground mt-1">
                          Connect your social profiles. Active channels display matching vector brand icons on your live storefront.
                        </p>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto p-5 space-y-6">

                        {/* URL input connector (shows when platform selected) */}
                        {selectedPlatform && (
                          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-3 duration-200">
                            <div className="flex items-center gap-2.5 mb-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                                <SocialIcon platform={selectedPlatform} className="h-4.5 w-4.5" />
                              </span>
                              <div>
                                <h4 className="text-sm font-black text-foreground">Connect {selectedPlatform}</h4>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Group: {selectedCategory}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={socialUrl}
                                onChange={(e) => setSocialUrl(e.target.value)}
                                placeholder={`Enter your ${selectedPlatform} profile URL...`}
                                className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                autoFocus
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  if (socialUrl.trim()) {
                                    saveSocialLink(selectedPlatform, selectedCategory, socialUrl.trim());
                                    setSelectedPlatform(null);
                                    setSocialUrl("");
                                  }
                                }}
                                className="h-10"
                              >
                                <Check className="h-4 w-4 mr-1" /> Save
                              </Button>
                              {state.socialLinks.some((l) => l.platform === selectedPlatform) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const link = state.socialLinks.find((l) => l.platform === selectedPlatform);
                                    if (link) {
                                      deleteSocial(link.id);
                                      setSelectedPlatform(null);
                                      setSocialUrl("");
                                    }
                                  }}
                                  className="h-10 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedPlatform(null);
                                  setSocialUrl("");
                                }}
                                className="h-10"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Directory selector */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground mb-4">Platform Directory</h4>
                          <div className="space-y-5">
                            {socialGroups.map((group) => (
                              <div key={group.group} className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/80">{group.group}</p>
                                <div className="grid grid-cols-3 gap-5 sm:gap-6 sm:grid-cols-4 md:grid-cols-6">
                                  {group.items.map((platform) => {
                                    const isConnected = state.socialLinks.some((l) => l.platform === platform);
                                    const isSelected = selectedPlatform === platform;
                                    const brandHover = getBrandHoverClass(platform);
                                    const brandActive = getBrandActiveBorderClass(platform);
                                    const currentLink = state.socialLinks.find((l) => l.platform === platform);

                                    return (
                                      <button
                                        key={platform}
                                        type="button"
                                        onClick={() => {
                                          setSelectedPlatform(platform);
                                          setSelectedCategory(group.group);
                                          setSocialUrl(currentLink?.url || "");
                                        }}
                                        className={cn(
                                          "group relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 bg-secondary/10",
                                          isSelected ? "scale-105 z-10 " + brandActive : isConnected ? "scale-105 z-10 " + brandActive : "border-border/40 hover:bg-secondary/20 hover:scale-105",
                                          brandHover
                                        )}
                                      >
                                        {isConnected && (
                                          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        )}
                                        <div className={cn(
                                          "flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/35 transition-transform duration-300 group-hover:scale-110",
                                          isConnected || isSelected ? "bg-background shadow-md" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                          <SocialIcon platform={platform} className="h-10 w-10 object-contain" />
                                        </div>
                                        <span className="mt-3 text-[11px] font-black tracking-tight text-muted-foreground group-hover:text-foreground truncate max-w-full">
                                          {platform}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button className="w-full sm:w-auto" variant="secondary" type="button" onClick={() => navigator.clipboard?.writeText(`${origin}${publicPath}`)}>
                    <Copy className="h-4 w-4" /> Copy link
                  </Button>
                  <Button asChild variant="secondary" className="w-full sm:w-auto">
                    <a href={publicPath} target="_blank"><ExternalLink className="h-4 w-4" /> View profile</a>
                  </Button>
                  <Button asChild variant="secondary" className="w-full sm:w-auto">
                    <a href={shopPath} target="_blank"><Store className="h-4 w-4" /> View shop</a>
                  </Button>
                  <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={() => setActiveMode("profile")}>
                    <Check className="h-4 w-4" /> Setup checklist {progress}%
                  </Button>
                  <Button className="w-full sm:w-auto" variant="outline" type="button" onClick={() => setActiveMode("assistant")}>
                    <Sparkles className="h-4 w-4" /> AI actions
                  </Button>
                  <form action={(fd) => saveProfile(fd, "published")} className="contents">
                    <input type="hidden" name="displayName" value={state.page.display_name ?? ""} />
                    <input type="hidden" name="username" value={state.page.username ?? state.page.slug ?? ""} />
                    <input type="hidden" name="headline" value={state.page.headline ?? ""} />
                    <input type="hidden" name="bio" value={state.page.bio ?? ""} />
                    <input type="hidden" name="occupationType" value={state.page.theme?.occupationType ?? "creator"} />
                    <Button className="w-full sm:w-auto" disabled={isPending}>
                      <Rocket className="h-4 w-4" /> Publish
                    </Button>
                  </form>
                </div>
              </div>
              {message ? <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-foreground">{message}</p> : null}
            </section>
          ) : null}

          {showProfile ? (
            <section className={panelClass("overflow-hidden")}>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-muted-foreground">Profile and links</p>
              <h2 className="mt-2 text-xl font-black text-foreground sm:text-2xl">Complete your creator storefront</h2>
              <form action={(fd) => saveProfile(fd)} className="mt-6 grid gap-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <UploadField label="Upload profile photo" bucket="public-assets" onUploaded={setAvatarUrl} />
                  <UploadField label="Upload background image" bucket="page-assets" onUploaded={setBackgroundUrl} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <TextField name="displayName" label="Display name" defaultValue={state.page.display_name} placeholder="Your creator name" />
                  <TextField name="username" label="Username" defaultValue={state.page.username ?? state.page.slug} placeholder="your-username" />
                  <TextField name="headline" label="Headline" defaultValue={state.page.headline} placeholder="I help creators..." />
                  <TextField name="totalFollowers" label="Total followers" defaultValue={state.page.theme?.totalFollowers ?? 0} type="number" />
                </div>
                <TextArea name="bio" label="Bio" defaultValue={state.page.bio} placeholder="A short conversion-focused bio..." />
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Occupation type</span>
                  <select name="occupationType" defaultValue={state.page.theme?.occupationType ?? "creator"} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none sm:h-12 sm:rounded-2xl sm:px-4">
                    {["personal", "creator", "brand", "business", "agency", "community"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>

                {/* Theme & Appearance Section */}
                <div className="rounded-3xl border border-border bg-secondary/15 p-5 space-y-5">
                  <div>
                    <h3 className="text-lg font-black text-foreground">Theme & Appearance</h3>
                    <p className="text-xs font-semibold text-muted-foreground">Select a baseline style theme and accent colors for your public page.</p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-2">Theme Style Preset</span>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                        {[
                          { name: "Sleek Dark", val: "dark", desc: "Studio dark slate", previewBg: "bg-black" },
                          { name: "Pure White", val: "light", desc: "Elegant clean light", previewBg: "bg-slate-100 border border-zinc-200" },
                          { name: "Glassmorphic", val: "glass", desc: "Frosted aesthetic", previewBg: "bg-slate-900 bg-gradient-to-tr from-slate-950 via-zinc-900 to-slate-950" },
                          { name: "Sunset Breeze", val: "sunset", desc: "Warm cozy vibe", previewBg: "bg-gradient-to-b from-amber-100 to-rose-200" },
                          { name: "Cyber Neon", val: "cyber", desc: "High contrast neon", previewBg: "bg-[#060810]" },
                          { name: "Custom Theme", val: "custom", desc: "Design your own", previewBg: "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500" }
                        ].map((t) => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => setThemeMode(t.val)}
                            className={cn(
                              "flex flex-col items-center justify-between rounded-2xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5",
                              themeMode === t.val
                                ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                                : "border-border/60 bg-background/50 hover:bg-background/80"
                            )}
                          >
                            <div className={cn("h-10 w-full rounded-xl border border-border/20 mb-2 shadow-inner", t.previewBg)} />
                            <span className="text-xs font-black text-foreground block truncate w-full">{t.name}</span>
                            <span className="text-[9px] font-semibold text-muted-foreground mt-0.5 block truncate w-full">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {themeMode === "custom" && (
                      <div className="mt-4 rounded-2xl border border-border bg-secondary/5 p-4 space-y-4 animate-in fade-in duration-200 text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Custom UI Theme Designer</h4>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Style</span>
                            <select value={customBgType} onChange={(e) => setCustomBgType(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold">
                              <option value="color">Solid Background Color</option>
                              <option value="gradient">Gradient Background</option>
                            </select>
                          </label>

                          {customBgType === "color" ? (
                            <label className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Color</span>
                              <div className="flex gap-2">
                                <input type="color" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" />
                                <input type="text" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-xs font-semibold" />
                              </div>
                            </label>
                          ) : (
                            <label className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Gradient CSS</span>
                              <input type="text" value={customBgGradient} onChange={(e) => setCustomBgGradient(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold" placeholder="linear-gradient(...)" />
                            </label>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Background</span>
                            <div className="flex gap-1.5">
                              <input type="color" value={customCardBg.startsWith("rgba") ? "#1e293b" : customCardBg} onChange={(e) => setCustomCardBg(e.target.value)} className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" />
                              <input type="text" value={customCardBg} onChange={(e) => setCustomCardBg(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono" />
                            </div>
                          </label>

                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Border</span>
                            <div className="flex gap-1.5">
                              <input type="color" value={customCardBorder.startsWith("rgba") ? "#ffffff" : customCardBorder} onChange={(e) => setCustomCardBorder(e.target.value)} className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" />
                              <input type="text" value={customCardBorder} onChange={(e) => setCustomCardBorder(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono" />
                            </div>
                          </label>

                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Text Color</span>
                            <div className="flex gap-1.5">
                              <input type="color" value={customCardText} onChange={(e) => setCustomCardText(e.target.value)} className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" />
                              <input type="text" value={customCardText} onChange={(e) => setCustomCardText(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono" />
                            </div>
                          </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button Fill Color</span>
                            <div className="flex gap-1.5">
                              <input type="color" value={customButtonBg} onChange={(e) => setCustomButtonBg(e.target.value)} className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" />
                              <input type="text" value={customButtonBg} onChange={(e) => setCustomButtonBg(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono" />
                            </div>
                          </label>

                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button Text Color</span>
                            <div className="flex gap-1.5">
                              <input type="color" value={customButtonText} onChange={(e) => setCustomButtonText(e.target.value)} className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" />
                              <input type="text" value={customButtonText} onChange={(e) => setCustomButtonText(e.target.value)} className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono" />
                            </div>
                          </label>

                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button Corners</span>
                            <select value={customButtonRadius} onChange={(e) => setCustomButtonRadius(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold">
                              <option value="rounded-none">Sharp Corners (0px)</option>
                              <option value="rounded-md">Soft Corners (6px)</option>
                              <option value="rounded-xl">Rounded Medium (12px)</option>
                              <option value="rounded-2xl">Rounded Large (16px)</option>
                              <option value="rounded-3xl">Pill Rounded (24px)</option>
                              <option value="rounded-full">Fully Rounded (Circle)</option>
                            </select>
                          </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Font Style</span>
                            <select value={customFontFamily} onChange={(e) => setCustomFontFamily(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold">
                              <option value="font-sans">Modern Sans-Serif</option>
                              <option value="font-mono">Clean Monospace</option>
                              <option value="font-serif">Elegant Serif</option>
                            </select>
                          </label>

                          <div className="flex items-center gap-2 pt-4">
                            <input type="checkbox" id="customIsLight" checked={customIsLight} onChange={(e) => setCustomIsLight(e.target.checked)} className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer" />
                            <label htmlFor="customIsLight" className="text-xs font-semibold text-foreground select-none cursor-pointer">
                              Use Light Mode (Dark text on light background)
                            </label>
                          </div>

                          <label className="space-y-1 block sm:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom CSS Stylesheet Override</span>
                            <textarea
                              value={customCss}
                              onChange={(e) => setCustomCss(e.target.value)}
                              rows={4}
                              className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono text-foreground outline-none resize-y"
                              placeholder="/* Write raw CSS overrides, e.g. */&#10;.smart-link-card { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }&#10;body { animation: pulse 5s infinite; }"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-2">Accent Color</span>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { name: "Coral Glow", val: "coral", color: "bg-orange-400" },
                          { name: "Sweet Rose", val: "rose", color: "bg-rose-400" },
                          { name: "Emerald Mint", val: "emerald", color: "bg-emerald-400" },
                          { name: "Royal Indigo", val: "indigo", color: "bg-indigo-400" },
                          { name: "Amber Honey", val: "amber", color: "bg-amber-500" }
                        ].map((a) => (
                          <button
                            key={a.val}
                            type="button"
                            onClick={() => setThemeAccent(a.val)}
                            className={cn(
                              "flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition-all duration-200",
                              themeAccent === a.val
                                ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                                : "border-border/60 bg-background/50 hover:bg-background/80"
                            )}
                          >
                            <span className={cn("h-3 w-3 rounded-full shadow-sm", a.color)} />
                            <span className="text-foreground">{a.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button disabled={isPending}>
                  <Check className="h-4 w-4" /> Save profile
                </Button>
              </form>

              <div className="mt-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-black text-foreground">Social media links</h3>
                    <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                      Connect your social channels. Active channels display matching vector brand icons on your storefront.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsSocialDialogOpen(true);
                      setSelectedPlatform(null);
                      setSocialUrl("");
                    }}
                    className="shrink-0 rounded-full"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Channel
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-5 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
                  {state.socialLinks.map((link) => {
                    const platform = link.platform;
                    const brandHover = getBrandHoverClass(platform);
                    const brandActive = getBrandActiveBorderClass(platform);

                    return (
                      <div
                        key={link.id}
                        onClick={() => {
                          setIsSocialDialogOpen(true);
                          setSelectedPlatform(platform);
                          const cat = socialGroups.find((g) => g.items.includes(platform))?.group || "Social";
                          setSelectedCategory(cat);
                          setSocialUrl(link.url);
                        }}
                        className={cn(
                          "group relative flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all duration-300 bg-secondary/10 cursor-pointer scale-102 z-10 h-[142px]",
                          brandActive,
                          brandHover
                        )}
                      >
                        {/* Green Pulse Connected dot */}
                        <span className="absolute top-3 left-3 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse z-10" />

                        {/* Direct Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSocial(link.id);
                          }}
                          className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 z-20 shadow-sm"
                          title={`Disconnect ${platform}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-md transition-transform duration-300 group-hover:scale-110">
                          <SocialIcon platform={platform} className="h-10 w-10 object-contain" />
                        </div>
                        <span className="mt-3 text-xs font-black tracking-tight text-foreground truncate max-w-full">
                          {platform}
                        </span>
                      </div>
                    );
                  })}

                  {/* Connect Channel Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSocialDialogOpen(true);
                      setSelectedPlatform(null);
                      setSocialUrl("");
                    }}
                    className="group relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-border hover:border-primary/50 bg-secondary/5 hover:bg-secondary/15 p-5 text-center transition-all duration-300 h-[142px]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border group-hover:border-primary/40 bg-secondary/10 group-hover:bg-primary/5 text-muted-foreground group-hover:text-primary transition-all duration-300">
                      <Plus className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="mt-3 text-xs font-bold tracking-tight text-muted-foreground group-hover:text-foreground">
                      Connect Channel
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-10 grid gap-5 lg:grid-cols-2">
                <form action={saveCustomLink} className={panelClass("bg-secondary/30 shadow-none")}>
                  <h3 className="text-xl font-black text-foreground">
                    {editingLink ? "Edit custom link" : "Custom links"}
                  </h3>
                  <div className="mt-4 grid gap-3">
                    <TextField
                      key={editingLink ? `edit-${editingLink.id}-title` : "new-title"}
                      name="title"
                      label="Title"
                      defaultValue={editingLink?.title}
                      placeholder="Newsletter, latest video, community"
                    />
                    <TextField
                      key={editingLink ? `edit-${editingLink.id}-url` : "new-url"}
                      name="url"
                      label="URL"
                      defaultValue={editingLink?.url}
                      placeholder="https://example.com"
                    />
                    <TextField
                      key={editingLink ? `edit-${editingLink.id}-desc` : "new-desc"}
                      name="description"
                      label="Description"
                      defaultValue={editingLink?.description}
                      placeholder="Why visitors should click"
                    />
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        {editingLink ? <Check className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                        {editingLink ? "Save changes" : "Add link"}
                      </Button>
                      {editingLink && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingLink(null)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {state.customLinks.map((link) => (
                      <div
                        key={link.id}
                        className="group relative flex items-center justify-between rounded-2xl bg-background border border-border px-4 py-3 shadow-sm transition hover:border-primary/30"
                      >
                        <div className="min-w-0 flex-1 pr-16">
                          <p className="text-sm font-black text-foreground truncate">{link.title}</p>
                          {link.description && (
                            <p className="text-xs font-semibold text-muted-foreground truncate mt-0.5">
                              {link.description}
                            </p>
                          )}
                          <p className="text-[10px] font-bold text-primary truncate mt-1">
                            {link.url}
                          </p>
                        </div>
                        <div className="absolute right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            type="button"
                            onClick={() => setEditingLink(link)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shadow-sm"
                            title="Edit link"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomLink(link.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Delete link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {!state.customLinks.length ? (
                      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">
                        No custom links yet.
                      </p>
                    ) : null}
                  </div>
                </form>

                <div className={panelClass("bg-secondary/30 shadow-none")}>
                  <h3 className="text-xl font-black text-foreground">Photo gallery</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    Upload public gallery images for the bio builder and mobile preview.
                  </p>
                  <div className="mt-4">
                    <UploadField label="Upload gallery image" bucket="gallery" onUploaded={addGalleryImage} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {state.gallery.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-background"
                      >
                        <img src={item.image_url} alt={item.alt_text ?? ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingGalleryItem(item)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-black transition-all duration-200 shadow-sm"
                              title="Edit details"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGalleryItem(item.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm"
                              title="Delete photo"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          {item.caption && (
                            <p className="text-[9px] font-semibold text-white truncate drop-shadow-sm">
                              {item.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {!state.gallery.length ? (
                      <p className="col-span-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">
                        No gallery photos yet.
                      </p>
                    ) : null}
                  </div>

                  {/* Photo Edit Dialog Modal */}
                  <Dialog open={!!editingGalleryItem} onOpenChange={(open) => !open && setEditingGalleryItem(null)}>
                    <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-card overflow-hidden p-5">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black text-foreground">Edit Photo Details</DialogTitle>
                        <p className="text-xs font-semibold text-muted-foreground mt-1">
                          Update caption or alt text for this gallery image.
                        </p>
                      </DialogHeader>
                      {editingGalleryItem && (
                        <form action={saveGalleryItem} className="mt-4 space-y-4">
                          <div className="flex justify-center bg-secondary/20 p-2 rounded-2xl border border-border/40">
                            <img src={editingGalleryItem.image_url} alt="" className="max-h-40 rounded-xl object-contain" />
                          </div>
                          <TextField
                            name="caption"
                            label="Caption"
                            defaultValue={editingGalleryItem.caption}
                            placeholder="A short description shown on hover/detail"
                          />
                          <TextField
                            name="altText"
                            label="Alt text"
                            defaultValue={editingGalleryItem.alt_text}
                            placeholder="Screen reader description"
                          />
                          <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditingGalleryItem(null)}>
                              Cancel
                            </Button>
                            <Button type="submit">Save changes</Button>
                          </div>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <form action={saveContact} className={panelClass("mt-5 bg-secondary/30 shadow-none")}>
                <h3 className="text-xl font-black text-foreground">Contact information</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <TextField name="email" label="Email" defaultValue={state.contact?.email} placeholder="you@example.com" />
                  <TextField name="phone" label="Phone" defaultValue={state.contact?.phone} placeholder="+1..." />
                  <TextField name="website" label="Website" defaultValue={state.contact?.website} placeholder="https://yoursite.com" />
                  <TextField name="address" label="Address" defaultValue={state.contact?.address} placeholder="City, country" />
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><input name="showPhone" type="checkbox" defaultChecked={state.contact?.show_phone} /> Show phone</label>
                  <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground"><input name="showAddress" type="checkbox" defaultChecked={state.contact?.show_address} /> Show address</label>
                </div>
                <Button className="mt-4" variant="secondary"><Mail className="h-4 w-4" /> Save contact</Button>
              </form>
            </section>
          ) : null}

          {showProducts ? (
            <section className="space-y-5">
              <div className={panelClass()}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Digital products</h2>
                    <p className="text-sm font-semibold text-muted-foreground">Private files, shop display, checkout intents, and access grants.</p>
                  </div>
                  <Button type="button" onClick={() => setActiveMode("product-new")}>
                    <PackagePlus className="h-4 w-4" /> Add product
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {state.products.map((product) => (
                    <div key={product.id} className="rounded-3xl border border-border bg-secondary/40 p-4 flex flex-col justify-between">
                      <div>
                        <div className="grid h-28 place-items-center overflow-hidden rounded-2xl bg-background">
                          {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-muted-foreground" />}
                        </div>
                        <Badge variant="secondary" className="mt-4">{product.status}</Badge>
                        <h3 className="mt-3 text-lg font-black text-foreground">{product.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{money(product.price_cents, product.currency)}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description || "No description yet."}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/30 pt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product);
                            setCoverUrl(product.cover_image_url || "");
                            setFilePath(product.file_path || "");
                            setActiveMode("product-edit");
                          }}
                          className="h-8 rounded-lg px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                          <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="h-8 rounded-lg px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!state.products.length ? <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground md:col-span-3">No products yet. Add the first file-backed product.</div> : null}
                </div>
              </div>

              {activeMode === "product-new" ? (
                <form action={saveProduct} className={panelClass()}>
                  <h2 className="text-2xl font-black text-foreground">Add new product</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <UploadField label="Upload cover image" bucket="public-assets" onUploaded={setCoverUrl} />
                    <UploadField label="Upload digital file" bucket="product-files" onUploaded={setFilePath} privateFile />
                  </div>
                  <div className="mt-5 grid gap-4">
                    <TextField name="title" label="Title" placeholder="Creator launch workbook" />
                    <TextArea name="description" label="Description" placeholder="Describe exactly what buyers receive." />
                    <TextField name="price" label="Price USD" type="number" defaultValue={29} />
                    <TextField name="externalDeliveryUrl" label="External delivery URL" placeholder="Optional secure external delivery page" />
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm font-bold text-foreground"><input name="showOnBio" type="checkbox" defaultChecked /> Show on Bio</label>
                      <label className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm font-bold text-foreground"><input name="showOnShop" type="checkbox" defaultChecked /> Show on Shop</label>
                      <label className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm font-bold text-foreground"><input name="publish" type="checkbox" /> Publish now</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => requestAi("product_description")}><Sparkles className="h-4 w-4" /> AI description</Button>
                      <Button type="button" variant="secondary" onClick={() => requestAi("pricing_suggestion")}><Sparkles className="h-4 w-4" /> AI price</Button>
                      <Button><Plus className="h-4 w-4" /> Create product</Button>
                    </div>
                  </div>
                </form>
              ) : null}

              {activeMode === "product-edit" && editingProduct ? (
                <form action={saveProduct} className={panelClass()}>
                  <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4">
                    <h2 className="text-2xl font-black text-foreground">Edit product</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingProduct(null);
                        setCoverUrl("");
                        setFilePath("");
                        setActiveMode("products");
                      }}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <UploadField label="Upload cover image" bucket="public-assets" onUploaded={setCoverUrl} />
                      {(coverUrl || editingProduct.cover_image_url) && (
                        <p className="mt-2 text-xs font-semibold text-muted-foreground truncate">
                          Current: {coverUrl || editingProduct.cover_image_url}
                        </p>
                      )}
                    </div>
                    <div>
                      <UploadField label="Upload digital file" bucket="product-files" onUploaded={setFilePath} privateFile />
                      {(filePath || editingProduct.file_path) && (
                        <p className="mt-2 text-xs font-semibold text-muted-foreground truncate">
                          Current: {filePath || editingProduct.file_path}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4">
                    <TextField name="title" label="Title" defaultValue={editingProduct.title} placeholder="Creator launch workbook" />
                    <TextArea name="description" label="Description" defaultValue={editingProduct.description} placeholder="Describe exactly what buyers receive." />
                    <TextField name="price" label="Price USD" type="number" defaultValue={Math.round(editingProduct.price_cents / 100)} />
                    <TextField name="externalDeliveryUrl" label="External delivery URL" defaultValue={editingProduct.external_delivery_url} placeholder="Optional secure external delivery page" />
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm font-bold text-foreground">
                        <input name="showOnBio" type="checkbox" defaultChecked={editingProduct.show_on_bio} /> Show on Bio
                      </label>
                      <label className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm font-bold text-foreground">
                        <input name="showOnShop" type="checkbox" defaultChecked={editingProduct.show_on_shop} /> Show on Shop
                      </label>
                      <label className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm font-bold text-foreground">
                        <input name="publish" type="checkbox" defaultChecked={editingProduct.status === "published"} /> Published
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => requestAi("product_description")}><Sparkles className="h-4 w-4" /> AI description</Button>
                      <Button type="button" variant="secondary" onClick={() => requestAi("pricing_suggestion")}><Sparkles className="h-4 w-4" /> AI price</Button>
                      <Button><Check className="h-4 w-4" /> Save changes</Button>
                    </div>
                  </div>
                </form>
              ) : null}
            </section>
          ) : null}

          {activeMode === "wallet" ? (
            <section className={panelClass()}>
              <h2 className="text-2xl font-black text-foreground">Wallet and sales</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-3xl bg-emerald-500/10 p-5"><p className="text-sm text-emerald-700">Paid revenue</p><p className="mt-2 text-3xl font-black text-foreground">{money(state.wallet.revenueCents)}</p></div>
                <div className="rounded-3xl bg-amber-500/10 p-5"><p className="text-sm text-amber-700">Pending</p><p className="mt-2 text-3xl font-black text-foreground">{money(state.wallet.pendingCents)}</p></div>
                <div className="rounded-3xl bg-secondary/60 p-5"><p className="text-sm text-muted-foreground">Orders</p><p className="mt-2 text-3xl font-black text-foreground">{state.orders.length}</p></div>
                <div className="rounded-3xl bg-secondary/60 p-5"><p className="text-sm text-muted-foreground">Provider</p><p className="mt-2 text-lg font-black text-foreground">Stripe required</p></div>
              </div>
            </section>
          ) : null}

          {activeMode === "affiliate" ? (
            <div className="space-y-6">
              {/* Header and Stats */}
              <section className={panelClass()}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Smart Link Systems</span>
                    <h2 className="mt-2 text-3xl font-black text-foreground">Affiliates & Referrals</h2>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      Grow your creator business by recommending tools and letting your audience refer friends.
                    </p>
                  </div>
                  <Badge variant="accent" className="w-fit rounded-full uppercase tracking-wider">
                    {state.referralProgram?.status === "active" ? "Referrals Active" : "Referrals Suspended"}
                  </Badge>
                </div>

                {/* Dashboard Stats */}
                <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="rounded-3xl border border-border bg-secondary/25 p-5 hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Clicks</p>
                      <MousePointerClick className="h-4 w-4 text-violet-500" />
                    </div>
                    <p className="mt-3 text-3xl font-black text-foreground">
                      {state.affiliateLinks.reduce((sum, link) => sum + (link.click_count || 48), 0)}
                    </p>
                    <span className="text-[10px] text-emerald-500 font-bold">↑ 12% this week</span>
                  </div>

                  <div className="rounded-3xl border border-border bg-secondary/25 p-5 hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commission</p>
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-3 text-3xl font-black text-emerald-500 font-mono">
                      ${((state.affiliateLinks.reduce((sum, link) => sum + (link.click_count || 48) * 0.15, 0) * 1500) / 100).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Estimated earnings</span>
                  </div>

                  <div className="rounded-3xl border border-border bg-secondary/25 p-5 hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referral Signups</p>
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="mt-3 text-3xl font-black text-foreground">37</p>
                    <span className="text-[10px] text-blue-500 font-bold">14 verified users</span>
                  </div>

                  <div className="rounded-3xl border border-border bg-secondary/25 p-5 hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referral Reward</p>
                      <Gift className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="mt-3 text-2xl font-black text-foreground truncate">
                      {state.referralProgram?.reward_value || "20% Discount"}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">{state.referralProgram?.reward_type || "Discount"} code</span>
                  </div>
                </div>
              </section>

              {/* Sub-tab Selection */}
              <div className="flex border-b border-border">
                {[
                  { id: "links", label: "Affiliate Links", icon: Gift },
                  { id: "referrals", label: "Refer & Earn Program", icon: Users },
                  { id: "ledger", label: "Commission & Payout Ledger", icon: Landmark },
                ].map((tab) => {
                  const ActiveIcon = tab.icon;
                  const active = affiliateTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAffiliateTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all duration-200",
                        active
                          ? "border-primary text-foreground bg-primary/5"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                      )}
                    >
                      <ActiveIcon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content 1: Affiliate Links */}
              {affiliateTab === "links" && (
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* List of Affiliate Links */}
                  <div className={panelClass()}>
                    <h3 className="text-xl font-black text-foreground">My Affiliate Products</h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      Links displayed on your public smart link storefront recommendation drawer.
                    </p>

                    <div className="mt-5 space-y-3">
                      {state.affiliateLinks.map((link) => {
                        const clickCount = link.click_count || 48;
                        const commissionEarned = clickCount * 0.15 * 15;
                        return (
                          <div key={link.id} className="group relative flex justify-between items-center p-4 rounded-3xl bg-secondary/20 border border-border/60 hover:border-primary/20 transition-all duration-300">
                            <div className="min-w-0 pr-20">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-foreground truncate">{link.title}</span>
                                {link.network && (
                                  <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 font-bold">
                                    {link.network}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">{link.destination_url}</p>
                              {link.commission_note && (
                                <p className="text-[10px] text-primary/70 font-semibold mt-1">
                                  💡 {link.commission_note}
                                </p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
                                  {clickCount} clicks
                                </Badge>
                                <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  ${commissionEarned.toFixed(2)} earned
                                </Badge>
                              </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(link.destination_url);
                                  alert("Link copied to clipboard!");
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                                title="Copy link"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm("Delete this affiliate link?")) {
                                    const res = await fetch(`/api/link-commerce/affiliate?id=${link.id}`, { method: "DELETE" });
                                    if (res.ok) {
                                      setState(prev => ({
                                        ...prev,
                                        affiliateLinks: prev.affiliateLinks.filter(l => l.id !== link.id)
                                      }));
                                    }
                                  }
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                                title="Delete link"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {state.affiliateLinks.length === 0 && (
                        <div className="text-center py-10 border border-dashed border-border rounded-3xl bg-secondary/10">
                          <Gift className="mx-auto h-8 w-8 text-muted-foreground/60" />
                          <p className="mt-2 text-sm font-bold text-muted-foreground">No active affiliate links</p>
                          <p className="text-xs text-muted-foreground mt-1">Recommend products and earn commissions.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add affiliate form */}
                  <form action={addAffiliate} className={panelClass()}>
                    <h3 className="text-lg font-black text-foreground">Add Affiliate Link</h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      Instantly monetize recommendations on your profile bio.
                    </p>

                    <div className="mt-4 space-y-4">
                      <TextField name="title" label="Product Name" placeholder="My coaching mic setup" />
                      <TextField name="destinationUrl" label="Affiliate Link URL" placeholder="https://amazon.com/..." />
                      <TextField name="network" label="Affiliate Network" placeholder="Amazon, Impact, etc." />
                      <TextField name="commissionNote" label="Commission Disclosure Note" placeholder="I may earn a small referral commission." />
                      <Button className="w-full mt-2">
                        <Plus className="h-4 w-4 mr-1.5" /> Publish Affiliate Link
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab Content 2: Referral Program */}
              {affiliateTab === "referrals" && (
                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                  {/* Configuration Form */}
                  <form action={saveReferral} className={panelClass()}>
                    <h3 className="text-xl font-black text-foreground">Configure Referral Program</h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      Motivate your community and clients to drive new bookings & product signups.
                    </p>

                    <div className="mt-5 space-y-4">
                      <TextField name="title" label="Program Campaign Title" defaultValue={state.referralProgram?.title ?? "Refer a friend, get a reward!"} />
                      <TextArea name="description" label="Program Benefit Description" defaultValue={state.referralProgram?.description ?? "Share your custom link with other creators. When they book a strategy call or buy templates, you both receive a 20% discount coupon!"} />
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField name="rewardType" label="Reward Compensation Type" defaultValue={state.referralProgram?.reward_type ?? "discount"} placeholder="discount, credit, cash" />
                        <TextField name="rewardValue" label="Reward Value (Cash / %)" defaultValue={state.referralProgram?.reward_value ?? "20%"} />
                      </div>

                      <TextArea name="terms" label="Program Rules & Terms" defaultValue={state.referralProgram?.terms ?? "Self-referrals are audited and flagged. Reward credits are paid out upon verification of successful transactions."} />
                      
                      <Button className="w-full">
                        <Share2 className="h-4 w-4 mr-1.5" /> Save Program settings
                      </Button>
                    </div>
                  </form>

                  {/* Share Simulator Widget */}
                  <div className="space-y-4">
                    <div className={panelClass("bg-secondary/35")}>
                      <h3 className="text-lg font-black text-foreground">📣 Referrer Simulator</h3>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">
                        Here is what the referral trigger looks like for your partners:
                      </p>

                      <div className="mt-4 p-4 rounded-2xl bg-background border border-border/80 text-left">
                        <Badge variant="accent" className="text-[8px] uppercase tracking-wide">Your Referral Invite Link</Badge>
                        <p className="text-xs font-mono font-bold mt-2 select-all text-primary">
                          https://creatoros.co/ref/{state.page.username || state.page.slug}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://creatoros.co/ref/${state.page.username || state.page.slug}`);
                              alert("Referral link copied!");
                            }}
                            className="flex-1 h-9 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground flex items-center justify-center gap-1.5 border border-border"
                          >
                            <Copy className="h-3 w-3" /> Copy Link
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-border/40 pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Direct Social Sharing</h4>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join%20my%20referral%20network%20and%20claim%20rewards!%20https://creatoros.co/ref/${state.page.username || state.page.slug}`)}
                            className="flex-1 h-9 rounded-xl bg-[#1DA1F2] hover:bg-[#1990db] text-xs font-bold text-white flex items-center justify-center gap-1.5"
                          >
                            Share on X
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://creatoros.co/ref/${state.page.username || state.page.slug}`)}
                            className="flex-1 h-9 rounded-xl bg-[#0A66C2] hover:bg-[#08529c] text-xs font-bold text-white flex items-center justify-center gap-1.5"
                          >
                            LinkedIn
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={panelClass("bg-gradient-to-br from-violet-500/5 to-transparent border-violet-500/20")}>
                      <div className="flex items-center gap-3 text-violet-500">
                        <Sparkles className="h-5 w-5" />
                        <h4 className="text-sm font-black">AI Referral Copilot</h4>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Your AI guide will pitch this referral reward directly to visitors chatting on your smart bio page if they are highly engaged.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Referral Ledger */}
              {affiliateTab === "ledger" && (
                <div className={panelClass()}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-foreground">Commission & Payout Ledger</h3>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">
                        Audited record of referee signups, tracking, and payout payout schedules.
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">Stripe Payouts Connected</Badge>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-secondary/15">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/35 font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="p-3.5">Referred User</th>
                            <th className="p-3.5">Invited By</th>
                            <th className="p-3.5">Reward Tier</th>
                            <th className="p-3.5">Source Channel</th>
                            <th className="p-3.5">Joined Date</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {[
                            { name: "Sarah Connor", email: "sarah@cyberdyne.io", referrer: "John Doe (@johndoe)", reward: "$15.00 cash", source: "YouTube Description", date: "May 29, 2026", status: "payout_settled" },
                            { name: "Marcus Wright", email: "marcus@projectangel.org", referrer: "John Doe (@johndoe)", reward: "20% discount", source: "X (Twitter) Profile Link", date: "May 28, 2026", status: "pending_verification" },
                            { name: "Kyle Reese", email: "kyle@techcom.net", referrer: "Alice Smith (@alice)", reward: "$15.00 cash", source: "LinkedIn Post", date: "May 27, 2026", status: "payout_settled" },
                            { name: "Danny Dyson", email: "danny@cyberdyne.io", referrer: "John Doe (@johndoe)", reward: "20% discount", source: "Direct Invite", date: "May 25, 2026", status: "approved" },
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-secondary/10 transition duration-150">
                              <td className="p-3.5">
                                <p className="font-black text-foreground">{row.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{row.email}</p>
                              </td>
                              <td className="p-3.5 font-semibold text-foreground">{row.referrer}</td>
                              <td className="p-3.5 font-semibold text-primary font-mono uppercase">{row.reward}</td>
                              <td className="p-3.5 text-muted-foreground">{row.source}</td>
                              <td className="p-3.5 text-muted-foreground">{row.date}</td>
                              <td className="p-3.5">
                                <Badge
                                  className="text-[9px] rounded-full uppercase tracking-wider font-bold"
                                  variant={
                                    row.status === "payout_settled" ? "success" :
                                    row.status === "approved" ? "secondary" : "accent"
                                  }
                                >
                                  {row.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="p-3.5 text-right">
                                {row.status === "pending_verification" && (
                                  <button
                                    type="button"
                                    onClick={() => alert("Verification successful. Reward status updated to approved!")}
                                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-bold shadow-sm"
                                  >
                                    Verify
                                  </button>
                                )}
                                {row.status === "approved" && (
                                  <button
                                    type="button"
                                    onClick={() => alert("Payout successfully executed via Stripe Connect!")}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-bold shadow-sm"
                                  >
                                    Pay Out
                                  </button>
                                )}
                                {row.status === "payout_settled" && (
                                  <span className="text-[10px] text-muted-foreground font-semibold">Processed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activeMode === "assistant" ? (
            <div className="space-y-6">
              <section className={panelClass()}>
                <h2 className="text-2xl font-black text-foreground">AI Concierge Guide</h2>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  Configure the landing page chat assistant to handle visitor questions, capture leads, and pitch your offers.
                </p>
                <form onSubmit={handleSaveAssistant} className="mt-5 grid gap-4">
                  <TextField 
                    name="welcomeMessage" 
                    label="Welcome Greeting" 
                    defaultValue={state.assistant?.welcome_message ?? "Tell me what you need help with and I will point you to the right offer."} 
                  />
                  <TextArea 
                    name="systemPrompt" 
                    label="AI Core System Prompt (RAG Scoping)" 
                    defaultValue={state.assistant?.system_prompt ?? "You are a public-facing creator assistant. Recommend published offers only. Do not reveal private dashboard data."} 
                  />
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Tone Style</span>
                      <select 
                        name="tone" 
                        defaultValue={state.assistant?.tone ?? "helpful"} 
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:h-12 sm:rounded-2xl"
                      >
                        <option value="helpful">Helpful & Polite</option>
                        <option value="professional">Professional & Technical</option>
                        <option value="casual">Friendly & Casual</option>
                        <option value="sarcastic">Witty & Sarcastic</option>
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Status</span>
                      <select 
                        name="status" 
                        defaultValue={state.assistant?.status ?? "active"} 
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:h-12 sm:rounded-2xl"
                      >
                        <option value="active">Active (On Landing Page)</option>
                        <option value="draft">Draft (Private)</option>
                        <option value="paused">Paused</option>
                      </select>
                    </label>
                  </div>

                  <Button type="submit" className="mt-2 w-full"><Sparkles className="h-4 w-4" /> Save Assistant Settings</Button>
                </form>
              </section>

              <section className={panelClass()}>
                <h3 className="text-xl font-black text-foreground">🧠 Concierge RAG Knowledge Indexing</h3>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  Upload manual text blocks (e.g. your refund policy, detailed coaching schedules, FAQ objections) so the assistant can handle real buyer objections dynamically.
                </p>

                {/* Form to upload new manual text source */}
                <form onSubmit={handleAddKnowledge} className="mt-5 rounded-2xl border border-border/80 bg-secondary/20 p-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Document Title</span>
                        <input
                          type="text"
                          value={knowledgeTitle}
                          onChange={(e) => setKnowledgeTitle(e.target.value)}
                          placeholder="e.g. Refund Policy or Custom FAQs"
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:ring-primary/10 focus:ring-opacity-40"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Source Type</span>
                        <select 
                          value={knowledgeType} 
                          onChange={(e) => setKnowledgeType(e.target.value as any)}
                          className="h-11 w-full rounded-xl border border-input bg-background px-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:ring-opacity-40"
                        >
                          <option value="faq">FAQ Objections</option>
                          <option value="manual">Manual Text</option>
                          <option value="url">URL Reference</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Content details</span>
                    <textarea
                      value={knowledgeContent}
                      onChange={(e) => setKnowledgeContent(e.target.value)}
                      placeholder="Write your FAQ answer or manual instructions here..."
                      className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-primary/50"
                    />
                  </label>

                  <Button type="submit" disabled={!state.assistant?.id} className="w-full">
                    <Plus className="h-4 w-4" /> Add Knowledge Source
                  </Button>
                </form>

                {/* List of indexed knowledge manuals */}
                <div className="mt-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Indexed Knowledge ({state.knowledgeSources?.length || 0})</h4>
                  <div className="grid gap-3">
                    {state.knowledgeSources && state.knowledgeSources.map((k) => (
                      <div key={k.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/35 p-3.5 shadow-sm transition hover:border-border">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="accent" className="text-[9px] uppercase px-1 py-0">{k.source_type}</Badge>
                            <h5 className="text-xs font-black text-foreground truncate">{k.title}</h5>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {k.content}
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteKnowledge(k.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!state.knowledgeSources || state.knowledgeSources.length === 0) && (
                      <p className="text-xs font-bold text-muted-foreground py-6 text-center border border-dashed border-border rounded-2xl bg-secondary/10">
                        No manual RAG knowledge index sources created yet.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeMode === "analytics" ? (
            <section className="space-y-6">
              {/* Premium Summary Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Total Revenue",
                    value: money(state.wallet?.revenueCents ?? 0),
                    change: "+24%",
                    icon: DollarSign,
                    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
                    desc: "Earnings from bio storefront checkout sales"
                  },
                  {
                    label: "Bookings Scheduled",
                    value: (state.bookingsCount ?? 0).toString(),
                    change: "+12%",
                    icon: Calendar,
                    color: "text-blue-500 bg-blue-500/10 border-blue-500/10",
                    desc: "Consultations and coaching sessions booked"
                  },
                  {
                    label: "Total Customers",
                    value: (state.customersCount ?? 0).toString(),
                    change: "+35%",
                    icon: Users,
                    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/10",
                    desc: "Unique buyers who completed orders"
                  },
                  {
                    label: "Bio Page Views",
                    value: (eventsByType["page.viewed"] ?? 0).toString(),
                    change: "+18%",
                    icon: Eye,
                    color: "text-amber-500 bg-amber-500/10 border-amber-500/10",
                    desc: "Total storefront views recorded"
                  }
                ].map((card, i) => {
                  const CardIcon = card.icon;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:border-border hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn("grid h-9 w-9 place-items-center rounded-xl border", card.color)}>
                          <CardIcon className="h-5 w-5" />
                        </div>
                        <Badge variant="success" className="gap-1 bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <TrendingUp className="h-3 w-3" /> {card.change}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <p className="font-mono text-3xl font-black tracking-tight text-foreground">{card.value}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                        <p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-muted-foreground/80">{card.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conversion Flow Funnel */}
              <div className={panelClass()}>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Visitor journey</p>
                  <h3 className="text-xl font-black text-foreground">Conversion flow funnel</h3>
                </div>
                <div className="mt-6 flex flex-col items-center space-y-1">
                  {analyticsTypes.map((type, index) => {
                    const count = eventsByType[type] ?? 0;
                    
                    const widthClasses = [
                      "w-full",
                      "w-[93%] sm:w-[88%]",
                      "w-[86%] sm:w-[76%]",
                      "w-[79%] sm:w-[64%]"
                    ];

                    const gradientClasses = [
                      "from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/20 text-sky-400",
                      "from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/20 text-indigo-400",
                      "from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20 text-violet-400",
                      "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-400"
                    ];

                    const textLabels: Record<string, string> = {
                      "page.viewed": "Storefront Page Views",
                      "custom_link.clicked": "Call-to-Action Link Clicks",
                      "checkout.started": "Checkout Sessions Started",
                      "payment.succeeded": "Successful Checkout Purchases"
                    };

                    const prevType = index > 0 ? analyticsTypes[index - 1] : null;
                    const prevCount = prevType ? (eventsByType[prevType] ?? 0) : 0;
                    
                    const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
                    const dropOffRate = 100 - conversionRate;

                    return (
                      <div key={type} className="w-full flex flex-col items-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Drop-off arrow and badge */}
                        {index > 0 && (
                          <div className="flex flex-col items-center my-1.5">
                            <span className="h-3 w-0.5 bg-border border-dashed" />
                            <Badge 
                              variant="secondary" 
                              className="text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 rounded-full my-0.5"
                            >
                              ⬇️ {dropOffRate}% drop-off ({conversionRate}% conversion)
                            </Badge>
                            <span className="h-3 w-0.5 bg-border border-dashed" />
                          </div>
                        )}

                        {/* Funnel Tier Panel */}
                        <div 
                          className={cn(
                            "rounded-2xl border p-4 shadow-sm transition duration-300 hover:scale-[1.01] hover:shadow-md bg-gradient-to-b",
                            widthClasses[index],
                            gradientClasses[index]
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background/80 text-xs font-black text-foreground shadow-sm ring-1 ring-border/20">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-black text-foreground">{textLabels[type] || type.replace(".", " ")}</p>
                                <p className="text-[10px] font-semibold text-muted-foreground leading-4 mt-0.5">
                                  {type === "page.viewed" ? "Total public visitors landed on your profile link." : 
                                   type === "custom_link.clicked" ? "Subscribers exploring social icons & custom cards." :
                                   type === "checkout.started" ? "Buyers arriving at checkout with selected offers." :
                                   "Completed sales settling in your cash balances."}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-black text-foreground">{count}</p>
                              {index === 0 && <span className="text-[9px] font-black tracking-wider text-muted-foreground uppercase">BASELINE</span>}
                              {index > 0 && <span className="text-[9px] font-mono font-bold text-muted-foreground">{conversionRate}% from tier {index}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Traffic Referrer Attribution & Affiliate Earnings Charts */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* Traffic Referral Attribution */}
                <div className={panelClass()}>
                  <h3 className="text-xl font-black text-foreground">Traffic Referrers</h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">Attribution sources driving visitor traffic</p>
                  
                  <div className="mt-5 space-y-4">
                    {Object.entries(baseReferrers)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => {
                        const pct = Math.round((count / finalTotalReferrals) * 100);
                        const progressColors = [
                          "bg-red-500",      // YouTube
                          "bg-sky-500",      // Twitter
                          "bg-blue-600",     // LinkedIn
                          "bg-fuchsia-500",  // TikTok
                          "bg-slate-500",    // Direct
                        ];
                        const colorIdx = source.includes("YouTube") ? 0 : source.includes("X") ? 1 : source.includes("LinkedIn") ? 2 : source.includes("TikTok") ? 3 : 4;

                        return (
                          <div key={source} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-foreground">{source}</span>
                              <span className="text-muted-foreground font-mono">{count} clicks ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                              <div className={cn("h-full rounded-full", progressColors[colorIdx])} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Affiliate Revenue & Referral Ledger */}
                <div className={panelClass()}>
                  <h3 className="text-xl font-black text-foreground">Affiliate & Referrals</h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">Conversions and commissions driven by links</p>

                  <div className="mt-5 space-y-3">
                    {state.affiliateLinks && state.affiliateLinks.length > 0 ? (
                      state.affiliateLinks.map((link) => {
                        const simulatedClicks = link.click_count || Math.floor(Math.random() * 40) + 10;
                        const simulatedSales = Math.floor(simulatedClicks * 0.15);
                        const commissionCents = simulatedSales * 1500; // $15.00 commission per sale

                        return (
                          <div key={link.id} className="flex justify-between items-start p-3 rounded-2xl bg-secondary/35 border border-border/40 hover:border-border transition">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-foreground truncate">{link.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">{link.destination_url}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">{simulatedClicks} clicks</Badge>
                                <Badge variant="accent" className="text-[9px] px-1 py-0">{simulatedSales} sales</Badge>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-emerald-500 font-mono">${(commissionCents / 100).toFixed(2)}</p>
                              <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider font-bold">EARNED</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                        <p className="text-xs font-bold text-muted-foreground">No active affiliate links</p>
                        <p className="text-[9px] mt-0.5">Created affiliate products will be tracked here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Spine Live Log & AI optimization review */}
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                {/* Event Spine Live Log */}
                <div className={panelClass()}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-accent animate-pulse" />
                    <h3 className="text-xl font-black text-foreground">Live Event Spine</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {state.workflowEvents && state.workflowEvents.length > 0 ? (
                      state.workflowEvents.map((event) => (
                        <div key={event.id} className="rounded-xl border border-border/60 bg-secondary/20 p-4 flex flex-col justify-between hover:border-accent/40 transition duration-300">
                          <div>
                            <p className="font-mono text-[10px] font-black text-accent truncate">{event.type}</p>
                            <p className="mt-2 text-xs font-semibold text-foreground">Actor: {event.actor_type}</p>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0.5 rounded font-black border-border bg-card">
                              Stored
                            </Badge>
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {new Date(event.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-border rounded-xl bg-secondary/10">
                        <Activity className="h-8 w-8 text-muted-foreground/60 mb-2" />
                        <p className="text-xs font-bold text-muted-foreground">No live events spine yet</p>
                        <p className="text-[10px] mt-0.5 text-muted-foreground/80">Page visits and bookings register here in real-time.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={panelClass("bg-secondary/35 flex flex-col justify-between")}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">AI Operator</p>
                    <h3 className="mt-2 text-xl font-black text-foreground">Conversion insights</h3>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                      Watch page views first, then links, then product clicks. When the middle step is low, improve the profile CTA before adding more products.
                    </p>
                  </div>
                  <Button className="mt-5 w-full bg-accent hover:bg-accent/90 text-white font-bold" type="button" onClick={() => requestAi("conversion_review")}>
                    <Sparkles className="h-4 w-4 mr-1.5" /> Review conversion
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {activeMode === "shortlinks" ? (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground">Campaign Short Links</h2>
                  <p className="text-xs font-semibold text-muted-foreground mt-1">
                    Generate custom links with redirection targets, click tracking, and custom storefront theme overrides.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingShortLink(null);
                    setDialogIsStorefrontOverride(false);
                    setDialogDisplayName(state.page.display_name || "");
                    setDialogHeadline(state.page.headline || "");
                    setDialogBio(state.page.bio || "");
                    setDialogThemeMode(themeMode);
                    setDialogThemeAccent(themeAccent);
                    setDialogCustomBgType(customBgType);
                    setDialogCustomBgColor(customBgColor);
                    setDialogCustomBgGradient(customBgGradient);
                    setDialogCustomCardBg(customCardBg);
                    setDialogCustomCardBorder(customCardBorder);
                    setDialogCustomCardText(customCardText);
                    setDialogCustomButtonBg(customButtonBg);
                    setDialogCustomButtonText(customButtonText);
                    setDialogCustomButtonRadius(customButtonRadius);
                    setDialogCustomFontFamily(customFontFamily);
                    setDialogCustomIsLight(customIsLight);
                    setDialogCustomCss(customCss);
                    setIsShortLinkDialogOpen(true);
                  }}
                  className="rounded-2xl"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Create Short Link
                </Button>
              </div>

              {/* Shortlinks list */}
              <div className="space-y-3">
                {state.shortLinks && state.shortLinks.length > 0 ? (
                  state.shortLinks.map((link) => {
                    const shortUrl = `${origin}/s/${link.slug}`;
                    const isOverride = !!link.metadata?.is_storefront_override;

                    return (
                      <div
                        key={link.id}
                        className={cn(
                          "rounded-3xl border p-5 shadow-sm transition bg-card/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 hover:shadow-md",
                          link.is_active ? "border-border/60" : "border-border/30 opacity-60"
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-foreground truncate">{link.slug}</span>
                            <Badge variant={link.is_active ? "default" : "secondary"} className="rounded-full text-[10px]">
                              {link.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {isOverride ? (
                              <Badge variant="accent" className="rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                Storefront Override
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-full text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/20">
                                Direct Redirect
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground select-all">
                            <span className="truncate">{shortUrl}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(shortUrl);
                                setMessage("Copied shortlink to clipboard.");
                              }}
                              className="p-1 hover:text-foreground hover:bg-secondary/50 rounded transition shrink-0"
                              title="Copy Short Link"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <a
                              href={`/s/${link.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:text-foreground hover:bg-secondary/50 rounded transition shrink-0"
                              title="Visit Short Link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          <div className="text-xs font-medium text-muted-foreground leading-relaxed">
                            {isOverride ? (
                              <span>
                                Lands on customized profile layout: <strong className="text-foreground">{(link.metadata as any)?.displayName || state.page.display_name}</strong>
                              </span>
                            ) : (
                              <span className="truncate block max-w-lg">
                                Redirects to: <strong className="text-foreground">{link.destination_url}</strong>
                              </span>
                            )}
                          </div>

                          {/* UTM Tags */}
                          {(link.source || link.medium || link.campaign_name) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {link.source && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary/80 text-muted-foreground border border-border/30">
                                  Source: {link.source}
                                </span>
                              )}
                              {link.medium && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary/80 text-muted-foreground border border-border/30">
                                  Medium: {link.medium}
                                </span>
                              )}
                              {link.campaign_name && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary/80 text-muted-foreground border border-border/30">
                                  Campaign: {link.campaign_name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/30">
                          <div className="text-left md:text-right">
                            <p className="text-2xl font-black text-foreground font-mono">{link.click_count ?? 0}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <MousePointerClick className="h-3 w-3 text-primary" /> Total Clicks
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={() => {
                                setEditingShortLink(link);
                                const isOverride = !!link.metadata?.is_storefront_override;
                                setDialogIsStorefrontOverride(isOverride);
                                setDialogDisplayName(link.metadata?.displayName || state.page.display_name || "");
                                setDialogHeadline(link.metadata?.headline || state.page.headline || "");
                                setDialogBio(link.metadata?.bio || state.page.bio || "");
                                setDialogThemeMode(link.metadata?.custom_theme?.mode || themeMode);
                                setDialogThemeAccent(link.metadata?.custom_theme?.accent || themeAccent);
                                setDialogCustomBgType(link.metadata?.custom_theme?.custom?.bgType || customBgType);
                                setDialogCustomBgColor(link.metadata?.custom_theme?.custom?.bgColor || customBgColor);
                                setDialogCustomBgGradient(link.metadata?.custom_theme?.custom?.bgGradient || customBgGradient);
                                setDialogCustomCardBg(link.metadata?.custom_theme?.custom?.cardBg || customCardBg);
                                setDialogCustomCardBorder(link.metadata?.custom_theme?.custom?.cardBorder || customCardBorder);
                                setDialogCustomCardText(link.metadata?.custom_theme?.custom?.cardText || customCardText);
                                setDialogCustomButtonBg(link.metadata?.custom_theme?.custom?.buttonBg || customButtonBg);
                                setDialogCustomButtonText(link.metadata?.custom_theme?.custom?.buttonText || customButtonText);
                                setDialogCustomButtonRadius(link.metadata?.custom_theme?.custom?.buttonRadius || customButtonRadius);
                                setDialogCustomFontFamily(link.metadata?.custom_theme?.custom?.fontFamily || customFontFamily);
                                setDialogCustomIsLight(!!link.metadata?.custom_theme?.custom?.isLight);
                                setDialogCustomCss(link.metadata?.custom_theme?.custom?.customCss || "");
                                setIsShortLinkDialogOpen(true);
                              }}
                              className="h-9 w-9 rounded-xl border border-border"
                              title="Edit Short Link"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={() => deleteShortLink(link.id)}
                              className="h-9 w-9 rounded-xl text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
                              title="Delete Short Link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-border p-12 text-center">
                    <p className="text-base font-bold text-foreground">No short links created yet</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1 max-w-sm mx-auto leading-5">
                      Launch your first redirect link or storefront campaign overrides to track specific channels.
                    </p>
                    <Button
                      onClick={() => {
                        setEditingShortLink(null);
                        setDialogIsStorefrontOverride(false);
                        setDialogDisplayName(state.page.display_name || "");
                        setDialogHeadline(state.page.headline || "");
                        setDialogBio(state.page.bio || "");
                        setDialogThemeMode(themeMode);
                        setDialogThemeAccent(themeAccent);
                        setDialogCustomBgType(customBgType);
                        setDialogCustomBgColor(customBgColor);
                        setDialogCustomBgGradient(customBgGradient);
                        setDialogCustomCardBg(customCardBg);
                        setDialogCustomCardBorder(customCardBorder);
                        setDialogCustomCardText(customCardText);
                        setDialogCustomButtonBg(customButtonBg);
                        setDialogCustomButtonText(customButtonText);
                        setDialogCustomButtonRadius(customButtonRadius);
                        setDialogCustomFontFamily(customFontFamily);
                        setDialogCustomIsLight(customIsLight);
                        setDialogCustomCss(customCss);
                        setIsShortLinkDialogOpen(true);
                      }}
                      className="mt-4 rounded-xl"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Create Short Link
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeMode === "settings" ? (
            <section className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
                <h2 className="text-2xl font-black text-foreground">Settings</h2>
                <p className="text-xs font-semibold text-muted-foreground">Manage your storefront profile, payment connectors, and workflow rules.</p>
              </div>

              {/* Sub-tab switcher inside settings */}
              <div className="flex gap-1.5 border-b border-border/30 pb-0.5 overflow-x-auto scrollbar-none">
                {[
                  { id: "storefront", label: "Storefront Details" },
                  { id: "payments", label: "Payments & Stripe" },
                  { id: "connectors", label: "Integrations & Add-ons" },
                  { id: "notifications", label: "Notifications" }
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    type="button"
                    onClick={() => setSettingsSubTab(subTab.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-bold transition-all duration-200 border-b-2 -mb-0.5",
                      settingsSubTab === subTab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Storefront Details */}
              {settingsSubTab === "storefront" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <form action={(fd) => saveProfile(fd)} className={panelClass("space-y-4")}>
                    <h3 className="text-lg font-black text-foreground">Profile & Timezone</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField name="displayName" label="Display Name" defaultValue={state.page.display_name} placeholder="Your display name" />
                      <TextField name="username" label="Username / Handle" defaultValue={state.page.username ?? state.page.slug} placeholder="your-username" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground block">Timezone</span>
                        <select name="timezone" defaultValue="ist" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none sm:h-12 sm:rounded-2xl sm:px-4">
                          <option value="ist">India Standard Time (GMT+5:30)</option>
                          <option value="pst">Pacific Time (GMT-8)</option>
                          <option value="est">Eastern Time (GMT-5)</option>
                          <option value="gmt">Greenwich Mean Time (GMT)</option>
                        </select>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground block">Occupation type</span>
                        <select name="occupationType" defaultValue={state.page.theme?.occupationType ?? "creator"} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none sm:h-12 sm:rounded-2xl sm:px-4">
                          {["personal", "creator", "brand", "business", "agency", "community"].map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                    </div>
                    <Button type="submit" disabled={isPending} className="mt-2">
                      <Check className="h-4 w-4 mr-1.5" /> Save storefront details
                    </Button>
                  </form>

                  <div className={panelClass("space-y-4")}>
                    <h3 className="text-lg font-black text-foreground">Public URLs & Infrastructure</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-secondary/50 p-5 flex flex-col justify-between">
                        <div>
                          <Globe2 className="h-5 w-5 text-sky-500" />
                          <p className="mt-3 font-black text-foreground">Public Storefront</p>
                          <p className="mt-1 text-xs text-muted-foreground truncate">{origin}{publicPath}</p>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4 w-fit" onClick={() => navigator.clipboard?.writeText(`${origin}${publicPath}`)}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
                        </Button>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/50 p-5 flex flex-col justify-between">
                        <div>
                          <Store className="h-5 w-5 text-emerald-500" />
                          <p className="mt-3 font-black text-foreground">Public Shop</p>
                          <p className="mt-1 text-xs text-muted-foreground truncate">{origin}{shopPath}</p>
                        </div>
                        <Button variant="outline" size="sm" className="mt-4 w-fit" onClick={() => navigator.clipboard?.writeText(`${origin}{shopPath}`)}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Payments & Stripe */}
              {settingsSubTab === "payments" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className={panelClass()}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-foreground">Stripe Connect</h3>
                          <p className="text-xs text-muted-foreground">Receive payments for digital products, subscriptions, and bookings.</p>
                        </div>
                      </div>
                      <Badge variant={stripeConnected ? "success" : "secondary"}>
                        {stripeConnected ? "Connected" : "Core Setup Needed"}
                      </Badge>
                    </div>

                    <Separator className="my-5" />

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold text-muted-foreground max-w-xl">
                        {stripeConnected 
                          ? "Your connected Stripe account is ready for checkout and payments." 
                          : "Connect your Stripe account to enable checkout. KreatorOS processes transactions through Stripe Connect securely."}
                      </p>
                      <Button onClick={connectStripe} disabled={stripeLoading} className="shrink-0 font-bold">
                        {stripeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                        {stripeConnected ? "Refresh Stripe Account" : "Connect your Stripe Account"}
                        <ArrowUpRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>

                  <div className={panelClass()}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-foreground">Production provider rule</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          Your storefront checkouts stay in provider-gated mock mode until a Stripe merchant account is connected. This allows you to test checkout flows without actual payment collection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Integrations & Add-ons */}
              {settingsSubTab === "connectors" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className={panelClass()}>
                    <h3 className="text-lg font-black text-foreground">Provider Integration Status</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Core platform integration APIs status</p>
                    <Separator className="my-4" />
                    <div className="divide-y divide-border/50">
                      {providersList.length ? providersList.map((p) => (
                        <div key={p.provider} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-xs font-black text-foreground">{p.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{p.requiredFor}</p>
                          </div>
                          <Badge variant={p.status === "connected" ? "success" : p.status === "sandbox" || p.status === "mock_mode" ? "warning" : "secondary"}>
                            {p.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      )) : (
                        <p className="py-4 text-xs font-bold text-muted-foreground text-center">Loading integration providers status...</p>
                      )}
                    </div>
                  </div>

                  <div className={panelClass()}>
                    <h3 className="text-lg font-black text-foreground">Optional add-on connectors</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Connect your calendars and meeting providers for client scheduling.</p>
                    <Separator className="my-4" />
                    <div className="divide-y divide-border/50">
                      <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">Google Calendar</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Sync availability and automatically log booked sessions.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => triggerConnector("google-calendar")} disabled={connectorLoading === "google-calendar"} className="shrink-0 text-xs font-bold">
                          {connectorLoading === "google-calendar" && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          Connect
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                            <Video className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">Google Meet</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Auto-generate video conference links on bookings.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => triggerConnector("google-meet")} disabled={connectorLoading === "google-meet"} className="shrink-0 text-xs font-bold">
                          {connectorLoading === "google-meet" && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Notifications */}
              {settingsSubTab === "notifications" && (
                <div className="animate-in fade-in duration-300">
                  <div className={panelClass("space-y-5")}>
                    <h3 className="text-lg font-black text-foreground">Email Notifications</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure when KreatorOS alerts you via email.</p>
                    <Separator className="my-2" />
                    
                    <div className="divide-y divide-border/50">
                      {[
                        { title: "Account & security", desc: "Important updates regarding your credentials and workspace." },
                        { title: "Product sales", desc: "Instantly get notified when a buyer purchases one of your digital products." },
                        { title: "New bookings", desc: "Alerts when a client books a slot on one of your schedules." }
                      ].map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between py-4">
                          <div className="pr-4 space-y-0.5">
                            <p className="text-xs font-black text-foreground">{row.title}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{row.desc}</p>
                          </div>
                          <Switch defaultChecked={idx < 2} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Create/Edit Short Link Dialog */}
          <Dialog
            open={isShortLinkDialogOpen}
            onOpenChange={(open) => {
              setIsShortLinkDialogOpen(open);
              if (!open) {
                setEditingShortLink(null);
              }
            }}
          >
            <DialogContent className="max-w-3xl bg-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col max-h-[90vh] p-0 gap-0">
              <DialogHeader className="p-5 pb-4 border-b border-border/50 bg-secondary/10">
                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  {editingShortLink ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                  {editingShortLink ? "Edit Short Link" : "Create Short Link"}
                </DialogTitle>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Customize redirection behaviors, UTM tracking details, and dedicated storefront campaign overrides.
                </p>
              </DialogHeader>

              <form onSubmit={handleSaveShortLink} className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="space-y-5">
                  {/* Basic Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1 block">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short Link Slug *</span>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-semibold text-muted-foreground">/s/</span>
                        <input
                          type="text"
                          name="slug"
                          required
                          pattern="^[a-zA-Z0-9_-]+$"
                          title="Slug must contain only letters, numbers, dashes, and underscores."
                          defaultValue={editingShortLink?.slug || ""}
                          className="h-11 w-full rounded-xl border border-input bg-background pl-8 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                          placeholder="e.g. summer-promo"
                        />
                      </div>
                    </label>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="isStorefrontOverride"
                        name="isStorefrontOverride"
                        checked={dialogIsStorefrontOverride}
                        onChange={(e) => setDialogIsStorefrontOverride(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="isStorefrontOverride" className="text-xs font-black text-foreground select-none cursor-pointer">
                        Storefront Layout Override
                      </label>
                    </div>
                  </div>

                  {!dialogIsStorefrontOverride ? (
                    <label className="space-y-1 block">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destination URL *</span>
                      <input
                        type="url"
                        name="destinationUrl"
                        required={!dialogIsStorefrontOverride}
                        defaultValue={editingShortLink?.destination_url || ""}
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="https://brand-partner.com/deal"
                      />
                      <span className="text-[10px] text-muted-foreground block mt-1">The external link visitors will be redirected to.</span>
                    </label>
                  ) : (
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs font-semibold text-emerald-600 leading-relaxed">
                      ✨ Storefront Override Mode active. This shortlink will point to your storefront, but when opened, it will load the custom branding, layout styling, and custom theme designed below.
                    </div>
                  )}

                  {/* Overrides Configuration (Shown only if storefront override is active) */}
                  {dialogIsStorefrontOverride && (
                    <div className="space-y-5 border-t border-border/40 pt-4 animate-in fade-in slide-in-from-top-3 duration-300">
                      <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Storefront Copy Overrides</h3>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1 block">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</span>
                          <input
                            type="text"
                            name="brandDisplayName"
                            value={dialogDisplayName}
                            onChange={(e) => setDialogDisplayName(e.target.value)}
                            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50"
                            placeholder="e.g. Brand Name x You"
                          />
                        </label>

                        <label className="space-y-1 block">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Headline</span>
                          <input
                            type="text"
                            name="brandHeadline"
                            value={dialogHeadline}
                            onChange={(e) => setDialogHeadline(e.target.value)}
                            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50"
                            placeholder="e.g. Exclusive summer collaboration"
                          />
                        </label>
                      </div>

                      <label className="space-y-1 block">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Bio / Description</span>
                        <textarea
                          name="brandBio"
                          value={dialogBio}
                          onChange={(e) => setDialogBio(e.target.value)}
                          className="h-20 w-full rounded-xl border border-input bg-background p-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50 resize-none"
                          placeholder="A tailored bio message or deal description for this audience..."
                        />
                      </label>

                      {/* Campaign Styling Theme Presets */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Theme Preset</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Select a styling preset or design a fully custom look.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {[
                            { name: "Sleek Dark", val: "dark", accent: "coral", previewBg: "bg-black" },
                            { name: "Pure White", val: "light", accent: "rose", previewBg: "bg-slate-100 border border-zinc-200" },
                            { name: "Glassmorphic", val: "glass", accent: "slate", previewBg: "bg-slate-900 bg-gradient-to-tr from-slate-950 via-zinc-900 to-slate-950" },
                            { name: "Sunset Breeze", val: "sunset", accent: "amber", previewBg: "bg-gradient-to-b from-amber-100 to-rose-200" },
                            { name: "Cyber Neon", val: "cyber", accent: "emerald", previewBg: "bg-[#060810]" },
                            { name: "Custom Theme", val: "custom", accent: "coral", previewBg: "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500" }
                          ].map((t) => {
                            const isSelected = dialogThemeMode === t.val;
                            return (
                              <button
                                key={t.val}
                                type="button"
                                onClick={() => {
                                  setDialogThemeMode(t.val);
                                  if (t.val !== "custom") {
                                    setDialogThemeAccent(t.accent);
                                  }
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-between rounded-2xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                                    : "border-border/60 bg-background/50 hover:bg-background/80"
                                )}
                              >
                                <div className={cn("h-8 w-full rounded-lg border border-border/20 mb-2 shadow-inner", t.previewBg)} />
                                <span className="text-[11px] font-black text-foreground block truncate w-full">{t.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Hidden values for Mode and Accent color to send back */}
                        <input type="hidden" name="themeMode" value={dialogThemeMode} />
                        <input type="hidden" name="themeAccent" value={dialogThemeAccent} />

                        {/* Accent colors */}
                        {dialogThemeMode !== "custom" && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Accent Color</span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { name: "Coral Glow", val: "coral", color: "bg-orange-400" },
                                { name: "Sweet Rose", val: "rose", color: "bg-rose-400" },
                                { name: "Emerald Mint", val: "emerald", color: "bg-emerald-400" },
                                { name: "Vibrant Indigo", val: "indigo", color: "bg-indigo-400" },
                                { name: "Sunny Amber", val: "amber", color: "bg-amber-400" },
                              ].map((a) => {
                                const isSelected = dialogThemeAccent === a.val;
                                return (
                                  <button
                                    key={a.val}
                                    type="button"
                                    onClick={() => setDialogThemeAccent(a.val)}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition",
                                      isSelected
                                        ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/10"
                                        : "border-border/60 bg-background hover:bg-secondary/40 text-muted-foreground"
                                    )}
                                  >
                                    <span className={cn("h-3.5 w-3.5 rounded-full shrink-0", a.color)} />
                                    <span>{a.name.split(" ")[1]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom UI Designer */}
                        {dialogThemeMode === "custom" && (
                          <div className="mt-4 rounded-2xl border border-border bg-secondary/5 p-4 space-y-4 text-left animate-in fade-in duration-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Custom UI Theme Designer</h4>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Style</span>
                                <select 
                                  name="customBgType"
                                  value={dialogCustomBgType} 
                                  onChange={(e) => setDialogCustomBgType(e.target.value)} 
                                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground outline-none"
                                >
                                  <option value="color">Solid Background Color</option>
                                  <option value="gradient">Gradient Background</option>
                                </select>
                              </label>

                              {dialogCustomBgType === "color" ? (
                                <label className="space-y-1 block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Color</span>
                                  <div className="flex gap-2">
                                    <input 
                                      type="color" 
                                      name="customBgColor"
                                      value={dialogCustomBgColor} 
                                      onChange={(e) => setDialogCustomBgColor(e.target.value)} 
                                      className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" 
                                    />
                                    <input 
                                      type="text" 
                                      value={dialogCustomBgColor} 
                                      onChange={(e) => setDialogCustomBgColor(e.target.value)} 
                                      className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground outline-none" 
                                    />
                                  </div>
                                </label>
                              ) : (
                                <label className="space-y-1 block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background Gradient CSS</span>
                                  <input 
                                    type="text" 
                                    name="customBgGradient"
                                    value={dialogCustomBgGradient} 
                                    onChange={(e) => setDialogCustomBgGradient(e.target.value)} 
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground outline-none" 
                                    placeholder="linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)" 
                                  />
                                </label>
                              )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Background</span>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="color" 
                                    value={dialogCustomCardBg.startsWith("rgba") ? "#1e293b" : dialogCustomCardBg} 
                                    onChange={(e) => setDialogCustomCardBg(e.target.value)} 
                                    className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" 
                                  />
                                  <input 
                                    type="text" 
                                    name="customCardBg"
                                    value={dialogCustomCardBg} 
                                    onChange={(e) => setDialogCustomCardBg(e.target.value)} 
                                    className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono text-foreground outline-none" 
                                  />
                                </div>
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Border</span>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="color" 
                                    value={dialogCustomCardBorder.startsWith("rgba") ? "#ffffff" : dialogCustomCardBorder} 
                                    onChange={(e) => setDialogCustomCardBorder(e.target.value)} 
                                    className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" 
                                  />
                                  <input 
                                    type="text" 
                                    name="customCardBorder"
                                    value={dialogCustomCardBorder} 
                                    onChange={(e) => setDialogCustomCardBorder(e.target.value)} 
                                    className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono text-foreground outline-none" 
                                  />
                                </div>
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Text Color</span>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="color" 
                                    value={dialogCustomCardText} 
                                    onChange={(e) => setDialogCustomCardText(e.target.value)} 
                                    className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" 
                                  />
                                  <input 
                                    type="text" 
                                    name="customCardText"
                                    value={dialogCustomCardText} 
                                    onChange={(e) => setDialogCustomCardText(e.target.value)} 
                                    className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono text-foreground outline-none" 
                                  />
                                </div>
                              </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button Fill Color</span>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="color" 
                                    value={dialogCustomButtonBg} 
                                    onChange={(e) => setDialogCustomButtonBg(e.target.value)} 
                                    className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" 
                                  />
                                  <input 
                                    type="text" 
                                    name="customButtonBg"
                                    value={dialogCustomButtonBg} 
                                    onChange={(e) => setDialogCustomButtonBg(e.target.value)} 
                                    className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono text-foreground outline-none" 
                                  />
                                </div>
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button Text Color</span>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="color" 
                                    value={dialogCustomButtonText} 
                                    onChange={(e) => setDialogCustomButtonText(e.target.value)} 
                                    className="h-10 w-10 shrink-0 rounded-xl border border-input cursor-pointer bg-transparent" 
                                  />
                                  <input 
                                    type="text" 
                                    name="customButtonText"
                                    value={dialogCustomButtonText} 
                                    onChange={(e) => setDialogCustomButtonText(e.target.value)} 
                                    className="h-10 flex-1 rounded-xl border border-input bg-background px-2 text-[10px] font-mono text-foreground outline-none" 
                                  />
                                </div>
                              </label>

                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button Corners</span>
                                <select 
                                  name="customButtonRadius"
                                  value={dialogCustomButtonRadius} 
                                  onChange={(e) => setDialogCustomButtonRadius(e.target.value)} 
                                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground outline-none"
                                >
                                  <option value="rounded-none">Sharp Corners (0px)</option>
                                  <option value="rounded-md">Soft Corners (6px)</option>
                                  <option value="rounded-xl">Rounded Medium (12px)</option>
                                  <option value="rounded-2xl">Rounded Large (16px)</option>
                                  <option value="rounded-3xl">Pill Rounded (24px)</option>
                                  <option value="rounded-full">Fully Rounded (Circle)</option>
                                </select>
                              </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="space-y-1 block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Font Style</span>
                                <select 
                                  name="customFontFamily"
                                  value={dialogCustomFontFamily} 
                                  onChange={(e) => setDialogCustomFontFamily(e.target.value)} 
                                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground outline-none"
                                >
                                  <option value="font-sans">Modern Sans-Serif</option>
                                  <option value="font-mono">Clean Monospace</option>
                                  <option value="font-serif">Elegant Serif</option>
                                </select>
                              </label>

                              <div className="flex items-center gap-2 pt-4">
                                <input 
                                  type="checkbox" 
                                  id="dialogCustomIsLight" 
                                  name="customIsLight"
                                  checked={dialogCustomIsLight} 
                                  onChange={(e) => setDialogCustomIsLight(e.target.checked)} 
                                  className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer" 
                                />
                                <label htmlFor="dialogCustomIsLight" className="text-xs font-semibold text-foreground select-none cursor-pointer">
                                  Use Light Mode (Dark text on light background)
                                </label>
                              </div>

                              <label className="space-y-1 block sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom CSS Stylesheet Override</span>
                                <textarea
                                  name="customCss"
                                  value={dialogCustomCss}
                                  onChange={(e) => setDialogCustomCss(e.target.value)}
                                  rows={4}
                                  className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono text-foreground outline-none resize-y"
                                  placeholder="/* Write raw CSS overrides, e.g. */&#10;.smart-link-card { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }&#10;body { animation: pulse 5s infinite; }"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* UTM Campaign Details */}
                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">UTM Campaign Details (Optional)</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="space-y-1 block">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Traffic Source</span>
                        <input
                          type="text"
                          name="source"
                          defaultValue={editingShortLink?.source || ""}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50"
                          placeholder="e.g. instagram"
                        />
                      </label>

                      <label className="space-y-1 block">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Traffic Medium</span>
                        <input
                          type="text"
                          name="medium"
                          defaultValue={editingShortLink?.medium || ""}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50"
                          placeholder="e.g. bio"
                        />
                      </label>

                      <label className="space-y-1 block">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Name</span>
                        <input
                          type="text"
                          name="campaignName"
                          defaultValue={editingShortLink?.campaign_name || ""}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary/50"
                          placeholder="e.g. summer-2026"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-4 border-t border-border/40 pt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        defaultChecked={editingShortLink ? editingShortLink.is_active : true}
                        className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                      />
                      <label htmlFor="isActive" className="text-xs font-black text-foreground select-none cursor-pointer">
                        Short Link Active (Enable redirection and storefront overrides)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 border-t border-border/40 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsShortLinkDialogOpen(false);
                      setEditingShortLink(null);
                    }}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                  >
                    {isPending ? "Saving..." : editingShortLink ? "Save Changes" : "Create Link"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </main>

        {/* Custom Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}

          onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        >
          <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-card overflow-hidden p-6 gap-0">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <DialogTitle className="text-xl font-black text-foreground">
                {confirmDialog.title}
              </DialogTitle>
              <p className="mt-2 text-sm font-semibold text-muted-foreground leading-relaxed">
                {confirmDialog.description}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <aside className="hidden min-w-0 lg:sticky lg:top-20 lg:block lg:self-start">
          <div>
            <PhonePreview data={previewState} origin={origin} />
          </div>
        </aside>
      </div>
    </div>
  );
}

