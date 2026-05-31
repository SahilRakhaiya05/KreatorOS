"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Grid2X2,
  Inbox,
  Link as LinkIcon,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Send,
  Store,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/client/supabase/browserClient";
import { cn } from "@/lib/utils";

type ShortLink = {
  id: string;
  slug: string;
  destination_url: string;
  click_count: number;
};

type BrandDeal = {
  id: string;
  workspace_id?: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: "lead" | "pitched" | "replied" | "negotiating" | "approved" | "delivered" | "paid" | "lost";
  rate_cents: number;
  currency: string;
  deliverables: string[];
  due_date: string | null;
  metadata?: Record<string, any> | null;
  campaign_short_link_id?: string | ShortLink | null;
  created_at?: string;
  workspaces?: { name?: string | null; slug?: string | null } | null;
};

type CollabMessage = {
  id: string;
  campaign_id: string;
  sender_type: "creator" | "brand" | "system";
  body: string;
  metadata?: Record<string, any> | null;
  created_at: string;
};

type View = "programs" | "marketplace" | "invitations" | "messages";
type ApplicationAnswers = {
  pitch: string;
  audienceFit: string;
  mediaKitUrl: string;
  proposedRate: string;
  timeline: string;
};

const pipeline: BrandDeal["status"][] = ["lead", "pitched", "replied", "negotiating", "approved", "delivered", "paid", "lost"];
const invitedStatuses = new Set<BrandDeal["status"]>(["lead", "pitched", "replied"]);

function money(cents = 0, currency = "usd") {
  return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortLinkOf(deal: BrandDeal): ShortLink | null {
  return typeof deal.campaign_short_link_id === "object" && deal.campaign_short_link_id ? deal.campaign_short_link_id : null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "B";
}

async function copyTextSafely(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  }
}

