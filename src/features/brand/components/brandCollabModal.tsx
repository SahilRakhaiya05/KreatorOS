"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  X, Send, Sparkles, MessageCircle, Handshake, 
  Link as LinkIcon, DollarSign, Calendar, Loader2, 
  ArrowUpRight, BarChart, Bot, CheckCircle2, AlertCircle
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
};

type CollabMessage = {
  id: string;
  campaign_id: string;
  sender_user_id: string | null;
  sender_type: 'creator' | 'brand' | 'system';
  body: string;
  created_at: string;
};

type BrandCollabModalProps = {
  deal: BrandDeal;
  onClose: () => void;
  onUpdateStatus: (dealId: string, status: BrandDeal["status"]) => void;
};

export function BrandCollabModal({ deal, onClose, onUpdateStatus }: BrandCollabModalProps) {
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMessageText = inputText.trim();
    setInputText("");
    setSending(true);

    // 1. Pessimistically append user's message locally
    const tempUserMsg: CollabMessage = {
      id: `temp_${Date.now()}`,
      campaign_id: deal.id,
      sender_user_id: "user",
      sender_type: "creator",
      body: userMessageText,
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
          senderType: "creator"
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        // Remove temp message and append real database-backed messages
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp_")));
        
        // Append creator message
        const realCreatorMsg: CollabMessage = result.data.message;
        setMessages((prev) => [...prev, realCreatorMsg]);

        // Simulate typing animation for Brand AI response
        if (result.data.brandReply) {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, 1500));
          setIsTyping(false);
          
          const realBrandMsg: CollabMessage = result.data.brandReply;
          setMessages((prev) => [...prev, realBrandMsg]);
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

        {/* Left Side: Campaign & Deal Brief */}
        <div className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-border/60 bg-secondary/15 p-6 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <Badge variant="accent" className="bg-violet-500/10 text-violet-500 border-none uppercase font-bold tracking-wider text-[9px] mb-2.5">
                Campaign Brief
              </Badge>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                {deal.brand_name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Negotiate contracts, review schedules, and track clicks for this sponsorship campaign in real-time.
              </p>
            </div>

            {/* Campaign Metrics list */}
            <div className="space-y-3.5 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Contract Value
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  ${(deal.rate_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" /> Deadline Date
                </span>
                <span className="text-xs font-bold text-foreground">
                  {deal.due_date ? new Date(deal.due_date).toLocaleDateString() : "To Be Drafted"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <BarChart className="h-3.5 w-3.5 text-accent" /> Campaign Clicks
                </span>
                <Badge variant="outline" className="font-semibold text-accent border-accent/25 bg-accent/5">
                  {deal.campaign_short_link_id_obj?.click_count || 0} Clicks
                </Badge>
              </div>
            </div>

            {/* Pipeline status controller */}
            <div className="space-y-2 pt-4 border-t border-border/40">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Pipeline Status
              </label>
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
                  <option value="approved">Approved & Signed</option>
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

            {/* Deliverables Checklist */}
            <div className="space-y-2.5 pt-4 border-t border-border/40">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Deliverables Timeline
              </label>
              <div className="space-y-1.5">
                {deal.deliverables.map((del, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-card border border-border/50 p-2.5 text-xs text-foreground/80 font-semibold shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{del}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
            <span>Collaboration messages are persisted securely in your workspace database with encrypted key logs.</span>
          </div>
        </div>

        {/* Right Side: Interactive AI Chat Room */}
        <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
          <CardHeader className="border-b border-border/50 py-3.5 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MessageCircle className="h-4.5 w-4.5 text-accent" />
              <span>AI Collaboration Room</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Brand AI Rep Connected</span>
            </div>
          </CardHeader>

          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <Sparkles className="h-10 w-10 text-accent/40 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold text-foreground">Say hello to the brand AI!</h4>
                <p className="text-[10px] text-muted-foreground max-w-xs mt-1 leading-relaxed">
                  Type a negotiation comment or delivery question below to start real-time sponsor coordination.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_type === "creator";
                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1 px-1">
                      {isMe ? "Creator (Me)" : `${deal.brand_name} Rep`}
                    </span>
                    <div className={`rounded-2xl p-3.5 text-sm leading-relaxed font-medium shadow-sm transition-all ${
                      isMe 
                        ? "bg-gradient-to-r from-accent to-violet-600 text-white rounded-br-none" 
                        : "bg-secondary/40 text-foreground border border-border/40 rounded-bl-none"
                    }`}>
                      {msg.body}
                    </div>
                  </div>
                );
              })
            )}

            {/* Simulated Brand Representative Typing Animation */}
            {isTyping && (
              <div className="flex flex-col max-w-[80%] mr-auto items-start animate-pulse">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1 px-1">
                  {deal.brand_name} Rep
                </span>
                <div className="rounded-2xl p-3 bg-secondary/40 text-foreground border border-border/40 rounded-bl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-150"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input */}
          <CardFooter className="border-t border-border/50 py-3.5 px-6 bg-secondary/5">
            <form onSubmit={handleSendMessage} className="flex w-full gap-3">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Negotiate deliverables or pricing with ${deal.brand_name} Representative...`}
                disabled={sending}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition shadow-inner"
              />
              <Button type="submit" disabled={sending || !inputText.trim()} className="rounded-xl px-4 flex items-center justify-center gap-1.5">
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
