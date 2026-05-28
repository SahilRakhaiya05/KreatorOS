"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bot,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gift,
  GripVertical,
  Handshake,
  Link as LinkIcon,
  LockKeyhole,
  Monitor,
  Palette,
  Pencil,
  Plus,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/client/supabase/browserClient";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CreatorCalendarSlotRecord, CreatorPageBlockRecord, CreatorPageRecord, PageBlockType } from "@/features/bioBuilder/types";

type Theme = { name: string; bg: string; button: string };
type AddMode = PageBlockType;
type PageVersion = {
  id: string;
  version_number: number;
  change_summary: string | null;
  created_at: string;
};

const defaultTheme: Theme = { name: "Studio", bg: "from-[#f7f7f2] via-white to-[#ecfdf5]", button: "bg-stone-950" };

const BLOCK_ICONS: Record<PageBlockType, LucideIcon> = {
  link: LinkIcon,
  calendar: Calendar,
  product: ShoppingBag,
  membership: LockKeyhole,
  lead_magnet: Gift,
  brand_intake: Handshake,
  ai_concierge: Bot,
};

const BLOCK_LABELS: Record<PageBlockType, string> = {
  link: "Link",
  calendar: "Calendar",
  product: "Product",
  membership: "Membership",
  lead_magnet: "Lead magnet",
  brand_intake: "Brand intake",
  ai_concierge: "AI concierge",
};

const ADD_OPTIONS: { type: PageBlockType; label: string; icon: LucideIcon }[] = [
  { type: "link", label: "Link", icon: LinkIcon },
  { type: "calendar", label: "Calendar", icon: Calendar },
  { type: "product", label: "Store product", icon: ShoppingBag },
  { type: "membership", label: "Membership", icon: LockKeyhole },
  { type: "lead_magnet", label: "Lead magnet", icon: Gift },
  { type: "brand_intake", label: "Brand intake", icon: Handshake },
  { type: "ai_concierge", label: "AI concierge", icon: Bot },
];

const LAYOUTS = ["Stacked commerce", "Calendar-first", "Storefront", "Membership hub", "Brand media kit", "AI concierge"];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function monthDays(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function defaultValueFor(type: PageBlockType) {
  const values: Record<PageBlockType, { title: string; subtitle: string; url: string; metadata: Record<string, unknown> }> = {
    link: { title: "New link", subtitle: "Add a destination", url: "https://", metadata: {} },
    calendar: { title: "Discovery call", subtitle: "Pick a date and time", url: "", metadata: { duration: "30 min", timezone: "Local time" } },
    product: { title: "Digital product", subtitle: "$29 · Instant access", url: "", metadata: { price: "$29" } },
    membership: { title: "Creator club", subtitle: "$9/mo · Private resources", url: "", metadata: { price: "$9/mo" } },
    lead_magnet: { title: "Free toolkit", subtitle: "Download the starter pack", url: "", metadata: {} },
    brand_intake: { title: "Work with me", subtitle: "Campaign and partnership intake", url: "", metadata: {} },
    ai_concierge: { title: "Ask my AI guide", subtitle: "Get routed to the right offer", url: "", metadata: {} },
  };
  return values[type];
}

function getMetadataText(block: CreatorPageBlockRecord) {
  if (block.type === "calendar") {
    const duration = typeof block.metadata.duration === "string" ? block.metadata.duration : "30 min";
    const timezone = typeof block.metadata.timezone === "string" ? block.metadata.timezone : "Local time";
    return `${duration} · ${timezone}`;
  }
  if (typeof block.metadata.price === "string") return block.metadata.price;
  if (block.url) return block.url.replace(/^https?:\/\//, "");
  return block.subtitle ?? BLOCK_LABELS[block.type];
}

function CalendarPreview({ block }: { block: CreatorPageBlockRecord }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [slots, setSlots] = useState<CreatorCalendarSlotRecord[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      const start = `${selectedDate}T00:00:00.000Z`;
      const end = `${selectedDate}T23:59:59.999Z`;
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("creator_calendar_slots")
        .select("*")
        .eq("block_id", block.id)
        .eq("status", "available")
        .gte("starts_at", start)
        .lte("starts_at", end)
        .order("starts_at", { ascending: true });

      if (!cancelled) setSlots((data ?? []) as CreatorCalendarSlotRecord[]);
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [block.id, selectedDate]);

  const days = monthDays(month);
  const selectedHasSlots = slots.length > 0;

  return (
    <div className="rounded-2xl bg-white/92 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-stone-950">{block.title}</p>
          <p className="truncate text-xs text-stone-500">{block.subtitle || getMetadataText(block)}</p>
        </div>
        <Badge variant="secondary">Book</Badge>
      </div>

      <div className="mt-4 rounded-2xl bg-stone-100/80 p-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-stone-600 shadow-sm"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-black">
            {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(month)}
          </p>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-stone-600 shadow-sm"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-stone-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day.slice(0, 1)}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const value = isoDate(day);
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isSelected = value === selectedDate;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedDate(value);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "aspect-square rounded-lg text-xs font-black transition",
                  isSelected ? "bg-stone-950 text-white" : "bg-white text-stone-700 hover:bg-emerald-50",
                  !isCurrentMonth && "opacity-35",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-stone-500">Available times</p>
        {selectedHasSlots ? (
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot.id)}
                className={cn(
                  "rounded-xl px-3 py-2 text-center text-xs font-black transition",
                  selectedSlot === slot.id ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                )}
              >
                {formatTime(slot.starts_at)}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold text-stone-500">No times for this date.</p>
        )}
      </div>
    </div>
  );
}

