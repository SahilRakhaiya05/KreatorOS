"use client";

import { type ReactNode, useMemo, useState, useTransition } from "react";
import { analyticsEvents, captureClientEvent } from "@/client/posthog/events";
import {
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  meeting_url?: string | null;
  provider_event_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  customers?: { name?: string | null; email?: string | null } | Array<{ name?: string | null; email?: string | null }> | null;
  offers?: { title?: string | null } | Array<{ title?: string | null }> | null;
};

type CalendarStudioData = {
  workspace?: { id: string };
  page?: { id: string; username?: string | null; slug?: string | null; display_name?: string | null };
  offers?: BookingOffer[];
  calendarSlots?: CalendarSlot[];
  bookings?: BookingRecord[];
};

type CalendarTab = "booking" | "availability" | "bookings" | "automation";

const calendarTabs: { id: CalendarTab; label: string }[] = [
  { id: "booking", label: "Booking Type" },
  { id: "availability", label: "Availability" },
  { id: "bookings", label: "Bookings" },
  { id: "automation", label: "Automation" },
];

const weekDays = [
  { key: "Mon", label: "Mon", date: "10" },
  { key: "Tue", label: "Tue", date: "11" },
  { key: "Wed", label: "Wed", date: "12" },
  { key: "Thu", label: "Thu", date: "13" },
  { key: "Fri", label: "Fri", date: "14" },
  { key: "Sat", label: "Sat", date: "15" },
  { key: "Sun", label: "Sun", date: "16" },
];

const defaultQuestions = ["What should we solve on the call?", "What is your website or main link?", "What outcome would make this useful?"];

const inputClass =
  "h-10 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10";

const textAreaClass =
  "min-h-24 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium leading-5 text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10";

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
  return times.slice(0, 12);
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

function bookingCustomer(booking: BookingRecord) {
  return Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-border bg-card shadow-sm", className)}>{children}</section>;
}

