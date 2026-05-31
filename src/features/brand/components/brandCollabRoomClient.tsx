"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { 
  MessageSquare, Send, ShieldCheck, Loader2, RefreshCw, Handshake, 
  Calendar, DollarSign, ListTodo, Bot, User, Check, ClipboardCheck, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { captureClientEvent, analyticsEvents } from "@/client/posthog/events";

type Message = {
  id: string;
  campaign_id: string;
  sender_type: "creator" | "brand" | "system";
  body: string;
  metadata?: {
    chat_mode?: "ai" | "human";
    is_ai?: boolean;
  };
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

type BrandDeal = {
  id: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: string;
  rate_cents: number;
  currency: string;
  deliverables: string[];
  due_date: string | null;
  metadata?: any;
  workspaces?: {
    name: string | null;
    slug: string | null;
    creator_profiles?: {
      display_name: string;
    } | null;
  } | null;
};

export function BrandCollabRoomClient() {
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<BrandDeal | null>(null);
  const [chatMode, setChatMode] = useState<"ai" | "human">("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Manual Prerequisite override states
  const [showOverride, setShowOverride] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [updatingPrereq, setUpdatingPrereq] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  async function fetchDeals() {
    try {
      const res = await fetch("/api/creator/brand-deals");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data?.deals)) {
        const activeDeals = json.data.deals as BrandDeal[];
        setDeals(activeDeals);
        if (activeDeals.length > 0) {
          setSelectedDeal((prev) => {
            if (prev) {
              const matched = activeDeals.find((d) => d.id === prev.id);
              if (matched) return matched;
            }
            return activeDeals[0];
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch brand deals:", err);
    } finally {
      setLoadingDeals(false);
    }
  }

  const updateDealStatus = async (newStatus: string) => {
    if (!selectedDeal) return;
    try {
      const res = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDeal.id,
          brandName: selectedDeal.brand_name,
          status: newStatus,
          rateCents: selectedDeal.rate_cents,
          deliverables: selectedDeal.deliverables,
          dueDate: selectedDeal.due_date,
          metadata: selectedDeal.metadata || {},
        })
      });
      const json = await res.json();
      if (json.ok) {
        setSelectedDeal(prev => prev ? { ...prev, status: newStatus } : null);
        fetchDeals();
      }
    } catch (err) {
      console.error("Failed to update deal status:", err);
    }
  };

  const postCollabMessage = async (bodyText: string, senderType: "creator" | "brand" | "system") => {
    if (!selectedDeal) return;
    try {
      await fetch("/api/creator/collab-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedDeal.id,
          body: bodyText,
          senderType,
          chatMode,
        }),
      });
    } catch (err) {
      console.error("Failed to post collab message:", err);
    }
  };

  const handleAcceptPackage = async () => {
    if (!selectedDeal) return;
    captureClientEvent(analyticsEvents.collabRoomPackageAccepted, {
      deal_id: selectedDeal.id,
      rate_cents: selectedDeal.rate_cents,
    });
    await updateDealStatus("approved");
    await postCollabMessage(`🤝 Creator accepted the sponsorship package rate of $${(selectedDeal.rate_cents / 100).toFixed(2)} USD. Escrow funds are now securely locked via Stripe Connect.`, "system");
    await postCollabMessage(`Excellent! I've authorized the Stripe Connect hold. The contract is locked, and we are ready for you to create the deliverables. Please upload your draft link here as soon as it's ready!`, "brand");
    fetchMessages(selectedDeal.id);
  };

  const handleApproveDeliverable = async () => {
    if (!selectedDeal) return;
    captureClientEvent(analyticsEvents.collabRoomDeliverableApproved, {
      deal_id: selectedDeal.id,
      rate_cents: selectedDeal.rate_cents,
    });
    await updateDealStatus("paid");
    await postCollabMessage(`🎉 Sponsorship deliverable approved by Brand. Stripe Connect escrow payment of $${(selectedDeal.rate_cents / 100).toFixed(2)} USD successfully released to Creator Wallet.`, "system");
    await postCollabMessage(`Excellent work! The deliverable has been approved. Sponsorship payout has been released. Looking forward to our next collaboration!`, "brand");
    fetchMessages(selectedDeal.id);
  };

  async function fetchMessages(campaignId: string) {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/creator/collab-messages?campaignId=${campaignId}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data?.messages)) {
        setMessages(json.data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  const handleUpdatePrereqValue = async (field: string) => {
    if (!selectedDeal || updatingPrereq) return;
    captureClientEvent(analyticsEvents.collabRoomPrerequisiteOverridden, {
      deal_id: selectedDeal.id,
      field,
    });
    setUpdatingPrereq(true);

    const currentMeta = selectedDeal.metadata || {};
    const updatedPrereqs = currentMeta.prerequisites || {
      media_kit: null,
      rate: null,
      audience: null,
      delivery_date: null,
      status: {
        media_kit: "pending",
        rate: "pending",
        audience: "pending",
        delivery_date: "pending"
      }
    };

    updatedPrereqs[field] = overrideValue.trim() || null;
    updatedPrereqs.status[field] = overrideValue.trim() ? "submitted" : "pending";
    currentMeta.prerequisites = updatedPrereqs;

    try {
      const response = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDeal.id,
          brandName: selectedDeal.brand_name,
          status: selectedDeal.status,
          rateCents: selectedDeal.rate_cents,
          dueDate: selectedDeal.due_date,
          metadata: currentMeta,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        setSelectedDeal(prev => prev ? { ...prev, metadata: currentMeta } : null);
        fetchDeals();
        setShowOverride(null);
        setOverrideValue("");
      }
    } catch {
      alert("Failed to save parameter.");
    } finally {
      setUpdatingPrereq(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    if (selectedDeal) {
      fetchMessages(selectedDeal.id);
    } else {
      setMessages([]);
    }
  }, [selectedDeal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMode]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !inputText.trim() || sending) return;

    setSending(true);
    const userMessage = inputText.trim();
    setInputText("");
    
    captureClientEvent(analyticsEvents.collabRoomMessageSent, {
      deal_id: selectedDeal.id,
      chat_mode: chatMode,
      sender_type: "brand",
    });

    try {
      const res = await fetch("/api/creator/collab-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedDeal.id,
          body: userMessage,
          senderType: "brand", // Sending as the brand manager
          chatMode: chatMode,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        fetchMessages(selectedDeal.id);
      } else {
        alert(json.error?.message || "Failed to send message.");
      }
    } catch (err) {
      alert("Network error sending message.");
    } finally {
      setSending(false);
    }
  };

  // Extract prerequisites from selected deal metadata
  const prereqs = selectedDeal?.metadata?.prerequisites || {
    media_kit: null,
    rate: null,
    audience: null,
    delivery_date: null,
    status: {
      media_kit: "pending",
      rate: "pending",
      audience: "pending",
      delivery_date: "pending"
    }
  };

  const isMediaKitDone = prereqs.status.media_kit === "submitted";
  const isRateDone = prereqs.status.rate === "submitted";
  const isAudienceDone = prereqs.status.audience === "submitted";
  const isTimelineDone = prereqs.status.delivery_date === "submitted";

  const allPrereqsDone = isMediaKitDone && isRateDone && isAudienceDone && isTimelineDone;

  // Filter messages based on chat mode (AI autopilot history vs Human direct chat)
  const filteredMessages = messages.filter((m) => {
    const msgMode = m.metadata?.chat_mode || (m.metadata?.is_ai ? "ai" : "human");
    return msgMode === chatMode;
  });

  if (loadingDeals) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-3xl bg-secondary/15">
        <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-black text-foreground">No Brand Collaborations Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-2">
          Create a new Brand Deal in your creator Brand CRM dashboard first to establish a live collaboration chat room.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_1fr_320px]">
      
      {/* Sidebar: Active Deals List */}
      <Card className="flex flex-col border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-black text-foreground">Select Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-3 overflow-y-auto space-y-2">
          {deals.map((deal) => {
            const isSelected = selectedDeal?.id === deal.id;
            return (
              <button
                key={deal.id}
                onClick={() => {
                  setSelectedDeal(deal);
                  captureClientEvent(analyticsEvents.collabRoomDealSelected, {
                    deal_id: deal.id,
                    brand_name: deal.brand_name,
                    status: deal.status,
                    rate_cents: deal.rate_cents
                  });
                }}
                className={`w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/60 bg-secondary/30 hover:bg-secondary/70 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-xs truncate max-w-[70%]">{deal.brand_name}</p>
                  <Badge variant="accent" className="text-[9px] px-1 py-0">{deal.status}</Badge>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground mt-1.5 flex items-center gap-1 font-mono">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  {(deal.rate_cents / 100).toFixed(2)} USD
                </p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Main Chat Thread */}
      <Card className="flex flex-col overflow-hidden border border-border bg-card min-h-[520px] h-[calc(100vh-14rem)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 py-3.5 px-5 gap-3 bg-secondary/5">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-primary" />
              <span>Collab Room: {selectedDeal?.brand_name}</span>
            </CardTitle>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Live collaboration channel with Creator Partner
            </p>
          </div>
          
          {/* Stunning Toggle Switch */}
          <div className="flex items-center bg-secondary p-1 rounded-xl border border-border shadow-inner shrink-0 w-fit">
            <button
              onClick={() => {
                setChatMode("ai");
                captureClientEvent(analyticsEvents.collabRoomChatModeToggled, { chat_mode: "ai" });
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all duration-200 ${
                chatMode === "ai"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3 w-3" />
              <span>AI Autopilot</span>
            </button>
            <button
              onClick={() => {
                setChatMode("human");
                captureClientEvent(analyticsEvents.collabRoomChatModeToggled, { chat_mode: "human" });
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all duration-200 ${
                chatMode === "human"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3 w-3" />
              <span>Direct Chat</span>
            </button>
          </div>
        </CardHeader>

        {/* Dynamic Sponsorship Escrow & Milestone Controller */}
        {selectedDeal && (
          <div className="border-b border-border/40 bg-secondary/10 px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5 text-primary animate-pulse" /> Active Milestone Action Card
              </p>
              
              {/* Milestone Details */}
              {selectedDeal.status === "lead" || selectedDeal.status === "pitched" || selectedDeal.status === "replied" || selectedDeal.status === "negotiating" ? (
                <p className="text-xs font-semibold text-foreground mt-1 leading-relaxed">
                  Sponsorship package rate: <span className="font-mono font-black text-primary">${(selectedDeal.rate_cents / 100).toFixed(2)} USD</span>. Accept sponsorship deliverables package to lock funds.
                </p>
              ) : selectedDeal.status === "approved" ? (
                <p className="text-xs font-semibold text-foreground mt-1 leading-relaxed">
                  Sponsorship Escrow secured! Waiting for creator partner to submit published deliverable video/post draft URL.
                </p>
              ) : selectedDeal.status === "delivered" ? (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-foreground mt-1 leading-relaxed flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" /> Deliverable draft submitted by Creator Partner!
                  </p>
                  {selectedDeal.metadata?.creator_submission?.url ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Draft Link:{" "}
                      <a
                        href={selectedDeal.metadata.creator_submission.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-mono"
                      >
                        {selectedDeal.metadata.creator_submission.url}
                      </a>
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      Draft Link: https://youtube.com/watch?v=demo-deliverable-draft
                    </p>
                  )}
                </div>
              ) : selectedDeal.status === "paid" ? (
                <p className="text-xs font-bold text-emerald-500 mt-1 leading-relaxed flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500 animate-bounce" /> Sponsorship funds securely released and settled in Creator Wallet!
                </p>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground mt-1 leading-relaxed">
                  Current campaign stage: <span className="font-bold text-foreground">{selectedDeal.status}</span>.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 flex items-center gap-2">
              {selectedDeal.status === "lead" || selectedDeal.status === "pitched" || selectedDeal.status === "replied" || selectedDeal.status === "negotiating" ? (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleAcceptPackage} 
                    className="font-bold bg-primary text-primary-foreground h-9"
                  >
                    Accept Package
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => alert("Counter proposed. Let the creator know in the chat your ideal rate.")}
                    className="font-bold border-border/80 h-9"
                  >
                    Counter
                  </Button>
                </>
              ) : selectedDeal.status === "approved" ? (
                <Badge variant="outline" className="px-3 py-1.5 font-bold text-[10px] bg-secondary/80 text-muted-foreground border-none">
                  Waiting for Creator
                </Badge>
              ) : selectedDeal.status === "delivered" ? (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleApproveDeliverable} 
                    className="font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approve & Pay
                  </Button>
                </div>
              ) : selectedDeal.status === "paid" ? (
                <Badge variant="accent" className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/25 text-[10px]">Escrow Settled</Badge>
              ) : null}
            </div>
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto bg-secondary/15 p-5 space-y-4">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              {chatMode === "ai" ? (
                <>
                  <Bot className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-foreground font-black">AI Onboarding History</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    View the intake details collected by your Brand AI Agent from the Creator.
                  </p>
                </>
              ) : (
                <>
                  <User className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-foreground font-black">Direct Messages Channel</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    You have complete control. Chat directly with the creator here to finalize parameters or build rapport.
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isCreator = m.sender_type === "creator";
              const isBrand = m.sender_type === "brand";
              
              return (
                <div key={m.id} className={`flex ${isCreator ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      isCreator
                        ? "bg-card text-foreground border border-border/40 rounded-tl-none border-l-4 border-l-primary"
                        : isBrand
                        ? (chatMode === "ai" 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-accent text-accent-foreground rounded-tr-none")
                        : "bg-amber-500/10 text-amber-955 border border-amber-500/20 text-[10px] italic text-center mx-auto rounded-xl"
                    }`}
                  >
                    {isCreator && (
                      <p className="text-[9px] font-black tracking-wider uppercase text-primary mb-1">
                        {selectedDeal?.workspaces?.creator_profiles?.display_name || "Creator Partner"}
                      </p>
                    )}
                    {!isCreator && isBrand && (
                      <p className="text-[9px] font-black tracking-wider uppercase opacity-75 mb-1">
                        {chatMode === "ai" ? "Brand AI Agent (Me)" : `${selectedDeal?.brand_name || "Brand Manager"} (Me)`}
                      </p>
                    )}
                    <p className="font-semibold leading-relaxed">{m.body}</p>
                    <p className="text-[8px] opacity-75 mt-1 text-right font-mono">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Composer */}
        <form onSubmit={handleSend} className="border-t border-border/40 p-4 flex gap-2.5 bg-card">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            placeholder={
              chatMode === "ai"
                ? "Bypassed in AI Autopilot mode..." 
                : "Type your response to the creator..."
            }
            readOnly={chatMode === "ai"}
            className="flex-1 h-11 px-4 text-xs font-semibold rounded-xl border border-input bg-background outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <Button 
            type="submit" 
            disabled={sending || !inputText.trim() || chatMode === "ai"} 
            className={`h-11 px-5 rounded-xl font-bold text-xs ${
              chatMode === "ai" ? "bg-secondary text-muted-foreground" : "bg-accent text-accent-foreground hover:bg-accent/95"
            }`}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" /> Send
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Right Sidebar: Campaign Scope & Prerequisites Checklist */}
      <Card className="flex flex-col border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-black text-foreground">Campaign Scope</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 space-y-5 overflow-y-auto">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5 text-primary" /> Sponsor Status
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="accent">{selectedDeal?.status}</Badge>
              {selectedDeal?.due_date && (
                <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Due {new Date(selectedDeal.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Agreed Package Rate
            </h4>
            <p className="text-lg font-black text-foreground mt-1 font-mono">
              ${selectedDeal ? (selectedDeal.rate_cents / 100).toFixed(2) : "0.00"} <span className="text-xs text-muted-foreground font-sans text-xs">USD</span>
            </p>
          </div>

          {/* Synced Prerequisites Checklist */}
          <div className="space-y-3.5 pt-3.5 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Onboarding Parameters
              </h4>
              <Badge variant="outline" className="text-[9px] bg-secondary border-none">
                {[isMediaKitDone, isRateDone, isAudienceDone, isTimelineDone].filter(Boolean).length}/4
              </Badge>
            </div>

            <div className="space-y-2">
              {/* Media Kit */}
              <div className="rounded-xl border border-border/40 p-2.5 bg-secondary/15 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-foreground/80">
                    <div className={`grid h-4 w-4 place-items-center rounded-full ${isMediaKitDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                      {isMediaKitDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="text-[8px]">1</span>}
                    </div>
                    Media Kit URL
                  </span>
                  <button 
                    onClick={() => {
                      setShowOverride("media_kit");
                      setOverrideValue(prereqs.media_kit || "");
                    }}
                    className="text-[9px] font-black text-primary hover:underline uppercase"
                  >
                    Override
                  </button>
                </div>
                {prereqs.media_kit ? (
                  <p className="mt-1.5 text-[10px] font-mono text-muted-foreground truncate bg-card px-2 py-1 rounded border border-border/40">
                    {prereqs.media_kit}
                  </p>
                ) : (
                  <p className="mt-1 text-[9px] italic text-muted-foreground">Pending creator submission</p>
                )}
              </div>

              {/* Rate */}
              <div className="rounded-xl border border-border/40 p-2.5 bg-secondary/15 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-foreground/80">
                    <div className={`grid h-4 w-4 place-items-center rounded-full ${isRateDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                      {isRateDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="text-[8px]">2</span>}
                    </div>
                    Proposed Rate
                  </span>
                  <button 
                    onClick={() => {
                      setShowOverride("rate");
                      setOverrideValue(prereqs.rate || "");
                    }}
                    className="text-[9px] font-black text-primary hover:underline uppercase"
                  >
                    Override
                  </button>
                </div>
                {prereqs.rate ? (
                  <p className="mt-1.5 text-[10px] font-mono text-muted-foreground truncate bg-card px-2 py-1 rounded border border-border/40">
                    {prereqs.rate}
                  </p>
                ) : (
                  <p className="mt-1 text-[9px] italic text-muted-foreground">Pending creator submission</p>
                )}
              </div>

              {/* Audience */}
              <div className="rounded-xl border border-border/40 p-2.5 bg-secondary/15 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-foreground/80">
                    <div className={`grid h-4 w-4 place-items-center rounded-full ${isAudienceDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                      {isAudienceDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="text-[8px]">3</span>}
                    </div>
                    Audience Niche
                  </span>
                  <button 
                    onClick={() => {
                      setShowOverride("audience");
                      setOverrideValue(prereqs.audience || "");
                    }}
                    className="text-[9px] font-black text-primary hover:underline uppercase"
                  >
                    Override
                  </button>
                </div>
                {prereqs.audience ? (
                  <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground truncate bg-card px-2 py-1 rounded border border-border/40">
                    {prereqs.audience}
                  </p>
                ) : (
                  <p className="mt-1 text-[9px] italic text-muted-foreground">Pending creator submission</p>
                )}
              </div>

              {/* Delivery Date */}
              <div className="rounded-xl border border-border/40 p-2.5 bg-secondary/15 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold text-foreground/80">
                    <div className={`grid h-4 w-4 place-items-center rounded-full ${isTimelineDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                      {isTimelineDone ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="text-[8px]">4</span>}
                    </div>
                    Timeline/Deadline
                  </span>
                  <button 
                    onClick={() => {
                      setShowOverride("delivery_date");
                      setOverrideValue(prereqs.delivery_date || "");
                    }}
                    className="text-[9px] font-black text-primary hover:underline uppercase"
                  >
                    Override
                  </button>
                </div>
                {prereqs.delivery_date ? (
                  <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground truncate bg-card px-2 py-1 rounded border border-border/40">
                    {prereqs.delivery_date}
                  </p>
                ) : (
                  <p className="mt-1 text-[9px] italic text-muted-foreground">Pending creator submission</p>
                )}
              </div>
            </div>

            {/* Admin Override Form */}
            {showOverride && (
              <div className="rounded-xl border border-dashed border-primary/30 p-3.5 bg-primary/5 space-y-2.5 animate-scale-up">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-primary uppercase">
                    Override {showOverride.replace("_", " ")}
                  </span>
                  <button 
                    onClick={() => {
                      setShowOverride(null);
                      setOverrideValue("");
                    }} 
                    className="text-[9px] text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    placeholder={
                      showOverride === "media_kit" ? "https://..." :
                      showOverride === "rate" ? "$1,500" :
                      showOverride === "audience" ? "founders, devs" : "e.g., June 25"
                    }
                    className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdatePrereqValue(showOverride)}
                    disabled={updatingPrereq}
                    className="h-8 rounded-lg font-bold text-[10px] px-2"
                  >
                    {updatingPrereq ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2 pt-3 border-t border-border/40">
              <ListTodo className="h-3.5 w-3.5 text-primary" /> Deliverables Checklist
            </h4>
            <div className="space-y-1.5">
              {selectedDeal?.deliverables.map((del, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-secondary/35 border border-border/40 px-3 py-2 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="truncate">{del}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border p-3.5 bg-secondary/10 mt-auto">
            <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Escrow Secure
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5">
              Sponsorship funds are held in secure escrow. Payment will release to the creator upon upload and brand approval of deliverables.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
