"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Bot,
  Check,
  Copy,
  ExternalLink,
  FileUp,
  GalleryHorizontal,
  Globe2,
  Handshake,
  ImagePlus,
  Link as LinkIcon,
  Mail,
  PackagePlus,
  Phone,
  Plus,
  RefreshCw,
  Rocket,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TicketPercent,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const modeNav = [
  { mode: "profile", label: "Profile and Links", icon: LinkIcon },
  { mode: "products", label: "Store", icon: ShoppingBag },
  { mode: "wallet", label: "Wallet", icon: BadgeDollarSign },
  { mode: "affiliate", label: "Affiliate Links", icon: TicketPercent },
  { mode: "referrals", label: "Refer and Earn", icon: Share2 },
  { mode: "assistant", label: "AI Assistant", icon: Bot },
  { mode: "analytics", label: "Analytics", icon: Sparkles },
  { mode: "settings", label: "Settings", icon: Globe2 },
] satisfies Array<{ mode: Mode; label: string; icon: typeof LinkIcon }>;

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
    { label: "Link or product added", done: data.customLinks.length > 0 || data.products.length > 0 },
    { label: "Payment connected", done: false },
    { label: "Page published", done: data.page.status === "published" || data.page.is_published },
  ];
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
      <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-rose-300/50 focus:bg-white/[0.09] focus:ring-4 focus:ring-rose-400/10"
      />
    </label>
  );
}

function TextArea({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string | null; placeholder?: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-rose-300/50 focus:bg-white/[0.09] focus:ring-4 focus:ring-rose-400/10"
      />
    </label>
  );
}

