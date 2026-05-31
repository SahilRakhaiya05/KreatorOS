"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Sparkles, MessageSquare, ArrowUpRight, Search, 
  Bot, Send, Loader2, Handshake, DollarSign, 
  Calendar, ListTodo, X, ShieldAlert, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { captureClientEvent, analyticsEvents } from "@/client/posthog/events";

type CreatorProfile = {
  id: string;
  owner_id: string;
  workspace_id: string | null;
  display_name: string;
  username: string;
  niche: string | null;
  audience: string | null;
  promise: string | null;
  status: string;
  theme?: any;
  created_at: string;
};

type ChatMessage = {
  id?: string;
  sender_type: string;
  body: string;
  metadata?: any;
  created_at?: string;
};

export function BrandDiscoverClient({ creators }: { creators: CreatorProfile[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selected creator to chat with their Brand AI Bot
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  
  // Real DB Deal and Message states
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  
  const [loadingChat, setLoadingChat] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiLoading, loadingChat]);

  // Load or Create deal dynamically when creator is selected
  useEffect(() => {
    if (!selectedCreator) {
      setActiveDeal(null);
      setAiMessages([]);
      return;
    }

    const creator = selectedCreator;
    let isCancelled = false;

    async function loadOrCreateDeal() {
      setLoadingChat(true);
      try {
        // 1. Fetch existing brand deals to see if they already have one
        const res = await fetch("/api/creator/brand-deals");
        const json = await res.json();
        if (isCancelled) return;

        let deal = null;
        if (json.ok && Array.isArray(json.data?.deals)) {
          deal = json.data.deals.find((d: any) => d.workspace_id === creator.workspace_id);
        }

        // 2. If no deal exists, create one with status 'lead' and zero price
        if (!deal && creator.workspace_id) {
          const createRes = await fetch("/api/creator/brand-deals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandName: "Brand Partner",
              status: "lead",
              rateCents: 0,
              deliverables: ["Campaign Chat Onboarding"],
              workspaceId: creator.workspace_id,
            })
          });
          const createJson = await createRes.json();
          if (isCancelled) return;
          if (createJson.ok) {
            deal = createJson.data.deal;
          }
        }

        if (deal) {
          setActiveDeal(deal);
          
          // 3. Fetch messages for this deal
          const msgRes = await fetch(`/api/creator/collab-messages?campaignId=${deal.id}`);
          const msgJson = await msgRes.json();
          if (isCancelled) return;
          
          if (msgJson.ok) {
            let list = msgJson.data.messages || [];

            // 4. Seed welcome message from creator's brand bot if chat history is empty
            if (list.length === 0) {
              const creatorBrandBot = creator.theme?.brand_bot || {};
              const welcome = creatorBrandBot.welcomeMessage || 
                `Hey! Thanks for your interest in collaborating. Let's discuss your brand alignment and deliverables right here!`;

              const seedRes = await fetch("/api/creator/collab-messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  campaignId: deal.id,
                  body: welcome,
                  senderType: "creator",
                  chatMode: "ai",
                })
              });
              
              if (isCancelled) return;
              const seedJson = await seedRes.json();
              
              // Re-fetch
              const refetch = await fetch(`/api/creator/collab-messages?campaignId=${deal.id}`);
              const refetchJson = await refetch.json();
              if (isCancelled) return;
              if (refetchJson.ok) {
                list = refetchJson.data.messages || [];
              }
            }

            // Filter to AI chat mode only
            setAiMessages(
              list.filter(
                (m: any) =>
                  (m.metadata?.chat_mode || (m.metadata?.is_ai ? "ai" : "human")) === "ai"
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to load/create deal chat:", err);
      } finally {
        if (!isCancelled) setLoadingChat(false);
      }
    }

    loadOrCreateDeal();

    return () => {
      isCancelled = true;
    };
  }, [selectedCreator]);

  // Handle message sending to Creator's Brand Bot
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeal || !aiInput.trim() || aiLoading) return;

    const userText = aiInput.trim();
    setAiInput("");
    setAiLoading(true);

    // Optimistically append brand's message locally
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender_type: "brand",
      body: userText,
      metadata: { chat_mode: "ai" },
      created_at: new Date().toISOString()
    };
    setAiMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/creator/collab-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: activeDeal.id,
          body: userText,
          senderType: "brand",
          chatMode: "ai",
        })
      });
      const json = await res.json();
      if (json.ok) {
        // Re-fetch real messages list to sync conversation
        const refetch = await fetch(`/api/creator/collab-messages?campaignId=${activeDeal.id}`);
        const refetchJson = await refetch.json();
        if (refetchJson.ok) {
          const list = refetchJson.data.messages || [];
          setAiMessages(
            list.filter(
              (m: any) =>
                (m.metadata?.chat_mode || (m.metadata?.is_ai ? "ai" : "human")) === "ai"
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredCreators = creators.filter(c => 
    c.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.niche && c.niche.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Search Filter Bar */}
      <div className="flex items-center bg-card rounded-2xl border border-border/80 px-4 py-2.5 max-w-md shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
        <Search className="h-4.5 w-4.5 text-muted-foreground mr-3" />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search creators by niche focus or name..."
          className="bg-transparent border-none outline-none w-full text-xs font-bold text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Creator Profile Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCreators.length > 0 ? (
          filteredCreators.map((c, i) => {
            const matchScore = 98 - (i * 2);
            return (
              <Card
                key={c.id}
                className="group flex flex-col justify-between overflow-hidden border border-border/80 bg-card transition-all duration-300 hover:translate-y-[-2px] hover:border-primary/40 hover:shadow-soft"
              >
                <div>
                  <div className="h-2 w-full bg-gradient-to-r from-violet-500 to-indigo-600 opacity-80" />
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="accent" className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-none font-bold">
                        Fit Score {matchScore}%
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">@{c.username}</span>
                    </div>
                    <CardTitle className="pt-2 text-md font-black tracking-tight text-foreground transition-colors group-hover:text-violet-600">
                      {c.display_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Niche focus</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">{c.niche || "General Content Creator"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Audience Promise</p>
                      <p className="text-xs leading-relaxed text-slate-500 line-clamp-3 mt-0.5 font-semibold">
                        {c.promise || "Delivering high-value resources and templates to grow online businesses."}
                      </p>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="bg-secondary/15 border-t border-border/40 py-3 px-5 flex items-center justify-between gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedCreator(c);
                      captureClientEvent(analyticsEvents.brandDiscoverCreatorViewed, {
                        creator_id: c.id,
                        creator_username: c.username,
                        creator_name: c.display_name,
                        creator_niche: c.niche || "unknown"
                      });
                    }}
                    className="text-xs font-bold text-violet-600 hover:bg-violet-50/50 hover:text-violet-700 gap-1 w-full"
                  >
                    <Bot className="h-4 w-4" /> Chat with AI Representative
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-400 border border-dashed border-border rounded-3xl bg-secondary/10">
            <User className="h-10 w-10 text-muted-foreground mb-3 animate-bounce" />
            <p className="text-sm font-black text-foreground">No active creators found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Try adjusting your search terms or wait for creators to configure their profiles inside the system.
            </p>
          </div>
        )}
      </div>

      {/* Drawer: Creator Profile + Live AI Chat */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedCreator(null)}>
          <div 
            className="w-full max-w-xl md:max-w-3xl bg-background border-l border-border/80 h-full flex flex-col justify-between shadow-2xl animate-slide-left p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCreator(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary transition shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div>
              <Badge variant="accent" className="bg-violet-500/10 text-violet-600 border-none uppercase font-bold tracking-wider text-[9px] mb-2.5">
                🤝 Creator AI Sponsorship Representative
              </Badge>
              <h3 className="text-xl font-black text-foreground">
                Sponsoring: {selectedCreator.display_name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chat with their configured Brand Sponsorship bot. Align on metrics, audience demographics, and formats.
              </p>
            </div>

            {/* Main Drawer Layout (Profile details on Left, Chat on Right) */}
            <div className="flex-1 min-h-0 grid md:grid-cols-[240px_1fr] gap-5 py-5 border-t border-b border-border/40 my-4 overflow-hidden">
              
              {/* Creator details panel */}
              <div className="space-y-4 pr-3 border-b md:border-b-0 md:border-r border-border/40 overflow-y-auto hidden md:block">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Niche focus</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{selectedCreator.niche || "General"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Audience Demographics</span>
                  <p className="text-xs font-semibold text-slate-600 mt-1">{selectedCreator.audience || "General"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Audience Promise</span>
                  <p className="text-xs leading-relaxed text-slate-500 mt-1 font-semibold whitespace-pre-line">{selectedCreator.promise}</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3 mt-4 text-[10px] text-violet-800 leading-relaxed font-bold flex gap-1">
                  <Award className="h-4.5 w-4.5 text-violet-600 shrink-0 mt-0.5" />
                  <span>The creator sets up this AI Representative to qualify partnership fit prior to initiating human contract signatures.</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex flex-col justify-between h-full overflow-hidden">
                {loadingChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin text-violet-600 mb-2" />
                    <p className="text-xs font-bold">Connecting to creator's assistant...</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1 bg-slate-50/50 p-3 rounded-2xl border border-border/40">
                    {aiMessages.map((m, index) => {
                      const isCreatorBot = m.sender_type === "creator";
                      return (
                        <div key={index} className={`flex flex-col max-w-[85%] ${isCreatorBot ? "mr-auto items-start" : "ml-auto items-end"}`}>
                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
                            {isCreatorBot ? `${selectedCreator.display_name} (AI Bot)` : "Brand Representative"}
                          </span>
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm ${
                            isCreatorBot ? "bg-card text-foreground border border-border/40 rounded-bl-none" : "bg-violet-600 text-white rounded-br-none"
                          }`}>
                            {m.body}
                          </div>
                        </div>
                      );
                    })}
                    {aiLoading && (
                      <div className="flex flex-col max-w-[85%] mr-auto items-start animate-pulse">
                        <span className="text-[8px] uppercase text-muted-foreground font-bold mb-0.5">AI Sponsor Bot</span>
                        <div className="p-3 bg-card border border-border/40 rounded-2xl rounded-bl-none flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-150"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-300"></span>
                        </div>
                      </div>
                    )}
                    <div ref={aiChatEndRef} />
                  </div>
                )}

                <form onSubmit={handleSendAiMessage} className="flex gap-2 pt-2 border-t border-border/40">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask about deliverables, standard pricing, audience stats..."
                    disabled={loadingChat || aiLoading}
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button type="submit" disabled={loadingChat || aiLoading || !aiInput.trim()} className="rounded-xl px-3 bg-violet-600 text-white hover:bg-violet-700">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </div>

            {/* Direct Collab Button */}
            <div className="flex gap-3 justify-end items-center shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSelectedCreator(null)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  captureClientEvent(analyticsEvents.brandDiscoverCollabRoomClicked, {
                    creator_id: selectedCreator.id,
                    creator_username: selectedCreator.username
                  });
                  setSelectedCreator(null);
                  router.push("/brand/collab-room");
                }}
                className="bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black gap-1.5 py-4 px-4 h-10 shadow-sm"
              >
                <Handshake className="h-4 w-4" /> Go to Collab Room <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