export function CalendarStudio({ data }: { data?: CalendarStudioData }) {
  const [activeTab, setActiveTab] = useState<CalendarTab>("booking");
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
      timezone: "Asia/Kolkata",
      activeDays: ["Mon", "Tue", "Wed", "Thu"],
      startTime: "10:00",
      endTime: "16:00",
      bufferMinutes: 10,
      slotIntervalMinutes: 30,
      intakeQuestions: defaultQuestions,
      meetingProvider: "google_meet",
      paymentProvider: "stripe",
      reminderCadence: "one_day",
      reschedulePolicy: "24h",
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
  const [timezone, setTimezone] = useState(() => offerConfigValue(selectedOffer, "timezone", "Asia/Kolkata"));
  const [activeDays, setActiveDays] = useState<string[]>(() => offerConfigValue(selectedOffer, "activeDays", ["Mon", "Tue", "Wed", "Thu"]));
  const [startTime, setStartTime] = useState(() => offerConfigValue(selectedOffer, "startTime", "10:00"));
  const [endTime, setEndTime] = useState(() => offerConfigValue(selectedOffer, "endTime", "16:00"));
  const [bufferMinutes, setBufferMinutes] = useState(() => offerConfigValue(selectedOffer, "bufferMinutes", 10));
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(() => offerConfigValue(selectedOffer, "slotIntervalMinutes", 30));
  const [questions, setQuestions] = useState<string[]>(() => offerConfigValue(selectedOffer, "intakeQuestions", defaultQuestions));
  const [meetingProvider, setMeetingProvider] = useState(() => offerConfigValue(selectedOffer, "meetingProvider", "google_meet"));
  const [paymentProvider, setPaymentProvider] = useState(() => offerConfigValue(selectedOffer, "paymentProvider", "stripe"));
  const [reminderCadence, setReminderCadence] = useState(() => offerConfigValue(selectedOffer, "reminderCadence", "one_day"));
  const [reschedulePolicy, setReschedulePolicy] = useState(() => offerConfigValue(selectedOffer, "reschedulePolicy", "24h"));
  const [slotState, setSlotState] = useState<Record<string, "available" | "blocked">>(() => initialSlotState(data?.calendarSlots ?? []));
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const times = useMemo(() => buildTimes(startTime, endTime, slotIntervalMinutes), [endTime, slotIntervalMinutes, startTime]);
  const currencyCode = selectedOffer.currency || "usd";
  const publicPath = `/u/${data?.page?.username || data?.page?.slug || ""}`;
  const activeSlotCount = weekDays.reduce(
    (sum, day) =>
      sum +
      times.filter((time) => activeDays.includes(day.key) && slotState[slotKey(day.key, time)] !== "blocked").length,
    0
  );
  const blockedCount = Object.values(slotState).filter((value) => value === "blocked").length;
  const upcomingBookings = (data?.bookings ?? []).filter((booking) => !booking.start_at || new Date(booking.start_at) >= new Date()).slice(0, 5);
  const confirmedCount = (data?.bookings ?? []).filter((booking) => booking.status === "confirmed").length;
  const heldCount = (data?.bookings ?? []).filter((booking) => booking.status === "held").length;

  function selectOffer(offer: BookingOffer) {
    setSelectedId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description ?? "");
    setDurationMinutes(offerConfigValue(offer, "durationMinutes", 30));
    setPriceCents(offer.price_cents ?? 0);
    setStatus(offer.status === "draft" ? "draft" : "published");
    setTimezone(offerConfigValue(offer, "timezone", "Asia/Kolkata"));
    setActiveDays(offerConfigValue(offer, "activeDays", ["Mon", "Tue", "Wed", "Thu"]));
    setStartTime(offerConfigValue(offer, "startTime", "10:00"));
    setEndTime(offerConfigValue(offer, "endTime", "16:00"));
    setBufferMinutes(offerConfigValue(offer, "bufferMinutes", 10));
    setSlotIntervalMinutes(offerConfigValue(offer, "slotIntervalMinutes", 30));
    setQuestions(offerConfigValue(offer, "intakeQuestions", defaultQuestions));
    setMeetingProvider(offerConfigValue(offer, "meetingProvider", "google_meet"));
    setPaymentProvider(offerConfigValue(offer, "paymentProvider", "stripe"));
    setReminderCadence(offerConfigValue(offer, "reminderCadence", "one_day"));
    setReschedulePolicy(offerConfigValue(offer, "reschedulePolicy", "24h"));
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
          currency: currencyCode,
          status,
          timezone,
          activeDays,
          startTime,
          endTime,
          bufferMinutes,
          slotIntervalMinutes,
          intakeQuestions: questions.filter(Boolean),
          meetingProvider,
          paymentProvider,
          reminderCadence,
          reschedulePolicy,
          slots: generatedSlots(),
        }),
      });
      const json = await response.json();

      if (!json?.ok) {
        const errMsg = json?.error?.message || "Could not save calendar.";
        setNotice(errMsg);
        captureClientEvent(analyticsEvents.bookingFailed, {
          reason: errMsg,
          title,
        });
        return;
      }

      const saved = json.data.offer as BookingOffer;
      
      // Capture successful booking type creation/update
      captureClientEvent(analyticsEvents.bookingCreated, {
        offer_id: saved.id,
        title: saved.title,
        price_cents: saved.price_cents ?? 0,
        duration_minutes: durationMinutes,
        status: saved.status ?? "published",
      });

      setOffers((current) => [saved, ...current.filter((offer) => offer.id !== selectedOffer.id && offer.id !== "new")]);
      setSelectedId(saved.id);
      setNotice("Saved. Your public page, checkout gate, slots, and confirmations are in sync.");
    });
  }

  function deleteCalendar() {
    if (!window.confirm("Are you sure you want to delete this booking type? This will permanently delete all associated slots and page blocks.")) return;
    
    setNotice("");
    startTransition(async () => {
      const response = await fetch(`/api/creator/calendar?offerId=${selectedOffer.id}&pageId=${data?.page?.id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!json?.ok) {
        setNotice(json?.error?.message || "Could not delete booking type.");
        return;
      }

      const remaining = offers.filter((offer) => offer.id !== selectedOffer.id);
      setOffers(remaining);
      setNotice("Booking type successfully deleted.");
      
      if (remaining.length) {
        selectOffer(remaining[0]);
      } else {
        createNewOffer();
      }
    });
  }

  async function copyLink() {
    if (!publicPath || publicPath === "/u/") return;
    await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-y border-border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "published" ? "success" : "warning"}>{status === "published" ? "Live event" : "Draft event"}</Badge>
          <Badge variant="outline">{activeSlotCount} open slots</Badge>
          <Badge variant="outline">{confirmedCount} confirmed</Badge>
          <Badge variant="outline">{heldCount} awaiting checkout</Badge>
          <Badge variant="outline">{durationMinutes} min</Badge>
          <Badge variant={priceCents > 0 ? "default" : "success"}>{priceCents > 0 ? currency(priceCents, currencyCode) : "Free"}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            Copy link
          </Button>
          <Button variant="outline" asChild>
            <a href={publicPath || "#"} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4" />
              Preview
            </a>
          </Button>
          <Button onClick={saveCalendar} disabled={isPending || !data?.page?.id}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="border-b border-border bg-card px-4">
        <nav className="flex gap-6 overflow-x-auto">
          {calendarTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-12 shrink-0 border-b-2 text-sm font-semibold transition",
                activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div
        className={cn(
          "grid gap-4 px-4 pb-6",
          activeTab === "booking" && "xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_360px]",
          activeTab === "availability" && "xl:grid-cols-1",
          activeTab === "bookings" && "xl:grid-cols-[360px_minmax(0,1fr)]",
          activeTab === "automation" && "xl:grid-cols-[minmax(0,1fr)_360px]"
        )}
      >
        {activeTab === "booking" || activeTab === "bookings" ? (
          <aside className="space-y-4">
            {activeTab === "booking" ? (
              <Panel>
            <div className="flex items-center justify-between border-b border-border p-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Event Types</h2>
                <p className="text-xs text-muted-foreground">Sell calls, audits, and sessions.</p>
              </div>
              <Button size="icon" className="h-8 w-8" onClick={createNewOffer} aria-label="Create booking type">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-1 p-2">
              {offers.map((offer) => {
                const selected = offer.id === selectedOffer.id;
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => selectOffer(offer)}
                    className={cn(
                      "group grid gap-2 rounded-md border px-3 py-3 text-left transition",
                      selected ? "border-foreground bg-foreground text-background" : "border-transparent bg-card hover:border-border hover:bg-secondary/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="line-clamp-2 text-sm font-semibold">{offer.title}</span>
                      <ChevronRight className={cn("mt-0.5 h-4 w-4", selected ? "text-background/70" : "text-muted-foreground")} />
                    </div>
                    <div className={cn("flex flex-wrap items-center gap-2 text-xs", selected ? "text-background/70" : "text-muted-foreground")}>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {offerConfigValue(offer, "durationMinutes", 30)}m
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
              </Panel>
            ) : null}

            {activeTab === "bookings" ? (
              <Panel className="p-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
              <Badge variant="secondary" className="ml-auto">{upcomingBookings.length}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {upcomingBookings.length ? (
                upcomingBookings.map((booking) => {
                  const customer = bookingCustomer(booking);
                  return (
                    <div key={booking.id} className="rounded-md border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{customer?.name || customer?.email || "Booked guest"}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {booking.start_at ? new Date(booking.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Scheduled session"}
                          </p>
                        </div>
                        <Badge variant={booking.status === "confirmed" ? "success" : booking.status === "held" ? "warning" : "secondary"} className="shrink-0">
                          {booking.status || "pending"}
                        </Badge>
                      </div>
                      {booking.meeting_url ? (
                        <a href={booking.meeting_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900">
                          <Video className="h-3.5 w-3.5" />
                          Open meeting link
                        </a>
                      ) : (
                        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                          {booking.status === "held" ? "Meeting link appears after checkout." : "Meeting link will appear after confirmation."}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No customer sessions yet. Visitors book from your Smart Link.</div>
              )}
            </div>
              </Panel>
            ) : null}
          </aside>
        ) : null}

        <main className="space-y-4">
          {activeTab === "booking" ? (
            <Panel>
              {/* Header section spanning full width */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border p-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Event Setup</h2>
                  <p className="text-sm text-muted-foreground">Details shown on the public booking page.</p>
                </div>
                <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-background shadow-sm shrink-0">
                  {(["published", "draft"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setStatus(item)}
                      className={cn(
                        "h-9 px-4 text-sm font-semibold capitalize transition",
                        status === item ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {item === "published" ? "Live" : "Draft"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form content with grid layout */}
              <div className="grid gap-6 p-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <Field label="Event name">
                    <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
                  </Field>
                  <Field label="Description">
                    <textarea className={textAreaClass} value={description} onChange={(event) => setDescription(event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-4 rounded-md border border-border bg-secondary/30 p-4 h-fit">
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
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-sm text-muted-foreground">$</span>
                        <input
                          className={cn(inputClass, "w-full pl-7")}
                          type="number"
                          min="0"
                          value={Math.round(priceCents / 100)}
                          onChange={(event) => setPriceCents(Math.max(0, Number(event.target.value) * 100))}
                        />
                      </div>
                    </Field>
                  </div>
                  <Field label="Meeting">
                    <select className={inputClass} value={meetingProvider} onChange={(event) => setMeetingProvider(event.target.value)}>
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                      <option value="manual">Manual link</option>
                    </select>
                  </Field>
                  <Field label="Checkout">
                    <select className={inputClass} value={paymentProvider} onChange={(event) => setPaymentProvider(event.target.value)}>
                      <option value="stripe">Stripe checkout</option>
                      <option value="manual">Manual invoice</option>
                    </select>
                  </Field>
                  {!isNew && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full mt-2 font-semibold bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white hover:border-transparent transition-all"
                      disabled={isPending}
                      onClick={deleteCalendar}
                    >
                      Delete Booking Type
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "availability" ? (
            <Panel>
            <div className="border-b border-border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Weekly Availability</h2>
                  <p className="text-sm text-muted-foreground">Click any open slot to book it. Saved slots publish three rolling weeks.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Field label="Timezone">
                    <select className={inputClass} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="America/New_York">New York</option>
                      <option value="America/Los_Angeles">Los Angeles</option>
                      <option value="Europe/London">London</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </Field>
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

              <div className="mt-4 grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const selected = activeDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setActiveDays((current) => (selected ? current.filter((item) => item !== day.key) : [...current, day.key]))}
                      className={cn(
                        "h-10 rounded-md border text-sm font-semibold transition",
                        selected ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto preview-scroll">
              <div className="min-w-[780px]">
                <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
                  {weekDays.map((day) => (
                    <div key={day.key} className="px-3 py-3 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{day.label}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{day.date}</p>
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
                              disabled && "cursor-not-allowed bg-secondary/40 text-muted-foreground/50",
                              !disabled && !blocked && "bg-card hover:bg-emerald-50",
                              blocked && !disabled && "bg-stone-100 text-muted-foreground"
                            )}
                          >
                            <span className="text-xs font-semibold">{timeLabel(time)}</span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                disabled ? "bg-muted text-muted-foreground" : blocked ? "bg-stone-200 text-stone-600" : "bg-emerald-100 text-emerald-700"
                              )}
                            >
                              {disabled ? "Off" : blocked ? "Booked" : "Open"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </Panel>
          ) : null}

          {activeTab === "bookings" ? (
            <Panel className="p-4">
              <h2 className="text-base font-semibold text-foreground">Session Health</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Confirmed</p>
                    <p className="text-xs text-muted-foreground">Events and meeting links created.</p>
                  </div>
                  <span className="text-lg font-semibold text-foreground">{confirmedCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Checkout</p>
                    <p className="text-xs text-muted-foreground">Held until payment confirms.</p>
                  </div>
                  <span className="text-lg font-semibold text-foreground">{heldCount}</span>
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "automation" ? (
            <Panel className="p-4">
              <h2 className="text-base font-semibold text-foreground">Automation</h2>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  [Video, "Meeting link", meetingProvider === "manual" ? "Manual link in confirmation." : "Generated after booking."],
                  [CreditCard, "Payment gate", priceCents > 0 ? "Checkout before confirmation." : "No payment required."],
                  [Mail, "Reminders", reminderCadence === "none" ? "Paused." : reminderCadence === "one_hour" ? "One hour before." : "One day before."],
                  [RefreshCw, "Reschedule", reschedulePolicy === "manual" ? "Manual approval." : reschedulePolicy === "open" ? "Open reschedule." : "Locked inside 24h."],
                  [Sparkles, "AI follow-up", "Draft recap after the call."],
                ].map(([Icon, titleText, body]) => {
                  const TypedIcon = Icon as typeof Video;
                  return (
                    <div key={titleText as string} className="flex gap-3 rounded-md border border-border bg-background p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
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
            </Panel>
          ) : null}

          {notice ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{notice}</div>
          ) : null}
        </main>

        {activeTab === "booking" || activeTab === "automation" ? (
          <aside className="space-y-4 xl:col-start-auto">
            {activeTab === "booking" ? (
              <Panel className="overflow-hidden">
            <div className="border-b border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Public Booking Surface</h2>
                  <p className="text-xs text-muted-foreground">Clients book from your Smart Link. This screen is for you.</p>
                </div>
                <Badge variant="outline">{timezone}</Badge>
              </div>
            </div>
            <div className="p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Visible offer</p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-foreground">{title || "Booking type"}</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{description || "Visitors can pick a time from your live schedule."}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Open</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{activeSlotCount}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Booked</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{blockedCount}</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">User booking flow</span>
                  <Badge variant={priceCents > 0 ? "default" : "success"}>{priceCents > 0 ? currency(priceCents, currencyCode) : "Free"}</Badge>
                </div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Users choose only published open slots.
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Name, email, phone, and prep note are collected first.
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    {priceCents > 0 ? "Checkout runs before the booking is confirmed." : "Free sessions confirm immediately."}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <a href={publicPath || "#"} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Open Smart Link
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/creator/settings">
                    <Settings className="h-4 w-4" />
                    Providers
                  </a>
                </Button>
              </div>
            </div>
              </Panel>
            ) : null}

            {activeTab === "automation" ? (
              <>
                <Panel className="p-4">
            <h2 className="text-base font-semibold text-foreground">Rules</h2>
            <div className="mt-3 grid gap-3">
              <Field label="Reminder">
                <select className={inputClass} value={reminderCadence} onChange={(event) => setReminderCadence(event.target.value)}>
                  <option value="one_day">One day before</option>
                  <option value="one_hour">One hour before</option>
                  <option value="none">None</option>
                </select>
              </Field>
              <Field label="Reschedule">
                <select className={inputClass} value={reschedulePolicy} onChange={(event) => setReschedulePolicy(event.target.value)}>
                  <option value="24h">Block inside 24h</option>
                  <option value="open">Open reschedule</option>
                  <option value="manual">Manual approval</option>
                </select>
              </Field>
            </div>
                </Panel>

                <Panel className="p-4">
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
                </Panel>

                <a href="/creator/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Provider connections
            <Link2 className="h-4 w-4" />
            <ExternalLink className="h-4 w-4" />
                </a>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
