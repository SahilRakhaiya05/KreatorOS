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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SocialIcon } from "@/components/ui/socialIcon";

type Mode =
  | "dashboard"
  | "profile"
  | "builder"
  | "products"
  | "product-new"
  | "wallet"
  | "affiliate"
  | "referrals"
  | "assistant"
  | "analytics"
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
  orders: Array<Record<string, any>>;
  analyticsEvents: Array<Record<string, any>>;
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

function PhonePreview({ data, origin }: { data: LinkCommerceData; origin: string }) {
  const page = data.page;
  const visibleProducts = data.products.filter((product) => product.status === "published" && product.show_on_bio);

  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[32px] border border-sky-300/20 bg-[#07111f] p-1.5 shadow-[0_18px_50px_rgba(14,165,233,.14)] xl:max-w-[300px] xl:rounded-[36px] 2xl:max-w-[320px]">
      <div className="flex h-[min(560px,calc(100vh-7rem))] flex-col overflow-hidden rounded-[26px] bg-black xl:rounded-[30px]">
        <div className="h-28 shrink-0 bg-gradient-to-br from-sky-950 via-blue-950 to-zinc-950 xl:h-32">
          {page.background_image_url ? <img src={page.background_image_url} alt="" className="h-full w-full object-cover opacity-75" /> : null}
        </div>
        <div className="-mt-10 flex flex-1 flex-col px-4 pb-5 text-center xl:-mt-12">
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" className="mx-auto h-20 w-20 rounded-full border-4 border-black object-cover xl:h-24 xl:w-24" />
          ) : (
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-black bg-gradient-to-br from-primary to-accent text-2xl font-black text-primary-foreground xl:h-24 xl:w-24">
              {(page.display_name ?? "C").slice(0, 1)}
            </div>
          )}
          <h2 className="mt-3 text-xl font-black tracking-tight text-white xl:text-2xl">{page.display_name}</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-300">@{page.username || page.slug}</p>
          <p className="mx-auto mt-3 max-w-xs text-xs font-semibold leading-5 text-zinc-200 xl:text-sm xl:leading-6">{page.bio || page.headline || "Add a bio to tell visitors what to buy, book, or explore."}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:scale-110 hover:bg-white/20"
                title={link.platform}
              >
                <SocialIcon platform={link.platform} className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {data.customLinks.slice(0, 3).map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-left">
                <span className="truncate text-sm font-black text-white">{link.title}</span>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </div>
            ))}
            {visibleProducts.slice(0, 2).map((product) => (
              <div key={product.id} className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Product</p>
                <p className="mt-1 truncate text-sm font-black text-white">{product.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{money(product.price_cents, product.currency)}</p>
              </div>
            ))}
            {data.gallery.slice(0, 2).map((item) => (
              <img key={item.id} src={item.image_url} alt={item.alt_text ?? ""} className="h-24 w-full rounded-2xl object-cover" />
            ))}
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-left">
            <p className="text-sm font-black text-white">AI shopping guide</p>
            <p className="mt-1 text-xs text-zinc-400">{data.assistant?.greeting || data.assistant?.welcome_message || "Ask what product, call, or link is right for you."}</p>
          </div>
          <p className="mt-4 break-words text-[10px] font-bold leading-4 text-zinc-600">{origin}/u/{page.username || page.slug}</p>
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
    case "instagram": return "border-[#E1306C] shadow-[0_0_12px_rgba(225,48,108,0.2)] bg-[#E1306C]/5";
    case "x / twitter":
    case "x":
    case "twitter": return "border-white shadow-[0_0_12px_rgba(255,255,255,0.12)] bg-white/5";
    case "facebook": return "border-[#1877F2] shadow-[0_0_12px_rgba(24,119,242,0.2)] bg-[#1877F2]/5";
    case "reddit": return "border-[#FF4500] shadow-[0_0_12px_rgba(255,69,0,0.2)] bg-[#FF4500]/5";
    case "pinterest": return "border-[#BD081C] shadow-[0_0_12px_rgba(189,8,28,0.2)] bg-[#BD081C]/5";
    case "threads": return "border-white shadow-[0_0_12px_rgba(255,255,255,0.12)] bg-white/5";
    case "youtube": return "border-[#FF0000] shadow-[0_0_12px_rgba(255,0,0,0.2)] bg-[#FF0000]/5";
    case "tiktok": return "border-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.2)] bg-[#00f2fe]/5";
    case "twitch": return "border-[#9146FF] shadow-[0_0_12px_rgba(145,70,255,0.2)] bg-[#9146FF]/5";
    case "vimeo": return "border-[#1AB7EA] shadow-[0_0_12px_rgba(26,183,234,0.2)] bg-[#1AB7EA]/5";
    case "spotify": return "border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.2)] bg-[#1DB954]/5";
    case "soundcloud": return "border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.2)] bg-[#FF5500]/5";
    case "apple music": return "border-[#FC3C44] shadow-[0_0_12px_rgba(252,60,68,0.2)] bg-[#FC3C44]/5";
    case "youtube music": return "border-[#FF0000] shadow-[0_0_12px_rgba(255,0,0,0.2)] bg-[#FF0000]/5";
    case "bandcamp": return "border-[#629AA9] shadow-[0_0_12px_rgba(98,154,169,0.2)] bg-[#629AA9]/5";
    case "mixcloud": return "border-[#52AAD8] shadow-[0_0_12px_rgba(82,170,216,0.2)] bg-[#52AAD8]/5";
    case "whatsapp": return "border-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.2)] bg-[#25D366]/5";
    case "telegram": return "border-[#0088cc] shadow-[0_0_12px_rgba(0,136,204,0.2)] bg-[#0088cc]/5";
    case "discord": return "border-[#5865F2] shadow-[0_0_12px_rgba(88,101,242,0.2)] bg-[#5865F2]/5";
    case "snapchat": return "border-[#FFFC00] shadow-[0_0_12px_rgba(255,252,0,0.2)] bg-[#FFFC00]/5";
    case "linkedin": return "border-[#0A66C2] shadow-[0_0_12px_rgba(10,102,194,0.2)] bg-[#0A66C2]/5";
    case "github": return "border-zinc-400 shadow-[0_0_12px_rgba(255,255,255,0.08)] bg-zinc-800/10";
    default: return "border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)] bg-primary/5";
  }
}

