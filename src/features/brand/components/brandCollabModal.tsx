"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  X, Send, Sparkles, MessageCircle, MessageSquare, Handshake, 
  Link as LinkIcon, DollarSign, Calendar, Loader2, 
  ArrowUpRight, BarChart, Bot, CheckCircle2, AlertCircle,
  User, Check, ClipboardCheck, Play, HelpCircle
} from "lucide-react";

type ShortLink = {
  id: string;
  slug: string;
  destination_url: string;
  click_count: number;
};

type BrandDeal = {
  id: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: 'lead' | 'pitched' | 'replied' | 'negotiating' | 'approved' | 'delivered' | 'paid' | 'lost';
  rate_cents: number;
  currency: string;
  deliverables: string[];
  due_date: string | null;
  campaign_short_link_id?: string | null;
  campaign_short_link_id_obj?: ShortLink | null;
  metadata?: any;
};

type CollabMessage = {
  id: string;
  campaign_id: string;
  sender_user_id: string | null;
  sender_type: 'creator' | 'brand' | 'system';
  body: string;
  metadata?: {
    chat_mode?: 'ai' | 'human';
    is_ai?: boolean;
  };
  created_at: string;
};

type BrandCollabModalProps = {
  deal: BrandDeal;
  onClose: () => void;
  onUpdateStatus: (dealId: string, status: BrandDeal["status"]) => void;
};

