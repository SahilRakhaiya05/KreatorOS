"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { MessageSquare, Send, ShieldCheck, Loader2, RefreshCw, Handshake, Calendar, DollarSign, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  campaign_id: string;
  sender_type: "creator" | "brand" | "system";
  body: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

type BrandDeal = {
  id: string;
  brand_name: string;
  contact_name: string | null;
  status: string;
  rate_cents: number;
  deliverables: string[];
  due_date: string | null;
};

export function BrandCollabRoomClient() {
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<BrandDeal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPending, startTransition] = useTransition();
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
        })
      });
      const json = await res.json();
      if (json.ok) {
        setSelectedDeal(prev => prev ? { ...prev, status: newStatus } : null);
        // Refresh full deal list
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
        }),
      });
    } catch (err) {
      console.error("Failed to post collab message:", err);
    }
  };

  const handleAcceptPackage = async () => {
    if (!selectedDeal) return;
    await updateDealStatus("approved");
    await postCollabMessage(`🤝 Creator accepted the sponsorship package rate of $${(selectedDeal.rate_cents / 100).toFixed(2)} USD. Escrow funds are now securely locked via Stripe Connect.`, "system");
    await postCollabMessage(`Excellent! I've authorized the Stripe Connect hold. The contract is locked, and we are ready for you to create the deliverables. Please upload your draft link here as soon as it's ready!`, "brand");
    fetchMessages(selectedDeal.id);
  };

  const handleSubmitDeliverable = async () => {
    if (!selectedDeal || !deliverableUrl.trim()) return;
    const url = deliverableUrl.trim();
    setDeliverableUrl("");
    await updateDealStatus("delivered");
    await postCollabMessage(`🚀 Creator submitted deliverable URL for review: ${url}. Initiating automated creative review...`, "system");
    await postCollabMessage(`Perfect! I've received your deliverable draft. Let me run our automated brand compliance check on this URL.`, "brand");
    
    fetchMessages(selectedDeal.id);

    setTimeout(async () => {
      await updateDealStatus("paid");
      await postCollabMessage(`🎉 Automated Creative Review Passed! Deliverable matches brief and guidelines. Stripe Connect escrow payment of $${(selectedDeal.rate_cents / 100).toFixed(2)} USD successfully released to Creator Wallet.`, "system");
      await postCollabMessage(`Excellent work! The video check passed and the draft is approved. Sponsorship payout has been released. Looking forward to our next collaboration!`, "brand");
      fetchMessages(selectedDeal.id);
    }, 2500);
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
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !inputText.trim() || sending) return;

    setSending(true);
    const userMessage = inputText.trim();
    setInputText("");

    try {
      const res = await fetch("/api/creator/collab-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedDeal.id,
          body: userMessage,
          senderType: "creator",
        }),
      });

      const json = await res.json();
      if (json.ok) {
        // Fetch all messages to refresh both creator's and brand AI's response
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
    <div className="grid gap-6 xl:grid-cols-[280px_1fr_300px]">
      
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
                onClick={() => setSelectedDeal(deal)}
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
      <Card className="flex flex-col overflow-hidden border border-border bg-card min-h-[500px] h-[calc(100vh-14rem)]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 py-4 px-5">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-primary" />
              <span>Collab Room: {selectedDeal?.brand_name}</span>
            </CardTitle>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Live secure conversation channel with Brand Partner
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => selectedDeal && fetchMessages(selectedDeal.id)}
            disabled={loadingMessages}
            className="h-8 w-8 text-muted-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loadingMessages ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        {/* Dynamic Sponsorship Escrow & Milestone Controller */}
        {selectedDeal && (
          <div className="border-b border-border/40 bg-secondary/10 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5 text-primary animate-pulse" /> Active Milestone Action Card
              </p>
              
              {/* Milestone Details */}
              {selectedDeal.status === "lead" || selectedDeal.status === "pitched" || selectedDeal.status === "replied" || selectedDeal.status === "negotiating" ? (
                <p className="text-xs font-semibold text-foreground mt-1.5 leading-relaxed">
                  Brand proposed package rate: <span className="font-mono font-black text-primary">${(selectedDeal.rate_cents / 100).toFixed(2)} USD</span>. Accept sponsorship deliverables package to lock funds.
                </p>
              ) : selectedDeal.status === "approved" ? (
                <p className="text-xs font-semibold text-foreground mt-1.5 leading-relaxed">
                  Sponsorship Escrow secured! Enter your published deliverable video/post draft URL below.
                </p>
              ) : selectedDeal.status === "delivered" ? (
                <p className="text-xs font-semibold text-foreground mt-1.5 leading-relaxed flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" /> Deliverable submitted. Running automated AI brand safety & compliance reviews...
                </p>
              ) : selectedDeal.status === "paid" ? (
                <p className="text-xs font-bold text-emerald-500 mt-1.5 leading-relaxed flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500 animate-bounce" /> Sponsorship funds securely released and settled in your Creator Wallet!
                </p>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground mt-1.5 leading-relaxed">
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
                    onClick={() => alert("Counter proposed. Let the brand rep know in the chat your ideal rate.")}
                    className="font-bold border-border/80 h-9"
                  >
                    Counter
                  </Button>
                </>
              ) : selectedDeal.status === "approved" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?..."
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                    className="h-9 px-3 text-xs font-semibold rounded-xl border border-input bg-background outline-none focus:ring-4 focus:ring-primary/10 w-44"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSubmitDeliverable} 
                    disabled={!deliverableUrl.trim()}
                    className="font-bold h-9"
                  >
                    Submit URL
                  </Button>
                </div>
              ) : selectedDeal.status === "delivered" ? (
                <Badge variant="accent" className="px-3 py-1.5 font-bold animate-pulse text-[10px]">Compliance Reviewing</Badge>
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
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">Welcome to your shared collaboration room</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Send a message to kick off negotiations. Your Brand Partner's AI Representative will respond dynamically.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isCreator = m.sender_type === "creator";
              const isBrand = m.sender_type === "brand";
              
              return (
                <div key={m.id} className={`flex ${isCreator ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isCreator
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : isBrand
                        ? "bg-card text-foreground ring-1 ring-border rounded-tl-none border-l-4 border-l-violet-500"
                        : "bg-amber-500/10 text-amber-900 border border-amber-500/20 text-xs italic text-center mx-auto"
                    }`}
                  >
                    {!isCreator && !isPending && (
                      <p className="text-[10px] font-black tracking-wider uppercase text-violet-500 mb-1">
                        {isBrand ? `${selectedDeal?.brand_name} Rep` : "System"}
                      </p>
                    )}
                    <p className="font-semibold text-xs leading-6">{m.body}</p>
                    <p className="text-[9px] opacity-70 mt-1.5 text-right font-mono">
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
            placeholder={`Reply to ${selectedDeal?.brand_name || "brand"}...`}
            className="flex-1 h-11 px-4 text-sm font-semibold rounded-xl border border-input bg-background outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <Button type="submit" disabled={sending || !inputText.trim()} className="h-11 px-5 rounded-xl font-bold">
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

      {/* Right Sidebar: Campaign Details & Deliverables */}
      <Card className="flex flex-col border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-black text-foreground">Campaign Scope</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 space-y-5">
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
            <p className="text-lg font-black text-foreground mt-1.5 font-mono">
              ${selectedDeal ? (selectedDeal.rate_cents / 100).toFixed(2) : "0.00"} <span className="text-xs text-muted-foreground font-sans">USD</span>
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
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