export function LinkCommerceStudio({ data, mode = "dashboard" }: { data: LinkCommerceData; mode?: Mode }) {
  const [state, setState] = useState(data);
  const [activeMode, setActiveMode] = useState<Mode>(mode);
  const [origin, setOrigin] = useState("current-domain");
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(data.page.avatar_url ?? "");
  const [backgroundUrl, setBackgroundUrl] = useState(data.page.background_image_url ?? "");
  const [coverUrl, setCoverUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [isPending, startTransition] = useTransition();

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Social");
  const [socialUrl, setSocialUrl] = useState<string>("");
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const checklist = setupItems(state);
  const completed = checklist.filter((item) => item.done).length;
  const progress = Math.round((completed / checklist.length) * 100);
  const publicPath = `/u/${state.page.username || state.page.slug}`;
  const shopPath = `${publicPath}/shop`;

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

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

  function saveProfile(formData: FormData, status?: "draft" | "published") {
    const username = String(formData.get("username") ?? state.page.username ?? state.page.slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    post(
      "profile",
      {
        pageId: state.page.id,
        displayName: String(formData.get("displayName") ?? ""),
        username,
        headline: String(formData.get("headline") ?? ""),
        bio: String(formData.get("bio") ?? ""),
        avatarUrl,
        backgroundImageUrl: backgroundUrl,
        occupationType: String(formData.get("occupationType") ?? "creator"),
        totalFollowers: Number(formData.get("totalFollowers") ?? 0),
        status: status ?? state.page.status ?? "draft",
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

  function addCustomLink(formData: FormData) {
    post(
      "custom-links",
      {
        pageId: state.page.id,
        title: String(formData.get("title") ?? ""),
        url: String(formData.get("url") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
      (payload) => setState((prev) => ({ ...prev, customLinks: [payload.customLink, ...prev.customLinks] })),
    );
  }

  function addGalleryImage(imageUrl: string) {
    post(
      "gallery",
      { pageId: state.page.id, imageUrl, caption: "Gallery image" },
      (payload) => setState((prev) => ({ ...prev, gallery: [payload.galleryItem, ...prev.gallery] })),
    );
  }

  function addProduct(formData: FormData) {
    post(
      "products",
      {
        pageId: state.page.id,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        priceCents: Math.max(0, Math.round(Number(formData.get("price") ?? 0) * 100)),
        currency: "usd",
        coverImageUrl: coverUrl,
        filePath,
        externalDeliveryUrl: String(formData.get("externalDeliveryUrl") ?? ""),
        showOnBio: formData.get("showOnBio") === "on",
        showOnShop: formData.get("showOnShop") === "on",
        status: formData.get("publish") === "on" ? "published" : "draft",
      },
      (payload) => setState((prev) => ({ ...prev, products: [payload.product, ...prev.products], offers: [payload.offer, ...prev.offers] })),
    );
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
  const analyticsTypes = ["page.viewed", "custom_link.clicked", "product.clicked", "checkout.started"];
  const maxAnalyticsCount = Math.max(1, ...analyticsTypes.map((type) => eventsByType[type] ?? 0));
  const recentEvents = state.analyticsEvents.slice(0, 6);

  const showProfile = activeMode === "dashboard" || activeMode === "profile" || activeMode === "builder";
  const showProducts = activeMode === "products" || activeMode === "product-new";

  return (
    <div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-5 sm:space-y-6">
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
                <form action={addCustomLink} className={panelClass("bg-secondary/30 shadow-none")}>
                  <h3 className="text-xl font-black text-foreground">Custom links</h3>
                  <div className="mt-4 grid gap-3">
                    <TextField name="title" label="Title" placeholder="Newsletter, latest video, community" />
                    <TextField name="url" label="URL" placeholder="https://example.com" />
                    <TextField name="description" label="Description" placeholder="Why visitors should click" />
                    <Button><Plus className="h-4 w-4" /> Add link</Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {state.customLinks.map((link) => <p key={link.id} className="rounded-2xl bg-background px-4 py-3 text-sm font-bold text-foreground">{link.title}</p>)}
                    {!state.customLinks.length ? <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">No custom links yet.</p> : null}
                  </div>
                </form>

                <div className={panelClass("bg-secondary/30 shadow-none")}>
                  <h3 className="text-xl font-black text-foreground">Photo gallery</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">Upload public gallery images for the bio builder and mobile preview.</p>
                  <div className="mt-4">
                    <UploadField label="Upload gallery image" bucket="gallery" onUploaded={addGalleryImage} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {state.gallery.slice(0, 6).map((item) => (
                      <img key={item.id} src={item.image_url} alt={item.alt_text ?? ""} className="aspect-square rounded-2xl object-cover" />
                    ))}
                    {!state.gallery.length ? <p className="col-span-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">No gallery photos yet.</p> : null}
                  </div>
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
                    <div key={product.id} className="rounded-3xl border border-border bg-secondary/40 p-4">
                      <div className="grid h-28 place-items-center overflow-hidden rounded-2xl bg-background">
                        {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-muted-foreground" />}
                      </div>
                      <Badge variant="secondary" className="mt-4">{product.status}</Badge>
                      <h3 className="mt-3 text-lg font-black text-foreground">{product.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{money(product.price_cents, product.currency)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description || "No description yet."}</p>
                    </div>
                  ))}
                  {!state.products.length ? <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground md:col-span-3">No products yet. Add the first file-backed product.</div> : null}
                </div>
              </div>

              {activeMode === "product-new" ? (
                <form action={addProduct} className={panelClass()}>
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
            <section className={panelClass()}>
              <h2 className="text-2xl font-black text-foreground">Affiliate links</h2>
              <form action={addAffiliate} className="mt-5 grid gap-4">
                <TextField name="title" label="Title" placeholder="My favorite camera kit" />
                <TextField name="destinationUrl" label="Affiliate URL" placeholder="https://..." />
                <TextField name="network" label="Network" placeholder="Amazon, PartnerStack..." />
                <TextField name="commissionNote" label="Commission note" placeholder="I may earn a commission." />
                <Button><Plus className="h-4 w-4" /> Add affiliate link</Button>
              </form>
            </section>
          ) : null}

          {activeMode === "referrals" ? (
            <section className={panelClass()}>
              <h2 className="text-2xl font-black text-foreground">Referral program</h2>
              <form action={saveReferral} className="mt-5 grid gap-4">
                <TextField name="title" label="Title" defaultValue={state.referralProgram?.title ?? "Refer a friend"} />
                <TextArea name="description" label="Description" defaultValue={state.referralProgram?.description} />
                <TextField name="rewardType" label="Reward type" defaultValue={state.referralProgram?.reward_type ?? "discount"} />
                <TextField name="rewardValue" label="Reward value" defaultValue={state.referralProgram?.reward_value ?? "20%"} />
                <TextArea name="terms" label="Terms" defaultValue={state.referralProgram?.terms} />
                <Button><Share2 className="h-4 w-4" /> Enable referrals</Button>
              </form>
            </section>
          ) : null}

          {activeMode === "assistant" ? (
            <section className={panelClass()}>
              <h2 className="text-2xl font-black text-foreground">Public AI assistant</h2>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">Suggestions are scoped to published page and product data only.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {["generate_bio", "product_ideas", "page_sections", "improve_cta", "brand_inquiry_copy", "seo_metadata", "conversion_review"].map((action) => (
                  <Button key={action} variant="secondary" type="button" onClick={() => requestAi(action)}>
                    <Sparkles className="h-4 w-4" /> {action.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </section>
          ) : null}

          {activeMode === "analytics" ? (
            <section className="space-y-5">
              <div className={panelClass()}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Live signal</p>
                    <h2 className="mt-2 text-2xl font-black text-foreground">Real analytics</h2>
                  </div>
                  <Badge variant="secondary" className="w-fit rounded-full">{state.analyticsEvents.length} total events</Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {analyticsTypes.map((type) => (
                    <div key={type} className="rounded-3xl bg-secondary/60 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{type}</p>
                      <p className="mt-2 text-3xl font-black text-foreground">{eventsByType[type] ?? 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={panelClass()}>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Visitor journey</p>
                  <h3 className="text-xl font-black text-foreground">Conversion flow</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {analyticsTypes.map((type, index) => {
                    const count = eventsByType[type] ?? 0;
                    const width = Math.max(6, Math.round((count / maxAnalyticsCount) * 100));
                    return (
                      <div key={type} className="rounded-3xl border border-border bg-secondary/35 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-background text-sm font-black text-foreground shadow-sm">{index + 1}</span>
                            <div>
                              <p className="text-sm font-black text-foreground">{type.replace(".", " ")}</p>
                              <p className="text-xs font-semibold text-muted-foreground">Step {index + 1} in the storefront funnel</p>
                            </div>
                          </div>
                          <p className="text-lg font-black text-foreground">{count}</p>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className={panelClass()}>
                  <h3 className="text-xl font-black text-foreground">Recent activity</h3>
                  <div className="mt-4 space-y-2">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-foreground">{event.event_type}</p>
                          <p className="text-xs font-semibold text-muted-foreground">{event.entity_type ?? "storefront"} event</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 rounded-full">live</Badge>
                      </div>
                    ))}
                    {!recentEvents.length ? (
                      <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm font-bold text-muted-foreground">
                        No analytics yet. Public traffic will appear here as events arrive.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className={panelClass("bg-secondary/35")}>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Next read</p>
                  <h3 className="mt-2 text-xl font-black text-foreground">Improve the path</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
                    Watch views first, then links, then product clicks. When the middle step is low, improve the profile CTA before adding more products.
                  </p>
                  <Button className="mt-5 w-full" type="button" onClick={() => requestAi("conversion_review")}>
                    <Sparkles className="h-4 w-4" /> Review flow
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {activeMode === "settings" ? (
            <section className={panelClass()}>
              <h2 className="text-2xl font-black text-foreground">Settings</h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl border border-border bg-secondary/50 p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><p className="mt-3 font-black text-foreground">Production provider rule</p><p className="mt-1 text-sm text-muted-foreground">Checkout stays provider-gated until Stripe is connected.</p></div>
                <div className="rounded-3xl border border-border bg-secondary/50 p-5"><Globe2 className="h-5 w-5 text-sky-600" /><p className="mt-3 font-black text-foreground">Public URLs</p><p className="mt-1 text-sm text-muted-foreground">{origin}{publicPath} and {origin}{shopPath}</p></div>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="hidden min-w-0 lg:sticky lg:top-20 lg:block lg:self-start">
          <div>
            <PhonePreview data={state} origin={origin} />
          </div>
        </aside>
      </div>
    </div>
  );
}