export function BrandCollabModal({ deal, onClose, onUpdateStatus }: BrandCollabModalProps) {
  const [chatMode, setChatMode] = useState<"ai" | "human">("ai");
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Prerequisite Manual Input States
  const [showOverride, setShowOverride] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [updatingPrereq, setUpdatingPrereq] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and load prerequisites from metadata
  const prereqs = deal.metadata?.prerequisites || {
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

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/creator/collab-messages?campaignId=${deal.id}`);
      const json = await res.json();
      if (json.ok) {
        setMessages(json.data?.messages || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [deal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, chatMode]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMessageText = inputText.trim();
    setInputText("");
    setSending(true);

    // 1. Pessimistically append user's message locally with the active chat mode
    const tempUserMsg: CollabMessage = {
      id: `temp_${Date.now()}`,
      campaign_id: deal.id,
      sender_user_id: "user",
      sender_type: "creator",
      body: userMessageText,
      metadata: { chat_mode: chatMode },
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch("/api/creator/collab-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: deal.id,
          body: userMessageText,
          senderType: "creator",
          chatMode: chatMode,
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        // Remove temp message and append real database-backed messages
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp_")));
        
        // Append creator message
        const realCreatorMsg: CollabMessage = result.data.message;
        setMessages((prev) => [...prev, realCreatorMsg]);

        // Simulate typing animation for Brand AI or Human simulation
        if (result.data.brandReply) {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, 1200));
          setIsTyping(false);
          
          const realBrandMsg: CollabMessage = result.data.brandReply;
          setMessages((prev) => [...prev, realBrandMsg]);
        }

        // If in AI mode, reload deal details to capture any newly extracted prerequisites!
        if (chatMode === "ai") {
          onUpdateStatus(deal.id, deal.status);
        }
      }
    } catch {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: BrandDeal["status"]) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deal.id,
          brandName: deal.brand_name,
          status: newStatus,
          rateCents: deal.rate_cents,
          dueDate: deal.due_date,
          metadata: deal.metadata || {},
        }),
      });

      const result = await response.json();
      if (result.ok) {
        onUpdateStatus(deal.id, newStatus);
      }
    } catch {
      // Ignore
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePrereqValue = async (field: string) => {
    if (updatingPrereq) return;
    setUpdatingPrereq(true);

    const currentMeta = deal.metadata || {};
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
          id: deal.id,
          brandName: deal.brand_name,
          status: deal.status,
          rateCents: deal.rate_cents,
          dueDate: deal.due_date,
          metadata: currentMeta,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        onUpdateStatus(deal.id, deal.status);
        setShowOverride(null);
        setOverrideValue("");
      }
    } catch {
      alert("Failed to save parameter.");
    } finally {
      setUpdatingPrereq(false);
    }
  };

  // Filter messages based on chat mode (AI channel vs Human channel)
  const filteredMessages = messages.filter((m) => {
    const msgMode = m.metadata?.chat_mode || (m.metadata?.is_ai ? "ai" : "human");
    return msgMode === chatMode;
  });

  const isMediaKitDone = prereqs.status.media_kit === "submitted";
  const isRateDone = prereqs.status.rate === "submitted";
  const isAudienceDone = prereqs.status.audience === "submitted";
  const isTimelineDone = prereqs.status.delivery_date === "submitted";

  const allPrereqsDone = isMediaKitDone && isRateDone && isAudienceDone && isTimelineDone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-fade-in p-4">
      <div 
        className="relative w-full max-w-5xl rounded-3xl border border-border/80 bg-background shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left Side: Campaign Scope & Prerequisites Checklist */}
        <div className="w-full md:w-[360px] border-b md:border-b-0 md:border-r border-border/60 bg-secondary/15 p-5 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <Badge variant="accent" className="bg-primary/10 text-primary border-none uppercase font-bold tracking-wider text-[9px] mb-2.5">
                Workspace Brief
              </Badge>
              <h2 className="text-xl font-black text-foreground tracking-tight">
                {deal.brand_name} Collaboration
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Coordinate terms, complete onboarding benchmarks, and track contract milestones in real-time.
              </p>
            </div>

            {/* Pipeline Stage */}
            <div className="space-y-1.5 pt-3.5 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Pipeline Stage
              </span>
              <div className="relative">
                <select
                  value={deal.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="lead">Lead / Inquired</option>
                  <option value="pitched">Pitched</option>
                  <option value="replied">Replied / Interested</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="approved">Approved & Contracted</option>
                  <option value="delivered">Delivered / Review</option>
                  <option value="paid">Paid & Completed</option>
                </select>
                {updatingStatus && (
                  <div className="absolute right-2 top-2">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Prerequisites Checklist */}
            <div className="space-y-3 pt-3.5 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Onboarding Checklist
                </span>
                <span className="text-[9px] bg-secondary/80 px-2 py-0.5 rounded-full font-bold text-muted-foreground">
                  {[isMediaKitDone, isRateDone, isAudienceDone, isTimelineDone].filter(Boolean).length}/4 Done
                </span>
              </div>

              <div className="space-y-2">
                {/* Media Kit */}
                <div className="rounded-xl border border-border/60 bg-card p-2.5 text-xs shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-foreground/80">
                      <div className={`grid h-5 w-5 place-items-center rounded-full ${isMediaKitDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                        {isMediaKitDone ? <Check className="h-3 w-3 stroke-[3]" /> : <span className="text-[9px]">1</span>}
                      </div>
                      Media Kit / Portfolio
                    </span>
                    <button 
                      onClick={() => {
                        setShowOverride("media_kit");
                        setOverrideValue(prereqs.media_kit || "");
                      }}
                      className="text-[9px] font-black text-primary hover:underline uppercase"
                    >
                      {isMediaKitDone ? "Edit" : "Add"}
                    </button>
                  </div>
                  {prereqs.media_kit && (
                    <p className="mt-1.5 text-[10px] font-mono text-muted-foreground truncate bg-secondary/40 px-2 py-1 rounded border border-border/20">
                      {prereqs.media_kit}
                    </p>
                  )}
                </div>

                {/* Sponsorship Rate */}
                <div className="rounded-xl border border-border/60 bg-card p-2.5 text-xs shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-foreground/80">
                      <div className={`grid h-5 w-5 place-items-center rounded-full ${isRateDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                        {isRateDone ? <Check className="h-3 w-3 stroke-[3]" /> : <span className="text-[9px]">2</span>}
                      </div>
                      Expected Rate
                    </span>
                    <button 
                      onClick={() => {
                        setShowOverride("rate");
                        setOverrideValue(prereqs.rate || "");
                      }}
                      className="text-[9px] font-black text-primary hover:underline uppercase"
                    >
                      {isRateDone ? "Edit" : "Add"}
                    </button>
                  </div>
                  {prereqs.rate && (
                    <p className="mt-1.5 text-[10px] font-mono text-muted-foreground truncate bg-secondary/40 px-2 py-1 rounded border border-border/20">
                      {prereqs.rate}
                    </p>
                  )}
                </div>

                {/* Audience/Niche */}
                <div className="rounded-xl border border-border/60 bg-card p-2.5 text-xs shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-foreground/80">
                      <div className={`grid h-5 w-5 place-items-center rounded-full ${isAudienceDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                        {isAudienceDone ? <Check className="h-3 w-3 stroke-[3]" /> : <span className="text-[9px]">3</span>}
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
                      {isAudienceDone ? "Edit" : "Add"}
                    </button>
                  </div>
                  {prereqs.audience && (
                    <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground truncate bg-secondary/40 px-2 py-1 rounded border border-border/20">
                      {prereqs.audience}
                    </p>
                  )}
                </div>

                {/* Delivery Date */}
                <div className="rounded-xl border border-border/60 bg-card p-2.5 text-xs shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-foreground/80">
                      <div className={`grid h-5 w-5 place-items-center rounded-full ${isTimelineDone ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}>
                        {isTimelineDone ? <Check className="h-3 w-3 stroke-[3]" /> : <span className="text-[9px]">4</span>}
                      </div>
                      Delivery Date
                    </span>
                    <button 
                      onClick={() => {
                        setShowOverride("delivery_date");
                        setOverrideValue(prereqs.delivery_date || "");
                      }}
                      className="text-[9px] font-black text-primary hover:underline uppercase"
                    >
                      {isTimelineDone ? "Edit" : "Add"}
                    </button>
                  </div>
                  {prereqs.delivery_date && (
                    <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground truncate bg-secondary/40 px-2 py-1 rounded border border-border/20">
                      {prereqs.delivery_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Prerequisite Override Popover/Form */}
            {showOverride && (
              <div className="rounded-xl border border-dashed border-primary/30 p-3 bg-primary/5 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase">
                    Override {showOverride.replace("_", " ")}
                  </span>
                  <button 
                    onClick={() => {
                      setShowOverride(null);
                      setOverrideValue("");
                    }} 
                    className="text-[10px] text-muted-foreground hover:text-foreground"
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
                    className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdatePrereqValue(showOverride)}
                    disabled={updatingPrereq}
                    className="h-8 rounded-lg font-bold text-[10px] px-2.5"
                  >
                    {updatingPrereq ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5 mt-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
            <span>Chat is analyzed in real-time. Provide your details to the AI assistant to check items off automatically!</span>
          </div>
        </div>

        {/* Right Side: Interactive AI Assistant vs Human Direct Chat */}
        <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
          
          {/* Dual Channel Switcher Header */}
          <CardHeader className="border-b border-border/50 py-3.5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/5">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                <span>Collab Room Workspace</span>
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                Toggle between the automated onboarding assistant and human reps
              </p>
            </div>
            
            {/* Stunning Glassmorphic Toggle Tabs */}
            <div className="flex items-center bg-secondary/70 p-1.5 rounded-2xl border border-border/40 shadow-inner shrink-0 w-fit self-start sm:self-center">
              <button
                onClick={() => setChatMode("ai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  chatMode === "ai"
                    ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>AI Onboarding</span>
              </button>
              <button
                onClick={() => setChatMode("human")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  chatMode === "human"
                    ? "bg-gradient-to-r from-accent to-violet-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Human Rep</span>
              </button>
            </div>
          </CardHeader>

          {/* Dynamic Prerequisites Banner inside AI Chat */}
          {chatMode === "ai" && allPrereqsDone && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/25 px-6 py-2.5 text-emerald-500 font-bold text-xs flex items-center justify-between gap-4 animate-fade-in shrink-0">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 animate-bounce" />
                Onboarding requirements fully satisfied! Feel free to switch to the 'Human Rep' tab.
              </span>
              <Badge variant="accent" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase text-[8px] tracking-widest animate-pulse">Ready</Badge>
            </div>
          )}

          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-secondary/10">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                {chatMode === "ai" ? (
                  <>
                    <Bot className="h-10 w-10 text-primary/45 mb-3 animate-pulse" />
                    <h4 className="text-xs font-bold text-foreground">Welcome to your AI campaign intake!</h4>
                    <p className="text-[10px] text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                      Say hello to let the brand assistant organize your media kit, pricing, and campaign timeline checklist.
                    </p>
                  </>
                ) : (
                  <>
                    <User className="h-10 w-10 text-accent/45 mb-3" />
                    <h4 className="text-xs font-bold text-foreground">Direct Deal Channel</h4>
                    <p className="text-[10px] text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                      This is your direct line to the human Sponsorships Team at {deal.brand_name} to negotiate custom parameters.
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.sender_type === "creator";
                const isSystem = msg.sender_type === "system";
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-3 w-full">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-bold text-amber-700 italic flex items-center gap-1.5 max-w-[90%]">
                        <Handshake className="h-3.5 w-3.5" />
                        <span>{msg.body}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1 px-1 flex items-center gap-1 font-mono">
                      {isMe ? (
                        <>👤 Creator (Me)</>
                      ) : (
                        chatMode === "ai" ? (
                          <><Bot className="h-3 w-3 text-primary" /> {deal.brand_name} AI Onboarding Assistant</>
                        ) : (
                          <><User className="h-3 w-3 text-accent" /> {deal.contact_name || "John"} ({deal.brand_name} Rep)</>
                        )
                      )}
                    </span>
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed font-semibold shadow-sm transition-all ${
                      isMe 
                        ? (chatMode === "ai" 
                            ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-br-none"
                            : "bg-gradient-to-r from-accent to-violet-600 text-white rounded-br-none")
                        : "bg-card text-foreground border border-border/40 rounded-bl-none"
                    }`}>
                      {msg.body}
                    </div>
                    <span className="text-[8px] text-muted-foreground/60 mt-1 font-mono px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}

            {/* Simulated Representative Typing Animation */}
            {isTyping && (
              <div className="flex flex-col max-w-[80%] mr-auto items-start animate-pulse">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1 px-1 flex items-center gap-1 font-mono">
                  {chatMode === "ai" ? (
                    <><Bot className="h-3 w-3 text-primary" /> {deal.brand_name} AI</>
                  ) : (
                    <><User className="h-3 w-3 text-accent" /> {deal.contact_name || "John"} ({deal.brand_name} Rep)</>
                  )}
                </span>
                <div className="rounded-2xl p-3 bg-card border border-border/40 rounded-bl-none flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-150"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input */}
          <CardFooter className="border-t border-border/50 py-3.5 px-6 bg-card">
            <form onSubmit={handleSendMessage} className="flex w-full gap-3">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  chatMode === "ai" 
                    ? `Reply to ${deal.brand_name} Onboarding AI... (or type your rate, niche, deadline!)`
                    : `Message ${deal.contact_name || "John"} directly to negotiate custom terms...`
                }
                disabled={sending}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition shadow-inner placeholder:text-muted-foreground/60"
              />
              <Button 
                type="submit" 
                disabled={sending || !inputText.trim()} 
                className={`rounded-xl px-4 flex items-center justify-center gap-1.5 font-bold ${
                  chatMode === "ai" ? "bg-primary text-primary-foreground hover:bg-primary/95" : "bg-accent text-accent-foreground hover:bg-accent/95"
                }`}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </CardFooter>
        </div>
      </div>
    </div>
  );
}