export function BrandCrmClient() {
  const [view, setView] = useState<View>("programs");
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [marketplacePrograms, setMarketplacePrograms] = useState<BrandDeal[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [applyingProgramId, setApplyingProgramId] = useState("");
  const [applicationProgram, setApplicationProgram] = useState<BrandDeal | null>(null);
  const [applicationAnswers, setApplicationAnswers] = useState<ApplicationAnswers>({
    pitch: "",
    audienceFit: "",
    mediaKitUrl: "",
    proposedRate: "",
    timeline: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState("");

  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rateDollars, setRateDollars] = useState("0");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [dueDate, setDueDate] = useState("");

  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0] ?? null;
  const invitations = deals.filter((deal) => invitedStatuses.has(deal.status));
  const paidTotal = deals.filter((deal) => deal.status === "paid").reduce((sum, deal) => sum + Number(deal.rate_cents ?? 0), 0);
  const upcomingTotal = deals.filter((deal) => deal.status !== "paid" && deal.status !== "lost").reduce((sum, deal) => sum + Number(deal.rate_cents ?? 0), 0);

  const filteredPrograms = useMemo(() => {
    if (view === "invitations") return invitations;
    return deals;
  }, [deals, invitations, view]);

  async function fetchDeals() {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/brand-deals");
      const json = await res.json();
      if (json.ok) {
        const list = json.data?.deals ?? [];
        setDeals(list);
        setSelectedId((current) => current || list[0]?.id || "");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchMarketplace() {
    const res = await fetch("/api/creator/brand-deals?marketplace=1");
    const json = await res.json();
    setMarketplacePrograms(json.ok ? json.data?.programs ?? [] : []);
  }

  async function fetchMessages(dealId: string) {
    if (!dealId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/creator/collab-messages?campaignId=${dealId}`);
      const json = await res.json();
      setMessages(json.ok ? json.data?.messages ?? [] : []);
    } finally {
      setMessagesLoading(false);
    }
  }

  useEffect(() => {
    fetchDeals();
    fetchMarketplace();
  }, []);

  function resetApplication() {
    setApplicationProgram(null);
    setApplicationAnswers({
      pitch: "",
      audienceFit: "",
      mediaKitUrl: "",
      proposedRate: "",
      timeline: "",
    });
  }

  async function applyToProgram(program: BrandDeal, answers: ApplicationAnswers) {
    setApplyingProgramId(program.id);
    setNotice("");
    try {
      const res = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          sourceProgramId: program.id,
          brandName: program.brand_name,
          status: "replied",
          rateCents: program.rate_cents || 0,
          currency: program.currency || "usd",
          deliverables: program.deliverables || [],
          dueDate: program.due_date || null,
          application: answers,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not apply to program.");
      await fetchDeals();
      setSelectedId(json.data?.deal?.id || "");
      setView("messages");
      resetApplication();
      setNotice("Application sent.");
    } catch (error: any) {
      setNotice(error.message || "Could not apply to program.");
    } finally {
      setApplyingProgramId("");
    }
  }

  useEffect(() => {
    fetchMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`collab_messages:${selectedId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collab_messages", filter: `campaign_id=eq.${selectedId}` },
        (payload: any) => {
          const nextMessage = payload.new as CollabMessage | null;
          const oldMessage = payload.old as CollabMessage | null;

          setMessages((current) => {
            if (payload.eventType === "DELETE" && oldMessage?.id) {
              return current.filter((message) => message.id !== oldMessage.id);
            }

            if (!nextMessage?.id) return current;
            const withoutDuplicate = current.filter((message) => message.id !== nextMessage.id);
            return [...withoutDuplicate, nextMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId]);

  async function saveDeal(event: React.FormEvent) {
    event.preventDefault();
    if (!brandName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          status: "lead",
          rateCents: Math.round(Number(rateDollars || 0) * 100),
          currency: "usd",
          deliverables: deliverablesText.split(",").map((item) => item.trim()).filter(Boolean),
          dueDate: dueDate || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not create program.");
      setShowAddModal(false);
      setBrandName("");
      setContactName("");
      setContactEmail("");
      setRateDollars("0");
      setDeliverablesText("");
      setDueDate("");
      await fetchDeals();
      setSelectedId(json.data?.deal?.id || "");
    } catch (error: any) {
      setNotice(error.message || "Could not create program.");
    } finally {
      setSaving(false);
    }
  }

  async function updateDeal(deal: BrandDeal, update: Partial<BrandDeal>) {
    const next = { ...deal, ...update };
    const res = await fetch("/api/creator/brand-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deal.id,
        brandName: next.brand_name,
        contactName: next.contact_name,
        contactEmail: next.contact_email,
        status: next.status,
        rateCents: next.rate_cents,
        currency: next.currency,
        deliverables: next.deliverables ?? [],
        dueDate: next.due_date,
        campaignShortLinkId: typeof next.campaign_short_link_id === "string" ? next.campaign_short_link_id : shortLinkOf(next)?.id,
        metadata: next.metadata || {},
      }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error?.message || "Could not update program.");
    setDeals((current) => current.map((item) => (item.id === deal.id ? { ...item, ...json.data.deal } : item)));
  }

  async function generateCampaignLink(deal: BrandDeal) {
    setGeneratingLink(true);
    setNotice("");
    try {
      const slug = `brand-${deal.brand_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;
      const res = await fetch("/api/creator/short-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          destinationUrl: `${window.location.origin}/creator/brand-crm?program=${deal.id}`,
          campaignName: `${deal.brand_name} brand program`,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not create campaign link.");
      await updateDeal(deal, { campaign_short_link_id: json.data.link.id });
      await fetchDeals();
      setNotice("Link created.");
    } catch (error: any) {
      setNotice(error.message || "Could not create campaign link.");
    } finally {
      setGeneratingLink(false);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedDeal || !messageText.trim()) return;
    const body = messageText.trim();
    setMessageText("");
    setSending(true);
    try {
      const res = await fetch("/api/creator/collab-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedDeal.id,
          body,
          senderType: "creator",
          chatMode: "human",
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not send message.");
      if (selectedDeal.status === "lead") await updateDeal(selectedDeal, { status: "replied" });
    } catch (error: any) {
      setNotice(error.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  const tabItems = [
    { id: "programs" as const, label: "Programs", icon: Grid2X2, count: deals.length },
    { id: "marketplace" as const, label: "Marketplace", icon: Store, count: null },
    { id: "invitations" as const, label: "Invitations", icon: UserRoundPlus, count: invitations.length },
    { id: "messages" as const, label: "Messages", icon: MessageCircle, count: messages.length },
  ];

  return (
    <div className="min-h-[calc(100vh-150px)] overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-card px-6">
        <div className="flex min-h-16 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex min-w-0 gap-6 overflow-x-auto">
            {tabItems.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    "relative flex h-12 shrink-0 items-center gap-2 border-b-2 px-0 text-sm font-semibold transition",
                    active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  {item.count !== null ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{item.count}</span> : <Badge className="bg-blue-600 text-white">New</Badge>}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-4 rounded-md border border-border bg-background px-3 py-2">
            <WalletCards className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">Upcoming</p>
              <p className="text-sm font-semibold text-foreground">{money(upcomingTotal)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[11px] text-muted-foreground">Received</p>
              <p className="text-sm font-semibold text-foreground">{money(paidTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="min-w-0 bg-background">
        <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {view === "marketplace" ? "Marketplace" : view === "invitations" ? "Invitations" : view === "messages" ? "Messages" : "Programs"}
              </h1>
              {selectedDeal && view !== "marketplace" ? <p className="mt-0.5 text-xs text-muted-foreground">Selected: {selectedDeal.brand_name}</p> : null}
            </div>
            <Button variant="outline" onClick={() => fetchMarketplace()}>Refresh</Button>
        </div>

        {notice ? <div className="border-b border-border bg-amber-50 px-6 py-2 text-sm font-medium text-amber-800">{notice}</div> : null}

        {loading ? (
          <div className="flex h-[520px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : view === "marketplace" ? (
          <MarketplaceView programs={marketplacePrograms} onStartApply={setApplicationProgram} applyingProgramId={applyingProgramId} />
        ) : view === "messages" ? (
          <MessagesView
            deals={deals}
            selectedDeal={selectedDeal}
            setSelectedId={setSelectedId}
            messages={messages}
            messagesLoading={messagesLoading}
            messageText={messageText}
            setMessageText={setMessageText}
            sendMessage={sendMessage}
            sending={sending}
          />
        ) : (
          <ProgramsView
            emptyTitle={view === "invitations" ? "No program invitations" : "No brand programs yet"}
            emptyBody={view === "invitations" ? "Brand invites appear here." : "Applied programs appear here."}
            deals={filteredPrograms}
            selectedDeal={selectedDeal}
            setSelectedId={setSelectedId}
            updateDeal={updateDeal}
            generateCampaignLink={generateCampaignLink}
            generatingLink={generatingLink}
          />
        )}
      </main>

      <Dialog open={Boolean(applicationProgram)} onOpenChange={(open) => !open && resetApplication()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply to {applicationProgram?.brand_name || "program"}</DialogTitle>
            <DialogDescription>Send a short, review-ready application.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!applicationProgram) return;
              void applyToProgram(applicationProgram, applicationAnswers);
            }}
          >
            <Field label="Why are you a fit?">
              <textarea
                className={cn(inputClass, "h-24 py-2")}
                value={applicationAnswers.pitch}
                onChange={(event) => setApplicationAnswers((current) => ({ ...current, pitch: event.target.value }))}
                placeholder="Your angle and why you fit."
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Audience fit">
                <input
                  className={inputClass}
                  value={applicationAnswers.audienceFit}
                  onChange={(event) => setApplicationAnswers((current) => ({ ...current, audienceFit: event.target.value }))}
                  placeholder="Founders, developers..."
                  required
                />
              </Field>
              <Field label="Media kit / proof link">
                <input
                  className={inputClass}
                  value={applicationAnswers.mediaKitUrl}
                  onChange={(event) => setApplicationAnswers((current) => ({ ...current, mediaKitUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Proposed rate">
                <input
                  className={inputClass}
                  value={applicationAnswers.proposedRate}
                  onChange={(event) => setApplicationAnswers((current) => ({ ...current, proposedRate: event.target.value }))}
                  placeholder={applicationProgram ? money(applicationProgram.rate_cents, applicationProgram.currency) : "$0"}
                />
              </Field>
              <Field label="Timeline">
                <input
                  className={inputClass}
                  value={applicationAnswers.timeline}
                  onChange={(event) => setApplicationAnswers((current) => ({ ...current, timeline: event.target.value }))}
                  placeholder="Can deliver within 7 days"
                  required
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetApplication}>Cancel</Button>
              <Button type="submit" disabled={!applicationProgram || applyingProgramId === applicationProgram?.id}>
                {applyingProgramId === applicationProgram?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                Apply
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create brand program</DialogTitle>
            <DialogDescription>Add a partnership record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveDeal} className="grid gap-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Brand name">
                <input className={inputClass} value={brandName} onChange={(event) => setBrandName(event.target.value)} required />
              </Field>
              <Field label="Contact name">
                <input className={inputClass} value={contactName} onChange={(event) => setContactName(event.target.value)} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact email">
                <input className={inputClass} type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              </Field>
              <Field label="Status">
                <input className={inputClass} value="Submitted" disabled />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Program value">
                <input className={inputClass} type="number" min="0" value={rateDollars} onChange={(event) => setRateDollars(event.target.value)} />
              </Field>
              <Field label="Due date">
                <input className={inputClass} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </Field>
            </div>
            <Field label="Deliverables">
              <textarea
                className={cn(inputClass, "h-20 py-2")}
                value={deliverablesText}
                onChange={(event) => setDeliverablesText(event.target.value)}
                placeholder="1x video, 1x short"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save program"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const inputClass = "h-10 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10";

function paymentStatusLabel(status: BrandDeal["status"]) {
  if (status === "paid") return "Released";
  if (status === "delivered") return "Ready";
  if (status === "approved") return "Pending";
  return "Queued";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ApplicationLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold text-foreground">{label}:</span>{" "}
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}

function MarketplaceView({
  programs,
  onStartApply,
  applyingProgramId,
}: {
  programs: BrandDeal[];
  onStartApply: (program: BrandDeal) => void;
  applyingProgramId: string;
}) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Marketplace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Apply to open brand programs.</p>
          </div>
          <Badge variant="secondary">{programs.length} open</Badge>
        </div>
      </div>

      {programs.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {programs.map((program) => (
            <div key={program.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{program.brand_name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{program.metadata?.marketplace_description || "Open collaboration."}</p>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{program.workspaces?.name || "Brand"}</p>
                </div>
                <Badge variant="success">Open</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">{money(program.rate_cents, program.currency)}</Badge>
                {(program.deliverables || []).map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
              </div>
              <Button className="mt-5 w-full" onClick={() => onStartApply(program)} disabled={applyingProgramId === program.id}>
                {applyingProgramId === program.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                Apply with details
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-72 place-items-center text-center">
          <div>
            <Store className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No open programs</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Brand programs will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramsView({
  deals,
  selectedDeal,
  setSelectedId,
  updateDeal,
  generateCampaignLink,
  generatingLink,
  emptyTitle,
  emptyBody,
}: {
  deals: BrandDeal[];
  selectedDeal: BrandDeal | null;
  setSelectedId: (id: string) => void;
  updateDeal: (deal: BrandDeal, update: Partial<BrandDeal>) => Promise<void>;
  generateCampaignLink: (deal: BrandDeal) => void;
  generatingLink: boolean;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (!deals.length) {
    return (
      <div className="grid h-[560px] place-items-center p-6 text-center">
        <div>
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">{emptyTitle}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-215px)] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="border-r border-border p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input className={cn(inputClass, "w-full pl-9")} placeholder="Search..." />
          </div>
          <Badge variant="outline">{deals.length} total</Badge>
        </div>
        <div className="grid gap-3">
          {deals.map((deal) => {
            const active = selectedDeal?.id === deal.id;
            const link = shortLinkOf(deal);
            return (
              <button
                key={deal.id}
                type="button"
                onClick={() => setSelectedId(deal.id)}
                className={cn("rounded-lg border p-4 text-left transition", active ? "border-foreground bg-card shadow-sm" : "border-border bg-card hover:border-foreground/40")}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {initials(deal.brand_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate text-base font-semibold text-foreground">{deal.brand_name}</h3>
                      <Badge variant={deal.status === "paid" ? "success" : deal.status === "lost" ? "destructive" : "secondary"}>{titleCase(deal.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{deal.contact_email || deal.contact_name || "No contact added"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{money(deal.rate_cents, deal.currency)}</Badge>
                      {deal.due_date ? <Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" />{new Date(deal.due_date).toLocaleDateString()}</Badge> : null}
                      {link ? <Badge variant="accent"><LinkIcon className="mr-1 h-3 w-3" />{link.click_count} clicks</Badge> : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <ProgramDetails
        deal={selectedDeal}
        updateDeal={updateDeal}
        generateCampaignLink={generateCampaignLink}
        generatingLink={generatingLink}
      />
    </div>
  );
}

function ProgramDetails({
  deal,
  updateDeal,
  generateCampaignLink,
  generatingLink,
}: {
  deal: BrandDeal | null;
  updateDeal: (deal: BrandDeal, update: Partial<BrandDeal>) => Promise<void>;
  generateCampaignLink: (deal: BrandDeal) => void;
  generatingLink: boolean;
}) {
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);
  if (!deal) return null;
  const link = shortLinkOf(deal);
  const paymentRelease = deal.metadata?.payment_release || {};
  const paymentLabel = paymentStatusLabel(deal.status);
  const application = deal.metadata?.application || {};
  const creatorSubmission = deal.metadata?.creator_submission || {};
  const canSubmitWork = deal.status !== "paid" && deal.status !== "lost";

  async function submitWork(event: React.FormEvent) {
    event.preventDefault();
    if (!deal || !submissionUrl.trim()) return;
    setSubmittingWork(true);
    try {
      await updateDeal(deal, {
        status: "delivered",
        metadata: {
          ...(deal.metadata || {}),
          creator_submission: {
            url: submissionUrl.trim(),
            note: submissionNote.trim(),
            submitted_at: new Date().toISOString(),
          },
          payment_release: {
            ...(paymentRelease || {}),
            status: "ready",
            deliverables_submitted_at: new Date().toISOString(),
          },
        },
      });
      setSubmissionUrl("");
      setSubmissionNote("");
    } finally {
      setSubmittingWork(false);
    }
  }

  return (
    <aside className="bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground font-semibold text-background">{initials(deal.brand_name)}</div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{deal.brand_name}</h2>
            <p className="text-sm text-muted-foreground">{deal.contact_email || "No contact email"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-foreground">{titleCase(deal.status)}</p>
            <Badge variant={deal.status === "paid" ? "success" : deal.status === "lost" ? "destructive" : "secondary"}>{paymentLabel}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{money(deal.rate_cents, deal.currency)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Due</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{deal.due_date ? new Date(deal.due_date).toLocaleDateString() : "TBD"}</p>
          </div>
        </div>
      </div>

      {application.pitch || application.audienceFit || application.mediaKitUrl || application.timeline ? (
        <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Application</h3>
          <div className="mt-3 grid gap-3 text-sm">
            {application.pitch ? <p><span className="font-semibold text-foreground">Fit:</span> <span className="text-muted-foreground">{application.pitch}</span></p> : null}
            {application.audienceFit ? <ApplicationLine label="Audience" value={application.audienceFit} /> : null}
            {application.mediaKitUrl ? <ApplicationLine label="Proof" value={application.mediaKitUrl} /> : null}
            {application.proposedRate ? <ApplicationLine label="Rate" value={application.proposedRate} /> : null}
            {application.timeline ? <ApplicationLine label="Timeline" value={application.timeline} /> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Deliverables</h3>
        <div className="mt-2 grid gap-2">
          {(deal.deliverables ?? []).length ? deal.deliverables.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {item}
            </div>
          )) : <p className="text-sm text-muted-foreground">No deliverables added.</p>}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Submit work</h3>
            <p className="mt-1 text-xs text-muted-foreground">Add a link for review.</p>
          </div>
          {creatorSubmission.url ? <Badge variant="success">Submitted</Badge> : <Badge variant="secondary">Pending</Badge>}
        </div>
        {creatorSubmission.url ? (
          <div className="mt-3 rounded-md border border-border bg-card p-3 text-sm">
            <p className="font-semibold text-foreground">Latest link</p>
            <a className="mt-1 block truncate text-blue-600 underline-offset-2 hover:underline" href={creatorSubmission.url} target="_blank" rel="noreferrer">
              {creatorSubmission.url}
            </a>
            {creatorSubmission.note ? <p className="mt-2 text-muted-foreground">{creatorSubmission.note}</p> : null}
            {creatorSubmission.submitted_at ? <p className="mt-2 text-xs text-muted-foreground">Submitted {new Date(creatorSubmission.submitted_at).toLocaleString()}</p> : null}
          </div>
        ) : null}
        <form onSubmit={submitWork} className="mt-3 grid gap-2">
          <input
            className={inputClass}
            value={submissionUrl}
            onChange={(event) => setSubmissionUrl(event.target.value)}
            placeholder="https://..."
            disabled={!canSubmitWork || submittingWork}
          />
          <textarea
            className={cn(inputClass, "h-20 py-2")}
            value={submissionNote}
            onChange={(event) => setSubmissionNote(event.target.value)}
            placeholder="Note..."
            disabled={!canSubmitWork || submittingWork}
          />
          <Button type="submit" disabled={!canSubmitWork || !submissionUrl.trim() || submittingWork}>
            {submittingWork ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
            Submit link
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Payment</h3>
            <p className="mt-1 text-xs text-muted-foreground">Current payout state.</p>
          </div>
          <Badge variant={deal.status === "paid" ? "success" : "secondary"}>{paymentLabel}</Badge>
        </div>
        <div className="mt-3 rounded-md border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="mt-1 text-base font-semibold text-foreground">{money(deal.rate_cents, deal.currency)}</p>
          {paymentRelease.released_at ? <p className="mt-1 text-xs text-muted-foreground">Released {new Date(paymentRelease.released_at).toLocaleString()}</p> : null}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Brands release payment from their workspace.</p>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Link</h3>
            <p className="mt-1 text-xs text-muted-foreground">Track clicks.</p>
          </div>
          {link ? <Badge variant="accent">{link.click_count} clicks</Badge> : null}
        </div>
        {link ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card p-2">
            <code className="min-w-0 flex-1 truncate text-xs">/{link.slug}</code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void copyTextSafely(link.destination_url)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={link.destination_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
        ) : (
          <Button className="mt-3 w-full" variant="outline" onClick={() => generateCampaignLink(deal)} disabled={generatingLink}>
            {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
            Generate link
          </Button>
        )}
      </div>
    </aside>
  );
}

function MessagesView({
  deals,
  selectedDeal,
  setSelectedId,
  messages,
  messagesLoading,
  messageText,
  setMessageText,
  sendMessage,
  sending,
}: {
  deals: BrandDeal[];
  selectedDeal: BrandDeal | null;
  setSelectedId: (id: string) => void;
  messages: CollabMessage[];
  messagesLoading: boolean;
  messageText: string;
  setMessageText: (text: string) => void;
  sendMessage: (event: React.FormEvent) => void;
  sending: boolean;
}) {
  return (
    <div className="grid min-h-[calc(100vh-215px)] lg:grid-cols-[320px_minmax(0,1fr)_340px]">
      <aside className="border-r border-border bg-card">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <h2 className="font-semibold text-foreground">Conversations</h2>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-1 p-2">
          {deals.map((deal) => (
            <button
              key={deal.id}
              type="button"
              onClick={() => setSelectedId(deal.id)}
              className={cn(
                "rounded-md px-3 py-3 text-left transition",
                selectedDeal?.id === deal.id ? "bg-secondary text-foreground" : "hover:bg-secondary/60"
              )}
            >
              <p className="truncate text-sm font-semibold">{deal.brand_name}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{deal.contact_email || titleCase(deal.status)}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col bg-background">
        <div className="flex h-14 items-center justify-between border-b border-border bg-card px-5">
          <h2 className="font-semibold text-foreground">{selectedDeal?.brand_name || "Select a program"}</h2>
          {selectedDeal ? (
            <div className="flex items-center gap-2">
              <Badge variant="success">Live</Badge>
              <Badge variant="outline">{titleCase(selectedDeal.status)}</Badge>
            </div>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {messagesLoading ? (
            <div className="grid h-full place-items-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
          ) : messages.length ? (
            <div className="space-y-3">
              {messages.map((message) => {
                const mine = message.sender_type === "creator";
                return (
                  <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[72%] rounded-lg px-3 py-2 text-sm shadow-sm",
                        mine ? "bg-foreground text-background" : "border border-border bg-card text-foreground"
                      )}
                    >
                      {mine ? (
                        <p className="text-[9px] font-black tracking-wider uppercase text-slate-400 mb-1">
                          Creator Partner (Me)
                        </p>
                      ) : (
                        <p className="text-[9px] font-black tracking-wider uppercase text-primary mb-1">
                          {selectedDeal?.brand_name || "Brand Partner"}
                        </p>
                      )}
                      <p className="leading-relaxed">{message.body}</p>
                      <p className={cn("mt-1 text-[10px]", mine ? "text-background/60" : "text-muted-foreground")}>
                        {new Date(message.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <MessageCircle className="mx-auto h-11 w-11 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No messages</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Start the conversation.</p>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={sendMessage} className="border-t border-border bg-card p-4">
          <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2">
            <textarea
              className="min-h-16 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
              placeholder={selectedDeal ? `Message ${selectedDeal.brand_name}...` : "Select a program"}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              disabled={!selectedDeal}
            />
            <Button type="submit" disabled={!selectedDeal || sending || !messageText.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </div>
        </form>
      </section>

      <aside className="border-l border-border bg-card p-5">
        {selectedDeal ? (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Program</h2>
              <Button variant="outline" size="sm" onClick={() => window.location.hash = selectedDeal.id}>View</Button>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground font-semibold text-background">{initials(selectedDeal.brand_name)}</div>
              <div>
                <p className="font-semibold text-foreground">{selectedDeal.brand_name}</p>
                <p className="text-sm text-muted-foreground">{selectedDeal.contact_email || "No contact email"}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-border">
              {[
                ["Clicks", shortLinkOf(selectedDeal)?.click_count ?? 0, BarChart3],
                ["Leads", messages.length, UserRoundPlus],
                ["Revenue", money(selectedDeal.rate_cents, selectedDeal.currency), CircleDollarSign],
                ["Status", titleCase(selectedDeal.status), CheckCircle2],
              ].map(([label, value, Icon]) => {
                const TypedIcon = Icon as typeof BarChart3;
                return (
                  <div key={String(label)} className="border-b border-r border-border p-3 last:border-r-0">
                    <TypedIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">{String(label)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{String(value)}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-lg border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Payment</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedDeal.status === "paid"
                  ? "Payment is recorded."
                  : selectedDeal.status === "delivered"
                    ? "Work is ready for brand review."
                    : "Payment follows brand approval."}
              </p>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
