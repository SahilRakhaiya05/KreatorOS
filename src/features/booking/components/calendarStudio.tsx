"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BookingOffer = {
  id: string;
  type?: string;
  title: string;
  description?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  status?: "draft" | "published" | "paused" | "archived";
  config?: Record<string, any> | null;
};

type CalendarSlot = {
  id?: string;
  block_id?: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: "available" | "held" | "booked" | "blocked";
};

type BookingRecord = {
  id: string;
  offer_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type CalendarStudioData = {
  workspace?: { id: string };
  page?: { id: string; username?: string | null; slug?: string | null; display_name?: string | null };
  offers?: BookingOffer[];
  calendarSlots?: CalendarSlot[];
  bookings?: BookingRecord[];
};

const weekDays = [
  { key: "Mon", label: "Mon" },
  { key: "Tue", label: "Tue" },
  { key: "Wed", label: "Wed" },
  { key: "Thu", label: "Thu" },
  { key: "Fri", label: "Fri" },
  { key: "Sat", label: "Sat" },
  { key: "Sun", label: "Sun" },
];

const defaultQuestions = ["What should we solve on the call?", "What is your website or main link?", "What outcome would make this useful?"];

function currency(cents = 0, code = "usd") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: code.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${String(minute || 0).padStart(2, "0")} ${suffix}`;
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function fromMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function nextDateForDay(dayKey: string, weekOffset = 0) {
  const dayIndex = weekDays.findIndex((day) => day.key === dayKey);
  const now = new Date();
  const current = (now.getDay() + 6) % 7;
  const diff = (dayIndex - current + 7) % 7;
  const date = new Date(now);
  date.setDate(now.getDate() + diff + weekOffset * 7);
  date.setHours(0, 0, 0, 0);
  return date;
}

function combineDateTime(dayKey: string, time: string, weekOffset = 0) {
  const date = nextDateForDay(dayKey, weekOffset);
  const [hour, minute] = time.split(":").map(Number);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function buildTimes(startTime: string, endTime: string, interval: number) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const safeEnd = end > start ? end : start + interval;
  const times: string[] = [];
  for (let minutes = start; minutes < safeEnd; minutes += interval) {
    times.push(fromMinutes(minutes));
  }
  return times.slice(0, 8);
}

function slotKey(day: string, time: string) {
  return `${day}:${time}`;
}

function initialSlotState(slots: CalendarSlot[]) {
  const state: Record<string, "available" | "blocked"> = {};
  for (const slot of slots) {
    if (slot.status !== "available" && slot.status !== "blocked") continue;
    const date = new Date(slot.starts_at);
    const day = weekDays[(date.getDay() + 6) % 7]?.key;
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    if (day) state[slotKey(day, time)] = slot.status;
  }
  return state;
}

function offerConfigValue<T>(offer: BookingOffer | undefined, key: string, fallback: T): T {
  const value = offer?.config?.[key];
  return value === undefined || value === null ? fallback : (value as T);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

export function CalendarStudio({ data }: { data?: CalendarStudioData }) {
  const bookingOffers = useMemo(
    () => (data?.offers ?? []).filter((offer) => offer.type === undefined || (offer as any).type === "booking"),
    [data?.offers]
  );

  const fallbackOffer: BookingOffer = {
    id: "new",
    title: "Discovery Call",
    description: "A focused session for qualified leads.",
    price_cents: 0,
    currency: "usd",
    status: "published",
    config: {
      durationMinutes: 30,
      timezone: "America/New_York",
      activeDays: ["Mon", "Tue", "Wed", "Thu"],
      startTime: "10:00",
      endTime: "16:00",
      bufferMinutes: 10,
      slotIntervalMinutes: 30,
      intakeQuestions: defaultQuestions,
    },
  };

  const [offers, setOffers] = useState<BookingOffer[]>(bookingOffers.length ? bookingOffers : [fallbackOffer]);
  const [selectedId, setSelectedId] = useState(offers[0]?.id ?? "new");
  const selectedOffer = offers.find((offer) => offer.id === selectedId) ?? offers[0] ?? fallbackOffer;
  const isNew = selectedOffer.id === "new";

  const [title, setTitle] = useState(selectedOffer.title);
  const [description, setDescription] = useState(selectedOffer.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(() => offerConfigValue(selectedOffer, "durationMinutes", 30));
  const [priceCents, setPriceCents] = useState(selectedOffer.price_cents ?? 0);
  const [status, setStatus] = useState<"draft" | "published">(selectedOffer.status === "draft" ? "draft" : "published");
  const [timezone, setTimezone] = useState(() => offerConfigValue(selectedOffer, "timezone", "America/New_York"));
  const [activeDays, setActiveDays] = useState<string[]>(() => offerConfigValue(selectedOffer, "activeDays", ["Mon", "Tue", "Wed", "Thu"]));
  const [startTime, setStartTime] = useState(() => offerConfigValue(selectedOffer, "startTime", "10:00"));
  const [endTime, setEndTime] = useState(() => offerConfigValue(selectedOffer, "endTime", "16:00"));
  const [bufferMinutes, setBufferMinutes] = useState(() => offerConfigValue(selectedOffer, "bufferMinutes", 10));
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(() => offerConfigValue(selectedOffer, "slotIntervalMinutes", 30));
  const [questions, setQuestions] = useState<string[]>(() => offerConfigValue(selectedOffer, "intakeQuestions", defaultQuestions));
  const [slotState, setSlotState] = useState<Record<string, "available" | "blocked">>(() => initialSlotState(data?.calendarSlots ?? []));
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const times = useMemo(() => buildTimes(startTime, endTime, slotIntervalMinutes), [endTime, slotIntervalMinutes, startTime]);
  const publicPath = `/u/${data?.page?.username || data?.page?.slug || ""}`;
  const activeSlotCount = weekDays.reduce(
    (sum, day) =>
      sum +
      times.filter((time) => activeDays.includes(day.key) && slotState[slotKey(day.key, time)] !== "blocked").length,
    0
  );

  const blockedCount = Object.values(slotState).filter((value) => value === "blocked").length;
  const upcomingBookings = (data?.bookings ?? []).filter((booking) => !booking.start_at || new Date(booking.start_at) >= new Date()).slice(0, 4);

  function selectOffer(offer: BookingOffer) {
    setSelectedId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description ?? "");
    setDurationMinutes(offerConfigValue(offer, "durationMinutes", 30));
    setPriceCents(offer.price_cents ?? 0);
    setStatus(offer.status === "draft" ? "draft" : "published");
    setTimezone(offerConfigValue(offer, "timezone", "America/New_York"));
    setActiveDays(offerConfigValue(offer, "activeDays", ["Mon", "Tue", "Wed", "Thu"]));
    setStartTime(offerConfigValue(offer, "startTime", "10:00"));
    setEndTime(offerConfigValue(offer, "endTime", "16:00"));
    setBufferMinutes(offerConfigValue(offer, "bufferMinutes", 10));
    setSlotIntervalMinutes(offerConfigValue(offer, "slotIntervalMinutes", 30));
    setQuestions(offerConfigValue(offer, "intakeQuestions", defaultQuestions));
    setNotice("");
  }

  function createNewOffer() {
    const draft = {
      ...fallbackOffer,
      id: "new",
      title: "New Booking Type",
      description: "",
      price_cents: 0,
    };
    if (!offers.some((offer) => offer.id === "new")) setOffers((current) => [draft, ...current]);
    selectOffer(draft);
  }

  function toggleSlot(day: string, time: string) {
    if (!activeDays.includes(day)) return;
    const key = slotKey(day, time);
    setSlotState((current) => ({ ...current, [key]: current[key] === "blocked" ? "available" : "blocked" }));
  }

  function generatedSlots() {
    const rows: { startsAt: string; endsAt: string; status: "available" | "blocked" }[] = [];
    for (const day of weekDays) {
      for (const time of times) {
        if (!activeDays.includes(day.key)) continue;
        for (const weekOffset of [0, 1, 2]) {
          const starts = combineDateTime(day.key, time, weekOffset);
          if (starts < new Date()) continue;
          const ends = new Date(starts.getTime() + durationMinutes * 60 * 1000);
          rows.push({
            startsAt: starts.toISOString(),
            endsAt: ends.toISOString(),
            status: slotState[slotKey(day.key, time)] === "blocked" ? "blocked" : "available",
          });
        }
      }
    }
    return rows;
  }

  function saveCalendar() {
    setNotice("");
    startTransition(async () => {
      const response = await fetch("/api/creator/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: data?.page?.id,
          offerId: isNew ? undefined : selectedOffer.id,
          title,
          description,
          durationMinutes,
          priceCents,
          currency: selectedOffer.currency || "usd",
          status,
          timezone,
          activeDays,
          startTime,
          endTime,
          bufferMinutes,
          slotIntervalMinutes,
          intakeQuestions: questions.filter(Boolean),
          slots: generatedSlots(),
        }),
      });
      const json = await response.json();

      if (!json?.ok) {
        setNotice(json?.error?.message || "Could not save calendar.");
        return;
      }

      const saved = json.data.offer as BookingOffer;
      setOffers((current) => [saved, ...current.filter((offer) => offer.id !== selectedOffer.id && offer.id !== "new")]);
      setSelectedId(saved.id);
      setNotice("Calendar saved");
    });
  }

  async function copyLink() {
    if (!publicPath || publicPath === "/u/") return;
    await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <Card className="border-border/70 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Booking Types</h2>
              <p className="text-xs text-muted-foreground">Services visitors can schedule.</p>
            </div>
            <Button size="icon" className="h-9 w-9" onClick={createNewOffer} aria-label="Create booking type">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {offers.map((offer) => {
              const selected = offer.id === selectedOffer.id;
              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => selectOffer(offer)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition",
                    selected ? "border-emerald-500 bg-emerald-50/70 shadow-sm" : "border-border bg-background hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-1 text-sm font-semibold text-foreground">{offer.title}</span>
                    <Badge variant={offer.status === "published" ? "success" : "secondary"} className="shrink-0">
                      {offer.status === "published" ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {offerConfigValue(offer, "durationMinutes", 30)} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" />
                      {(offer.price_cents ?? 0) > 0 ? currency(offer.price_cents ?? 0, offer.currency ?? "usd") : "Free"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="border-border/70 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Booking Details</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Name">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Description">
              <textarea
                className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium leading-5 text-foreground outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration">
                <select className={inputClass} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
                  {[15, 20, 30, 45, 60, 90].map((value) => (
                    <option key={value} value={value}>
                      {value} min
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Price">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={Math.round(priceCents / 100)}
                  onChange={(event) => setPriceCents(Math.max(0, Number(event.target.value) * 100))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("published")}
                className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", status === "published" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-border")}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", status === "draft" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-border")}
              >
                Draft
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Weekly Availability</h2>
              <p className="mt-1 text-sm text-muted-foreground">Set the hours visitors can choose. Block specific slots when your schedule changes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className={inputClass} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                <option value="America/New_York">New York</option>
                <option value="America/Los_Angeles">Los Angeles</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Kolkata">India</option>
                <option value="UTC">UTC</option>
              </select>
              <Button onClick={saveCalendar} disabled={isPending || !data?.page?.id}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Available days</span>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const selected = activeDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setActiveDays((current) => (selected ? current.filter((item) => item !== day.key) : [...current, day.key]))}
                      className={cn(
                        "h-10 rounded-lg border text-sm font-semibold transition",
                        selected ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Field label="Start">
                <input className={inputClass} type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </Field>
              <Field label="End">
                <input className={inputClass} type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              </Field>
              <Field label="Buffer">
                <select className={inputClass} value={bufferMinutes} onChange={(event) => setBufferMinutes(Number(event.target.value))}>
                  {[0, 5, 10, 15, 30].map((value) => (
                    <option key={value} value={value}>
                      {value}m
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {weekDays.map((day) => (
                  <div key={day.key} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {day.label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {weekDays.map((day) => (
                  <div key={day.key} className="border-r border-border last:border-r-0">
                    {times.map((time) => {
                      const disabled = !activeDays.includes(day.key);
                      const blocked = slotState[slotKey(day.key, time)] === "blocked";
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleSlot(day.key, time)}
                          className={cn(
                            "flex h-16 w-full flex-col items-start justify-between border-b border-border px-3 py-2 text-left transition last:border-b-0",
                            disabled && "cursor-not-allowed bg-muted/30 text-muted-foreground/50",
                            !disabled && !blocked && "bg-background hover:bg-emerald-50",
                            blocked && !disabled && "bg-stone-100 text-muted-foreground"
                          )}
                        >
                          <span className="text-xs font-semibold">{timeLabel(time)}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", blocked ? "bg-stone-200 text-stone-600" : "bg-emerald-100 text-emerald-700")}>
                            {disabled ? "Off" : blocked ? "Blocked" : "Open"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Open slots", activeSlotCount],
              ["Blocked", blockedCount],
              ["Next publish", generatedSlots().filter((slot) => slot.status === "available").length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{notice}</p> : null}
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="border-border/70 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Booking Page</h2>
              <p className="text-xs text-muted-foreground">How visitors see this session.</p>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={copyLink} aria-label="Copy public page link">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-gradient-to-b from-white to-stone-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              {data?.page?.display_name || "Creator"}
            </div>
            <h3 className="mt-3 text-xl font-semibold leading-tight text-foreground">{title || "Booking type"}</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{description || "Visitors can pick a time from your live schedule."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{durationMinutes} min</Badge>
              <Badge variant={priceCents > 0 ? "default" : "success"}>{priceCents > 0 ? currency(priceCents) : "Free"}</Badge>
              <Badge variant="secondary">{timezone.replace("_", " ")}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {times.slice(0, 4).map((time) => (
                <span key={time} className="rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-semibold text-foreground">
                  {timeLabel(time)}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <a href={publicPath || "#"} target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4" />
                Preview
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/creator/settings">
                <Link2 className="h-4 w-4" />
                Settings
              </a>
            </Button>
          </div>
        </Card>

        <Card className="border-border/70 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Automation</h2>
          <div className="mt-3 space-y-2">
            {[
              [Video, "Meeting link", "Created when a booking is confirmed."],
              [CreditCard, "Payment gate", priceCents > 0 ? "Checkout runs before confirmation." : "No payment required."],
              [Sparkles, "AI follow-up", "Recap and next-step draft after the call."],
            ].map(([Icon, titleText, body]) => {
              const TypedIcon = Icon as typeof Video;
              return (
                <div key={titleText as string} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                    <TypedIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{titleText as string}</p>
                    <p className="text-xs leading-5 text-muted-foreground">{body as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-border/70 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Intake</h2>
          <div className="mt-3 space-y-2">
            {questions.map((question, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={cn(inputClass, "min-w-0 flex-1")}
                  value={question}
                  onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label="Remove question"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={() => setQuestions((current) => [...current, ""])}>
              <Plus className="h-4 w-4" />
              Add question
            </Button>
          </div>
        </Card>

        <Card className="border-border/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Upcoming</h2>
            <Badge variant="secondary">{upcomingBookings.length}</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {upcomingBookings.length ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {booking.start_at ? new Date(booking.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Scheduled session"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{booking.status || "pending"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No upcoming sessions yet.</div>
            )}
          </div>
        </Card>

        <a href="/creator/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          Calendar integrations live in Settings
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