function PreviewBlock({ block }: { block: CreatorPageBlockRecord }) {
  const Icon = BLOCK_ICONS[block.type] ?? LinkIcon;

  if (block.type === "calendar") return <CalendarPreview block={block} />;

  return (
    <a
      href={block.url || "#"}
      className="flex w-full items-center justify-between rounded-2xl bg-white/92 p-3.5 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-950 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-stone-950">{block.title}</span>
          <span className="block truncate text-xs leading-5 text-stone-500">{block.subtitle || getMetadataText(block)}</span>
        </span>
      </span>
      {block.url ? <ExternalLink className="h-4 w-4 shrink-0 text-stone-400" /> : <Wand2 className="h-4 w-4 shrink-0 text-stone-400" />}
    </a>
  );
}

export function PublicPreview({
  theme = defaultTheme,
  layout,
  page,
  blocks,
}: {
  theme?: Theme;
  layout?: string;
  page?: CreatorPageRecord;
  blocks?: CreatorPageBlockRecord[];
}) {
  const currentPage = page ?? {
    id: "preview",
    owner_id: "preview",
    slug: "creator",
    display_name: "KreatorOS Creator",
    handle: "@creator",
    bio: "Build, book, sell, and automate from one clean creator page.",
    avatar_url: null,
    theme_name: "Studio",
    layout: "Stacked commerce",
    is_published: true,
  };
  const visible = (blocks ?? []).filter((block) => block.status === "live");

  return (
    <div className={cn("min-h-full w-full bg-gradient-to-br p-4", theme.bg)}>
      <div className="mb-4 flex items-center justify-between">
        <Badge className="bg-stone-950 text-white">{layout ?? currentPage.layout}</Badge>
        <LinkIcon className="h-4 w-4 text-stone-500" />
      </div>
      <div className="rounded-2xl bg-white/92 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-4">
          {currentPage.avatar_url ? (
            <img src={currentPage.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-stone-950 to-emerald-800" />
          )}
          <div className="min-w-0">
            <p className="truncate text-xl font-black text-stone-950">{currentPage.display_name}</p>
            <p className="truncate text-sm font-medium text-stone-500">{currentPage.handle}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-700">{currentPage.bio}</p>
      </div>
      <div className="mt-4 space-y-3">
        {visible.map((block) => (
          <PreviewBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function DeviceFrame({ device, url, children }: { device: "desktop" | "mobile"; url: string; children: React.ReactNode }) {
  if (device === "mobile") {
    return (
      <div className="flex w-full justify-center overflow-visible py-2">
        <div className="relative aspect-[390/844] h-[min(84vh,820px)] min-h-[640px] w-auto max-w-[min(100%,420px)] rounded-[42px] bg-stone-950 p-[8px] shadow-[0_28px_70px_rgba(28,25,23,.22)]">
          <div className="absolute left-1/2 top-3 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-stone-950" />
          <div className="pointer-events-none absolute inset-[8px] z-20 rounded-[34px] ring-1 ring-inset ring-white/10" />
          <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-stone-100">
            <div className="no-scrollbar h-full overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth">{children}</div>
          </div>
          <div className="absolute left-[-3px] top-[108px] h-9 w-[3px] rounded-l-md bg-stone-950" />
          <div className="absolute right-[-3px] top-[190px] h-20 w-[3px] rounded-r-md bg-stone-950" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_55px_rgba(28,25,23,.12)]">
      <div className="flex items-center gap-3 bg-stone-100/80 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-stone-300" />
          <span className="h-3 w-3 rounded-full bg-stone-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="mx-auto w-full max-w-xs truncate rounded-full bg-white px-4 py-1 text-center text-xs text-stone-500">{url}</div>
      </div>
      <div className="no-scrollbar max-h-[720px] overflow-y-auto bg-stone-100 overscroll-contain">{children}</div>
    </div>
  );
}

export function BioBuilderClient({
  page,
  pageBlocks,
  themes,
}: {
  page: CreatorPageRecord;
  pageBlocks: CreatorPageBlockRecord[];
  themes: Theme[];
}) {
  const [theme, setTheme] = useState(themes.find((item) => item.name === page.theme_name) ?? themes[0]);
  const [layout, setLayout] = useState(page.layout);
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");
  const [blocks, setBlocks] = useState<CreatorPageBlockRecord[]>(pageBlocks);
  const [addMode, setAddMode] = useState<AddMode>("link");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [isPending, startTransition] = useTransition();

  const url = `kreatoros.ai/u/${page.slug}`;
  const sortedBlocks = useMemo(() => [...blocks].sort((a, b) => a.sort_order - b.sort_order), [blocks]);

  useEffect(() => {
    let cancelled = false;

    async function loadVersions() {
      try {
        const res = await fetch(`/api/pages/${page.id}/versions`);
        const json = await res.json();
        if (!cancelled && json?.ok) {
          setVersions(json.data.versions ?? []);
        }
      } catch {
        /* version panel stays empty */
      }
    }

    loadVersions();
    return () => {
      cancelled = true;
    };
  }, [page.id]);

  function currentDsl() {
    return {
      page: {
        theme: {
          mode: "light",
          accent: theme.name.toLowerCase(),
          font: "inter",
          radius: "xl",
          animation: "subtle",
        },
        seo: {
          title: page.display_name,
          description: page.bio ?? "Book, buy, and connect from this creator page.",
        },
        blocks: sortedBlocks.map((block) => ({
          id: block.id,
          type: block.type,
          props: {
            title: block.title,
            subtitle: block.subtitle,
            url: block.url,
            status: block.status,
            metadata: block.metadata,
          },
        })),
      },
    };
  }

  function saveVersion() {
    startTransition(async () => {
      const res = await fetch(`/api/pages/${page.id}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId: page.workspace_id ?? undefined,
          pageId: page.id,
          dsl: currentDsl(),
          changeSummary: "Manual builder snapshot",
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        setVersions((prev) => [json.data.version, ...prev]);
        setMessage("Page version saved.");
      } else {
        setMessage(json?.error?.message ?? "Could not save version.");
      }
    });
  }

  function requestRestore(versionId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/pages/${page.id}/versions/${versionId}/restore`, { method: "POST" });
      const json = await res.json();
      setMessage(json?.ok ? "Restore request logged for review." : json?.error?.message ?? "Could not request restore.");
    });
  }

  function persistPage(update: Partial<CreatorPageRecord>) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("creator_pages").update(update).eq("id", page.id);
    });
  }

  function updateTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    persistPage({ theme_name: nextTheme.name });
  }

  function updateLayout(nextLayout: string) {
    setLayout(nextLayout);
    persistPage({ layout: nextLayout });
  }

  function updateBlockLocal(id: string, update: Partial<CreatorPageBlockRecord>) {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...update } : block)));
  }

  function persistBlock(id: string, update: Partial<CreatorPageBlockRecord>) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("creator_page_blocks").update(update).eq("id", id);
    });
  }

  function toggleBlock(id: string) {
    const target = blocks.find((block) => block.id === id);
    if (!target) return;
    const status = target.status === "live" ? "draft" : "live";
    updateBlockLocal(id, { status });
    persistBlock(id, { status });
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const ordered = sortedBlocks;
    const index = ordered.findIndex((block) => block.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return;

    const current = ordered[index];
    const swap = ordered[swapIndex];
    updateBlockLocal(current.id, { sort_order: swap.sort_order });
    updateBlockLocal(swap.id, { sort_order: current.sort_order });
    persistBlock(current.id, { sort_order: swap.sort_order });
    persistBlock(swap.id, { sort_order: current.sort_order });
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("creator_page_blocks").delete().eq("id", id);
    });
  }

  function updateBlock(formData: FormData) {
    const id = String(formData.get("id"));
    const title = String(formData.get("title") ?? "").trim();
    const subtitle = String(formData.get("subtitle") ?? "").trim();
    const urlValue = String(formData.get("url") ?? "").trim();
    const price = String(formData.get("price") ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();
    const timezone = String(formData.get("timezone") ?? "").trim();
    const target = blocks.find((block) => block.id === id);
    if (!target || !title) return;

    const metadata = {
      ...target.metadata,
      ...(price ? { price } : {}),
      ...(duration ? { duration } : {}),
      ...(timezone ? { timezone } : {}),
    };
    const update = { title, subtitle: subtitle || null, url: urlValue || null, metadata };
    updateBlockLocal(id, update);
    persistBlock(id, update);
    setEditingId(null);
  }

  async function createCalendarSlots(block: CreatorPageBlockRecord, durationMinutes: number) {
    const supabase = createSupabaseBrowserClient();
    const slots = Array.from({ length: 21 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() + Math.floor(index / 3));
      const hour = [10, 14, 17][index % 3];
      const starts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
      const ends = new Date(starts);
      ends.setMinutes(starts.getMinutes() + durationMinutes);
      return {
        block_id: block.id,
        workspace_id: page.workspace_id ?? null,
        page_id: page.id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        status: "available",
      };
    });
    await supabase.from("creator_calendar_slots").insert(slots);
  }

  function addBlock(formData: FormData) {
    setMessage("");
    const type = String(formData.get("type")) as PageBlockType;
    const defaults = defaultValueFor(type);
    const title = String(formData.get("title") ?? "").trim() || defaults.title;
    const subtitle = String(formData.get("subtitle") ?? "").trim() || defaults.subtitle;
    const urlValue = String(formData.get("url") ?? "").trim() || defaults.url;
    const duration = String(formData.get("duration") ?? "30 min").trim();
    const timezone = String(formData.get("timezone") ?? "Local time").trim();
    const price = String(formData.get("price") ?? "").trim();
    const nextOrder = blocks.length ? Math.max(...blocks.map((block) => block.sort_order)) + 1 : 0;

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const metadata = {
        ...defaults.metadata,
        ...(type === "calendar" ? { duration: duration || "30 min", timezone: timezone || "Local time" } : {}),
        ...(price ? { price } : {}),
      };
      const { data, error } = await supabase
        .from("creator_page_blocks")
        .insert({
          page_id: page.id,
          workspace_id: page.workspace_id ?? null,
          type,
          title,
          subtitle,
          url: type === "link" ? urlValue : null,
          status: "live",
          sort_order: nextOrder,
          metadata,
        })
        .select("*")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      const block = data as CreatorPageBlockRecord;
      if (type === "calendar") await createCalendarSlots(block, Number.parseInt(duration, 10) || 30);
      setBlocks((prev) => [...prev, block]);
      setMessage(`${BLOCK_LABELS[type]} added and saved.`);
    });
  }

  function aiPolishPage() {
    const nextTheme = themes.find((item) => item.name === "Research") ?? themes[0];
    setTheme(nextTheme);
    setLayout("Calendar-first");
    persistPage({
      theme_name: nextTheme.name,
      layout: "Calendar-first",
      bio: "A focused creator page for booking, buying, and getting routed to the right next step.",
    });
    setMessage("AI polished the theme, layout, and page positioning.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,450px)]">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-stone-950">Add content</p>
                <p className="text-sm text-stone-500">Links, calendar, store, memberships, lead magnets, brand intake, and AI concierge.</p>
              </div>
              <Button variant="secondary" onClick={aiPolishPage}>
                <Sparkles className="h-4 w-4" /> AI polish
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ADD_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Button key={option.type} size="sm" variant={addMode === option.type ? "default" : "secondary"} onClick={() => setAddMode(option.type)}>
                    <Icon className="h-4 w-4" /> {option.label}
                  </Button>
                );
              })}
            </div>

            <form action={addBlock} className="mt-5 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="type" value={addMode} />
              <input name="title" placeholder={defaultValueFor(addMode).title} className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-stone-200" />
              <input name="subtitle" placeholder={defaultValueFor(addMode).subtitle} className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-stone-200" />
              {addMode === "link" ? (
                <input name="url" placeholder="https://example.com" className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-stone-200 md:col-span-2" />
              ) : null}
              {["product", "membership"].includes(addMode) ? (
                <input name="price" placeholder="$29" className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-stone-200 md:col-span-2" />
              ) : null}
              {addMode === "calendar" ? (
                <>
                  <input name="duration" placeholder="30 min" defaultValue="30 min" className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-stone-200" />
                  <input name="timezone" placeholder="Local time" defaultValue="Local time" className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-stone-200" />
                </>
              ) : null}
              <Button disabled={isPending} className="md:col-span-2">
                <Plus className="h-4 w-4" /> {isPending ? "Saving..." : `Add ${BLOCK_LABELS[addMode]}`}
              </Button>
            </form>

            {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">Theme and layout</p>
                <p className="text-sm text-stone-500">Saved to Supabase. AI can also tune this.</p>
              </div>
              <Palette className="h-5 w-5 text-stone-500" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {themes.map((item) => (
                <button key={item.name} onClick={() => updateTheme(item)} className={cn("rounded-xl bg-stone-100 p-3 text-left transition hover:-translate-y-0.5", theme.name === item.name && "ring-4 ring-emerald-100")}>
                  <div className={cn("mb-3 h-16 rounded-lg bg-gradient-to-br", item.bg)} />
                  <p className="text-sm font-black">{item.name}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LAYOUTS.map((item) => (
                <button key={item} onClick={() => updateLayout(item)} className={cn("rounded-xl bg-stone-100 px-4 py-3 text-left text-sm font-black transition hover:bg-stone-200", layout === item && "bg-stone-950 text-white hover:bg-stone-950")}>
                  {item}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-black">Blocks</p>
                <p className="text-sm text-stone-500">Reorder, edit, hide, or delete each block.</p>
              </div>
              <Badge variant="outline">{blocks.length} blocks</Badge>
            </div>
            <div className="space-y-2.5">
              {sortedBlocks.map((block, index) => {
                const Icon = BLOCK_ICONS[block.type] ?? LinkIcon;
                const isEditing = editingId === block.id;
                return (
                  <div key={block.id} className="rounded-xl bg-stone-100/80 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <GripVertical className="h-5 w-5 shrink-0 text-stone-400" />
                        <Icon className="h-5 w-5 shrink-0 text-stone-500" />
                        <div className="min-w-0">
                          <p className="truncate font-black">{block.title}</p>
                          <p className="truncate text-sm text-stone-500">
                            {BLOCK_LABELS[block.type]} · {block.clicks} clicks
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button className="rounded-lg bg-white px-2 py-1 text-xs font-black disabled:opacity-30" disabled={index === 0} onClick={() => moveBlock(block.id, -1)} type="button">Up</button>
                        <button className="rounded-lg bg-white px-2 py-1 text-xs font-black disabled:opacity-30" disabled={index === sortedBlocks.length - 1} onClick={() => moveBlock(block.id, 1)} type="button">Down</button>
                        <button className="rounded-lg bg-white p-2" onClick={() => setEditingId(isEditing ? null : block.id)} type="button"><Pencil className="h-4 w-4" /></button>
                        <button className="rounded-lg bg-white p-2 text-rose-600" onClick={() => deleteBlock(block.id)} type="button"><Trash2 className="h-4 w-4" /></button>
                        <button className={cn("rounded-lg px-2 py-1 text-xs font-black", block.status === "live" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")} onClick={() => toggleBlock(block.id)} type="button">
                          {block.status === "live" ? "Live" : "Draft"}
                        </button>
                      </div>
                    </div>
                    {isEditing ? (
                      <form action={updateBlock} className="mt-3 grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="id" value={block.id} />
                        <input name="title" defaultValue={block.title} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200" />
                        <input name="subtitle" defaultValue={block.subtitle ?? ""} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200" />
                        <input name="url" defaultValue={block.url ?? ""} placeholder="URL" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200" />
                        <input name="price" defaultValue={typeof block.metadata.price === "string" ? block.metadata.price : ""} placeholder="Price" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200" />
                        <input name="duration" defaultValue={typeof block.metadata.duration === "string" ? block.metadata.duration : ""} placeholder="Duration" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200" />
                        <input name="timezone" defaultValue={typeof block.metadata.timezone === "string" ? block.metadata.timezone : ""} placeholder="Timezone" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-stone-200" />
                        <Button size="sm" className="md:col-span-2"><Check className="h-4 w-4" /> Save block</Button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">Version history</p>
                <p className="text-sm text-stone-500">Snapshots are stored in the Page DSL table and restore requests are audit logged.</p>
              </div>
              <Button variant="secondary" onClick={saveVersion} disabled={isPending}>
                <Check className="h-4 w-4" /> Save version
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {versions.length ? (
                versions.slice(0, 5).map((version) => (
                  <div key={version.id} className="flex items-center justify-between gap-3 rounded-xl bg-stone-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-black">Version {version.version_number}</p>
                      <p className="text-xs text-stone-500">{version.change_summary ?? "Builder snapshot"}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => requestRestore(version.id)}>
                      Restore
                    </Button>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-500">No saved versions yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm">
            <Button size="sm" variant={device === "desktop" ? "default" : "ghost"} onClick={() => setDevice("desktop")}>
              <Monitor className="h-4 w-4" /> Desktop
            </Button>
            <Button size="sm" variant={device === "mobile" ? "default" : "ghost"} onClick={() => setDevice("mobile")}>
              <Smartphone className="h-4 w-4" /> Mobile
            </Button>
          </div>
          <Badge variant="outline">Preview scroll is isolated</Badge>
        </div>

        <DeviceFrame device={device} url={url}>
          <PublicPreview theme={theme} layout={layout} page={{ ...page, theme_name: theme.name, layout }} blocks={sortedBlocks} />
        </DeviceFrame>
      </div>
    </div>
  );
}