function UploadField({
  label,
  bucket,
  workspaceId,
  onUploaded,
  privateFile = false,
}: {
  label: string;
  bucket: string;
  workspaceId: string;
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
    form.append("workspaceId", workspaceId);
    const res = await fetch("/api/link-commerce/uploads", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);
    if (json?.ok) {
      onUploaded(privateFile ? json.data.path : json.data.publicUrl);
      setStatus(privateFile ? "Private file uploaded." : "Asset uploaded.");
    } else {
      setStatus(json?.error?.message ?? "Upload failed.");
    }
  }

  return (
    <label className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-center transition hover:border-rose-300/40">
      <input type="file" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-zinc-300">
        {privateFile ? <FileUp className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-black text-white">{uploading ? "Uploading..." : label}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-500">{status || (privateFile ? "Private product delivery file" : "Public page asset")}</p>
    </label>
  );
}

function PhonePreview({ data, origin }: { data: LinkCommerceData; origin: string }) {
  const page = data.page;
  const visibleProducts = data.products.filter((product) => product.status === "published" && product.show_on_bio);

  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[42px] border border-sky-300/20 bg-[#07111f] p-2 shadow-[0_30px_90px_rgba(14,165,233,.18)]">
      <div className="h-[720px] overflow-hidden rounded-[34px] bg-black">
        <div className="h-44 bg-gradient-to-br from-sky-950 via-blue-950 to-zinc-950">
          {page.background_image_url ? <img src={page.background_image_url} alt="" className="h-full w-full object-cover opacity-75" /> : null}
        </div>
        <div className="-mt-14 px-5 text-center">
          {page.avatar_url ? (
            <img src={page.avatar_url} alt="" className="mx-auto h-28 w-28 rounded-full border-4 border-black object-cover" />
          ) : (
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-black bg-gradient-to-br from-rose-400 to-orange-300 text-3xl font-black text-zinc-950">
              {(page.display_name ?? "C").slice(0, 1)}
            </div>
          )}
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white">{page.display_name}</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-300">@{page.username || page.slug}</p>
          <p className="mx-auto mt-4 max-w-xs text-sm font-semibold leading-6 text-zinc-200">{page.bio || page.headline || "Add a bio to tell visitors what to buy, book, or explore."}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.socialLinks.slice(0, 8).map((link) => (
              <span key={link.id} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
                {link.platform}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {data.customLinks.slice(0, 3).map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-left">
                <span className="truncate text-sm font-black text-white">{link.title}</span>
                <ArrowUpRight className="h-4 w-4 text-rose-300" />
              </div>
            ))}
            {visibleProducts.slice(0, 2).map((product) => (
              <div key={product.id} className="rounded-2xl border border-rose-200/20 bg-rose-300/10 p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-200">Product</p>
                <p className="mt-1 truncate text-sm font-black text-white">{product.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{money(product.price_cents, product.currency)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-left">
            <p className="text-sm font-black text-white">AI shopping guide</p>
            <p className="mt-1 text-xs text-zinc-400">{data.assistant?.greeting || data.assistant?.welcome_message || "Ask what product, call, or link is right for you."}</p>
          </div>
          <p className="mt-5 text-[11px] font-bold text-zinc-600">{origin}/u/{page.username || page.slug}</p>
        </div>
      </div>
    </div>
  );
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
  const checklist = setupItems(state);
  const progress = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
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
        workspaceId: state.workspace.id,
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

  function addSocial(platform: string, category: string) {
    const url = window.prompt(`Paste your ${platform} URL`);
    if (!url) return;
    post(
      "social-links",
      { workspaceId: state.workspace.id, pageId: state.page.id, platform, category, url, label: platform },
      (payload) => setState((prev) => ({ ...prev, socialLinks: [payload.socialLink, ...prev.socialLinks] })),
    );
  }

  function addCustomLink(formData: FormData) {
    post(
      "custom-links",
      {
        workspaceId: state.workspace.id,
        pageId: state.page.id,
        title: String(formData.get("title") ?? ""),
        url: String(formData.get("url") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
      (payload) => setState((prev) => ({ ...prev, customLinks: [payload.customLink, ...prev.customLinks] })),
    );
  }

  function addProduct(formData: FormData) {
    post(
      "products",
      {
        workspaceId: state.workspace.id,
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
        workspaceId: state.workspace.id,
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
        workspaceId: state.workspace.id,
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
        workspaceId: state.workspace.id,
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
      workspaceId: state.workspace.id,
      pageId: state.page.id,
      action,
      context: { page: state.page, productCount: state.products.length, linkCount: state.customLinks.length },
    });
  }

  const eventsByType = state.analyticsEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen rounded-[2rem] bg-[#050505] p-3 text-white md:p-5">
      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_390px]">
        <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
          <button type="button" onClick={() => setActiveMode("dashboard")} className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-400 text-zinc-950">
              <Rocket className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.38em] text-zinc-500">CreatorOS</p>
              <p className="font-black">Smart Link</p>
            </div>
          </button>
          <div className="mt-8 space-y-2">
            {modeNav.map((item) => {
              const Icon = item.icon;
              const active = activeMode === item.mode || (activeMode === "product-new" && item.mode === "products");
              return (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setActiveMode(item.mode)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-black transition",
                    active ? "bg-white/[0.12] text-white ring-1 ring-white/15" : "text-zinc-500 hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  <span className="flex items-center gap-3"><Icon className="h-4 w-4" /> {item.label}</span>
                  {active ? <ArrowUpRight className="h-4 w-4 text-rose-300" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-4">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-zinc-500">Setup checklist</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-rose-300/80 text-lg font-black">{progress}%</div>
              <div>
                <p className="text-2xl font-black">{checklist.filter((item) => item.done).length}/{checklist.length}</p>
                <p className="text-xs font-semibold text-zinc-500">requirements complete</p>
              </div>
            </div>
            <Button className="mt-4 w-full bg-rose-400 text-zinc-950 hover:bg-rose-300" onClick={() => setActiveMode("profile")}>
              <Wand2 className="h-4 w-4" /> Finish setup
            </Button>
          </div>
        </aside>

        <main className="space-y-5">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge className="border-white/10 bg-white/10 text-zinc-300">CreatorOS Link Commerce</Badge>
                <h1 className="mt-3 text-3xl font-black tracking-tight">Manage Your Smart Link</h1>
                <p className="mt-1 text-sm font-semibold text-zinc-500">Profile, links, products, affiliate flows, AI assistant, analytics, and public shop.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(`${origin}${publicPath}`)}>
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
                <Button asChild variant="secondary">
                  <a href={publicPath} target="_blank"><ExternalLink className="h-4 w-4" /> View profile</a>
                </Button>
                <Button asChild variant="secondary">
                  <a href={shopPath} target="_blank"><Store className="h-4 w-4" /> View shop</a>
                </Button>
                <form action={(fd) => saveProfile(fd, "published")} className="contents">
                  <input type="hidden" name="displayName" value={state.page.display_name ?? ""} />
                  <input type="hidden" name="username" value={state.page.username ?? state.page.slug ?? ""} />
                  <input type="hidden" name="headline" value={state.page.headline ?? ""} />
                  <input type="hidden" name="bio" value={state.page.bio ?? ""} />
                  <input type="hidden" name="occupationType" value={state.page.theme?.occupationType ?? "creator"} />
                  <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300" disabled={isPending}>
                    <Rocket className="h-4 w-4" /> Publish
                  </Button>
                </form>
              </div>
            </div>
            {message ? <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100">{message}</p> : null}
          </section>

          {(activeMode === "dashboard" || activeMode === "profile" || activeMode === "builder") ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-zinc-500">Settings and links</p>
              <h2 className="mt-2 text-2xl font-black">Complete your profile</h2>
              <form action={(fd) => saveProfile(fd)} className="mt-6 grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <UploadField label="Upload profile photo" bucket="public-assets" workspaceId={state.workspace.id} onUploaded={setAvatarUrl} />
                  <UploadField label="Upload background image" bucket="page-assets" workspaceId={state.workspace.id} onUploaded={setBackgroundUrl} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField name="displayName" label="Display name" defaultValue={state.page.display_name} placeholder="Your creator name" />
                  <TextField name="username" label="Username" defaultValue={state.page.username ?? state.page.slug} placeholder="your-username" />
                  <TextField name="headline" label="Headline" defaultValue={state.page.headline} placeholder="I help creators..." />
                  <TextField name="totalFollowers" label="Total followers" defaultValue={state.page.theme?.totalFollowers ?? 0} type="number" />
                </div>
                <TextArea name="bio" label="Bio" defaultValue={state.page.bio} placeholder="A short conversion-focused bio..." />
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Occupation type</span>
                  <select name="occupationType" defaultValue={state.page.theme?.occupationType ?? "creator"} className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm font-semibold text-white">
                    {["personal", "creator", "brand", "business", "agency", "community"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300" disabled={isPending}>
                  <Check className="h-4 w-4" /> Save profile
                </Button>
              </form>

              <div className="mt-10">
                <h3 className="text-xl font-black">Social media links</h3>
                <div className="mt-4 space-y-5">
                  {socialGroups.map((group) => (
                    <div key={group.group}>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{group.group}</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((platform) => (
                          <button key={platform} type="button" onClick={() => addSocial(platform, group.group)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-rose-300/50 hover:text-white">
                            {platform}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 grid gap-5 lg:grid-cols-2">
                <form action={addCustomLink} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <h3 className="text-xl font-black">Custom links</h3>
                  <div className="mt-4 grid gap-3">
                    <TextField name="title" label="Title" placeholder="Newsletter, latest video, community" />
                    <TextField name="url" label="URL" placeholder="https://example.com" />
                    <TextField name="description" label="Description" placeholder="Why visitors should click" />
                    <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300"><Plus className="h-4 w-4" /> Add link</Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {state.customLinks.map((link) => <p key={link.id} className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-bold">{link.title}</p>)}
                    {!state.customLinks.length ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-bold text-zinc-500">No custom links yet.</p> : null}
                  </div>
                </form>

                <form action={saveContact} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <h3 className="text-xl font-black">Contact information</h3>
                  <div className="mt-4 grid gap-3">
                    <TextField name="email" label="Email" defaultValue={state.contact?.email} placeholder="you@example.com" />
                    <TextField name="phone" label="Phone" defaultValue={state.contact?.phone} placeholder="+1..." />
                    <TextField name="website" label="Website" defaultValue={state.contact?.website} placeholder="https://yoursite.com" />
                    <TextField name="address" label="Address" defaultValue={state.contact?.address} placeholder="City, country" />
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-400"><input name="showPhone" type="checkbox" defaultChecked={state.contact?.show_phone} /> Show phone</label>
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-400"><input name="showAddress" type="checkbox" defaultChecked={state.contact?.show_address} /> Show address</label>
                    <Button variant="secondary"><Mail className="h-4 w-4" /> Save contact</Button>
                  </div>
                </form>
              </div>
            </section>
          ) : null}

          {(activeMode === "products" || activeMode === "product-new") ? (
            <section className="space-y-5">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">Digital products</h2>
                    <p className="text-sm font-semibold text-zinc-500">Private files, public shop display, checkout intents, and access grants.</p>
                  </div>
                  <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300" onClick={() => setActiveMode("product-new")}>
                    <PackagePlus className="h-4 w-4" /> Add product
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {state.products.map((product) => (
                    <div key={product.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                      <div className="grid h-28 place-items-center overflow-hidden rounded-2xl bg-white/[0.06]">
                        {product.cover_image_url ? <img src={product.cover_image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-zinc-600" />}
                      </div>
                      <Badge className="mt-4 bg-white/10 text-zinc-300">{product.status}</Badge>
                      <h3 className="mt-3 text-lg font-black">{product.title}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{money(product.price_cents, product.currency)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{product.description || "No description yet."}</p>
                    </div>
                  ))}
                  {!state.products.length ? <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-zinc-500 md:col-span-3">No products yet. Add the first file-backed product.</div> : null}
                </div>
              </div>

              {activeMode === "product-new" ? (
                <form action={addProduct} className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
                  <h2 className="text-2xl font-black">Add new product</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <UploadField label="Upload cover image" bucket="public-assets" workspaceId={state.workspace.id} onUploaded={setCoverUrl} />
                    <UploadField label="Upload digital file" bucket="product-files" workspaceId={state.workspace.id} onUploaded={setFilePath} privateFile />
                  </div>
                  <div className="mt-5 grid gap-4">
                    <TextField name="title" label="Title" placeholder="Creator launch workbook" />
                    <TextArea name="description" label="Description" placeholder="Describe exactly what buyers receive." />
                    <TextField name="price" label="Price USD" type="number" defaultValue={29} />
                    <TextField name="externalDeliveryUrl" label="External delivery URL" placeholder="Optional secure external delivery page" />
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold"><input name="showOnBio" type="checkbox" defaultChecked /> Show on Bio</label>
                      <label className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold"><input name="showOnShop" type="checkbox" defaultChecked /> Show on Shop</label>
                      <label className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold"><input name="publish" type="checkbox" /> Publish now</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => requestAi("product_description")}><Sparkles className="h-4 w-4" /> AI description</Button>
                      <Button type="button" variant="secondary" onClick={() => requestAi("pricing_suggestion")}><Sparkles className="h-4 w-4" /> AI price</Button>
                      <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300"><Plus className="h-4 w-4" /> Create product</Button>
                    </div>
                  </div>
                </form>
              ) : null}
            </section>
          ) : null}

          {activeMode === "wallet" ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Wallet and sales</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-3xl bg-emerald-300/10 p-5"><p className="text-sm text-emerald-200">Paid revenue</p><p className="mt-2 text-3xl font-black">{money(state.wallet.revenueCents)}</p></div>
                <div className="rounded-3xl bg-amber-300/10 p-5"><p className="text-sm text-amber-200">Pending</p><p className="mt-2 text-3xl font-black">{money(state.wallet.pendingCents)}</p></div>
                <div className="rounded-3xl bg-white/[0.06] p-5"><p className="text-sm text-zinc-400">Orders</p><p className="mt-2 text-3xl font-black">{state.orders.length}</p></div>
                <div className="rounded-3xl bg-white/[0.06] p-5"><p className="text-sm text-zinc-400">Provider</p><p className="mt-2 text-lg font-black">Stripe required</p></div>
              </div>
            </section>
          ) : null}

          {activeMode === "affiliate" ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Affiliate links</h2>
              <form action={addAffiliate} className="mt-5 grid gap-4">
                <TextField name="title" label="Title" placeholder="My favorite camera kit" />
                <TextField name="destinationUrl" label="Affiliate URL" placeholder="https://..." />
                <TextField name="network" label="Network" placeholder="Amazon, PartnerStack..." />
                <TextField name="commissionNote" label="Commission note" placeholder="I may earn a commission." />
                <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300"><Plus className="h-4 w-4" /> Add affiliate link</Button>
              </form>
            </section>
          ) : null}

          {activeMode === "referrals" ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Referral program</h2>
              <form action={saveReferral} className="mt-5 grid gap-4">
                <TextField name="title" label="Title" defaultValue={state.referralProgram?.title ?? "Refer a friend"} />
                <TextArea name="description" label="Description" defaultValue={state.referralProgram?.description} />
                <TextField name="rewardType" label="Reward type" defaultValue={state.referralProgram?.reward_type ?? "discount"} />
                <TextField name="rewardValue" label="Reward value" defaultValue={state.referralProgram?.reward_value ?? "20%"} />
                <TextArea name="terms" label="Terms" defaultValue={state.referralProgram?.terms} />
                <Button className="bg-rose-400 text-zinc-950 hover:bg-rose-300"><Share2 className="h-4 w-4" /> Enable referrals</Button>
              </form>
            </section>
          ) : null}

          {activeMode === "assistant" ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Public AI assistant</h2>
              <p className="mt-2 text-sm font-semibold text-zinc-500">Use the existing assistant engine, scoped to published page and product data only.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {["generate_bio", "product_ideas", "page_sections", "improve_cta", "brand_inquiry_copy", "seo_metadata", "conversion_review"].map((action) => (
                  <Button key={action} variant="secondary" onClick={() => requestAi(action)}>
                    <Sparkles className="h-4 w-4" /> {action.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </section>
          ) : null}

          {activeMode === "analytics" ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Real analytics</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {["page.viewed", "custom_link.clicked", "product.clicked", "checkout.started"].map((type) => (
                  <div key={type} className="rounded-3xl bg-white/[0.06] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{type}</p>
                    <p className="mt-2 text-3xl font-black">{eventsByType[type] ?? 0}</p>
                  </div>
                ))}
              </div>
              {!state.analyticsEvents.length ? <p className="mt-5 rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">No analytics yet. Public traffic will appear here as events arrive.</p> : null}
            </section>
          ) : null}

          {activeMode === "settings" ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-2xl font-black">Settings</h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5"><ShieldCheck className="h-5 w-5 text-emerald-300" /><p className="mt-3 font-black">Production provider rule</p><p className="mt-1 text-sm text-zinc-500">Checkout stays provider-gated until Stripe is connected.</p></div>
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5"><Globe2 className="h-5 w-5 text-sky-300" /><p className="mt-3 font-black">Public URLs</p><p className="mt-1 text-sm text-zinc-500">{origin}{publicPath} and {origin}{shopPath}</p></div>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="xl:sticky xl:top-20 xl:h-fit">
          <PhonePreview data={state} origin={origin} />
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-sm font-black">Next best AI actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => requestAi("generate_bio")}><RefreshCw className="h-4 w-4" /> Bio</Button>
              <Button size="sm" variant="secondary" onClick={() => requestAi("product_ideas")}><ShoppingBag className="h-4 w-4" /> Products</Button>
              <Button size="sm" variant="secondary" onClick={() => requestAi("conversion_review")}><Handshake className="h-4 w-4" /> Conversion</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
