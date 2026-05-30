"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Handshake, Plus, Mail, MessageCircle, FileText, Sparkles, 
  Loader2, Trash2, Calendar, Link as LinkIcon, DollarSign, 
  Award, ArrowUpRight, CheckCircle2, ChevronRight, BarChart
} from "lucide-react";
import { BrandCollabModal } from "./brandCollabModal";

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

export function BrandCrmClient() {
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<BrandDeal | null>(null);
  const [selectedCollabDeal, setSelectedCollabDeal] = useState<BrandDeal | null>(null);

  // Form Fields
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [dealStatus, setDealStatus] = useState<BrandDeal["status"]>("lead");
  const [rateDollars, setRateDollars] = useState("500");
  const [deliverablesText, setDeliverablesText] = useState("1x YouTube Integration, 1x Twitter Post");
  const [dueDate, setDueDate] = useState("");

  // Shortlink creation
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  // AI Agent Sidebar States
  const [aiOutput, setAiOutput] = useState<{
    pitch?: string;
    proposal?: string;
    rights?: string;
  }>({});
  const [draftingAi, setDraftingAi] = useState<string | null>(null);

  async function fetchDeals() {
    try {
      const res = await fetch("/api/creator/brand-deals");
      const json = await res.json();
      if (json.ok) {
        setDeals(json.data?.deals || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch("/api/creator/brand-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          status: dealStatus,
          rateCents: Math.round(parseFloat(rateDollars) * 100) || 0,
          currency: "usd",
          deliverables: deliverablesText.split(",").map((s) => s.trim()).filter(Boolean),
          dueDate: dueDate || null,
        }),
      });

      const result = await response.json();
      if (result.ok) {
        setShowAddModal(false);
        // Clear fields
        setBrandName("");
        setContactName("");
        setContactEmail("");
        setDealStatus("lead");
        setRateDollars("500");
        setDeliverablesText("1x YouTube Integration, 1x Twitter Post");
        setDueDate("");
        fetchDeals();
      } else {
        alert(result.error?.message || "Failed to create brand deal.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand deal?")) return;

    try {
      const res = await fetch(`/api/creator/brand-deals?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        setDeals(deals.filter((d) => d.id !== id));
      }
    } catch {
      alert("Failed to delete deal.");
    }
  };

  const handleGenerateShortlink = async (deal: BrandDeal) => {
    setGeneratingLink(deal.id);
    try {
      // 1. Create shortlink slug
      const slug = `deal-${deal.brand_name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Math.floor(Math.random() * 90 + 10)}`;
      
      const linkRes = await fetch("/api/creator/short-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          destinationUrl: `https://kreatoros.projectagent.tech/u/demo?ref=brand_${slug}`,
          campaignName: `${deal.brand_name} Sponsorship Campaign`,
        }),
      });

      const linkJson = await linkRes.json();
      if (linkJson.ok) {
        // 2. Associate shortlink with brand deal
        await fetch("/api/creator/brand-deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: deal.id,
            brandName: deal.brand_name,
            status: deal.status,
            rateCents: deal.rate_cents,
            campaign_short_link_id: linkJson.data.link.id,
            dueDate: deal.due_date,
          }),
        });
        fetchDeals();
      } else {
        alert(linkJson.error?.message || "Failed to generate shortlink.");
      }
    } catch {
      alert("Network error creating shortlink.");
    } finally {
      setGeneratingLink(null);
    }
  };

  const runAiDraft = async (deal: BrandDeal, action: "pitch" | "proposal" | "reply") => {
    setDraftingAi(deal.id + "_" + action);
    try {
      // Simulate AI payload drafting based on campaign details
      await new Promise((r) => setTimeout(r, 1200));
      if (action === "pitch") {
        setAiOutput((prev) => ({
          ...prev,
          pitch: `Subject: Partnership Proposal: AI Systems Integration for ${deal.brand_name}\n\nHi ${deal.contact_name || "Partnerships Team"},\n\nI love what ${deal.brand_name} is building. As an AI productivity mentor with an audience of founders and solo creators, I want to pitch a high-impact integration across my channel.\n\nDeliverables:\n${deal.deliverables.map((d) => `- ${d}`).join("\n")}\n\nLet me know if we can sync up this week!\n\nBest,\n@demo`,
        }));
      } else if (action === "proposal") {
        setAiOutput((prev) => ({
          ...prev,
          proposal: `PROPOSAL & CAMPAIGN DETAILS\n==================================\nBrand Sponsor: ${deal.brand_name}\nTotal Campaign Fee: $${(deal.rate_cents / 100).toFixed(2)} USD\nDue Date: ${deal.due_date ? new Date(deal.due_date).toLocaleDateString() : "TBD"}\n\nDeliverables & Timeline:\n${deal.deliverables.map((d, i) => `${i + 1}. ${d} (Draft review 3 days prior)`).join("\n")}\n\nUsage Rights:\n- 30-day digital advertising distribution rights included.`,
        }));
      }
      setSelectedDeal(deal);
    } catch {
      // Fail silently
    } finally {
      setDraftingAi(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      
      {/* Kanban Pipeline & List */}
      <Card className="flex flex-col border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Handshake className="h-5 w-5 text-accent" />
            <span>Deal Pipeline</span>
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 text-xs font-bold">
            <Plus className="h-4 w-4" /> Add Deal
          </Button>
        </CardHeader>
        <CardContent className="flex-1">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-secondary/10">
              <Award className="h-10 w-10 text-muted-foreground mb-3" />
              <h4 className="text-sm font-bold text-foreground">No brand deals tracked</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1.5">
                Track leads, proposals, brand pitches, contract fees, shortlinks, and campaign milestones automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {deals.map((deal) => {
                const shortlink = deal.campaign_short_link_id_obj;
                return (
                  <div key={deal.id} className="flex flex-col py-4 first:pt-0 last:pb-0 gap-3 group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground text-base group-hover:text-accent transition-colors">
                            {deal.brand_name}
                          </p>
                          <Badge variant="accent" className="text-[10px] uppercase py-0.5 px-1.5 font-bold">
                            {deal.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {deal.contact_name ? `${deal.contact_name} ` : ""}
                          {deal.contact_email ? `· ${deal.contact_email} ` : ""}
                          · <span className="font-mono text-foreground font-semibold">${(deal.rate_cents / 100).toFixed(2)}</span>
                          {deal.due_date ? ` · due ${new Date(deal.due_date).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteDeal(deal.id)} 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div className="flex flex-wrap gap-1.5">
                      {deal.deliverables.map((del, index) => (
                        <Badge key={index} variant="outline" className="text-[9px] py-0.5 px-2 bg-secondary/50 border-border/60">
                          {del}
                        </Badge>
                      ))}
                    </div>

                    {/* Autopilot Campaign Controls */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-dashed border-border/40 mt-1">
                      {deal.campaign_short_link_id ? (
                        <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-xl px-3 py-1 text-xs">
                          <LinkIcon className="h-3 w-3 text-accent" />
                          <span className="font-mono text-muted-foreground">slug: {deal.campaign_short_link_id}</span>
                          <span className="font-semibold text-accent flex items-center gap-1">
                            <BarChart className="h-3 w-3 ml-1" />
                            {shortlink?.click_count || 0} clicks
                          </span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateShortlink(deal)}
                          disabled={generatingLink === deal.id}
                          className="h-7 text-[10px] gap-1 px-2.5 rounded-lg border-accent/20 text-accent hover:bg-accent/5"
                        >
                          {generatingLink === deal.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <LinkIcon className="h-3 w-3" />
                          )}
                          <span>Generate Campaign Link</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCollabDeal(deal)}
                          className="h-7 text-[10px] gap-1 px-2 hover:bg-secondary border-accent/25 text-accent"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>Collab Room</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => runAiDraft(deal, "pitch")}
                          className="h-7 text-[10px] gap-1 px-2 hover:bg-secondary"
                        >
                          <Sparkles className="h-3 w-3 text-violet-500" />
                          <span>Draft Pitch</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => runAiDraft(deal, "proposal")}
                          className="h-7 text-[10px] gap-1 px-2 hover:bg-secondary"
                        >
                          <FileText className="h-3 w-3 text-emerald-500" />
                          <span>Proposal</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Sidebar: AI Agent Copilot Output */}
      <Card className="flex flex-col border border-border bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
            <span>AI Brand Agent Copilot</span>
          </CardTitle>
          <Badge variant="success" className="bg-violet-500/10 text-violet-500 hover:bg-violet-500/20">Active</Badge>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 pt-4 overflow-y-auto">
          {selectedDeal ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="accent">Copilot Workspace</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-bold">{selectedDeal.brand_name}</span>
              </div>

              {aiOutput.pitch && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-violet-500" /> Generated Brand Pitch Draft
                  </h4>
                  <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                    {aiOutput.pitch}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(aiOutput.pitch || "");
                      alert("Copied to clipboard!");
                    }}
                    className="h-7 text-[10px] font-bold"
                  >
                    Copy Pitch
                  </Button>
                </div>
              )}

              {aiOutput.proposal && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-500" /> Generated Contract Proposal
                  </h4>
                  <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                    {aiOutput.proposal}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(aiOutput.proposal || "");
                      alert("Copied to clipboard!");
                    }}
                    className="h-7 text-[10px] font-bold"
                  >
                    Copy Contract
                  </Button>
                </div>
              )}

              {!aiOutput.pitch && !aiOutput.proposal && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Sparkles className="h-8 w-8 text-accent/50 mb-2 animate-spin-slow" />
                  <p className="text-xs font-bold">Select Copilot Task</p>
                  <p className="text-[10px] mt-1">Click "Draft Pitch" or "Proposal" on any brand deal to unleash your AI agent.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 p-4">
              <MessageCircle className="h-8 w-8 text-accent/40 mb-2" />
              <p className="text-xs font-bold">Copilot Idle</p>
              <p className="text-[10px] mt-1.5">Choose a brand deal to evaluate custom packages, draft emails, and compute rates.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border/40 bg-secondary/15 py-3.5 px-5">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            🤖 High-risk notifications and paid contracts require human authorization prior to dispatch.
          </p>
        </CardFooter>
      </Card>

      {/* Add Deal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Brand Deal</DialogTitle>
            <DialogDescription>
              Track negotiation pipelines and campaign deliverables for sponsorships.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDeal} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Brand Name</label>
                <input 
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Nike, Notion"
                  required
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Contact Person</label>
                <input 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Contact Email</label>
                <input 
                  value={contactEmail}
                  type="email"
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. sponsor@brand.com"
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Status / Pipeline Stage</label>
                <select
                  value={dealStatus}
                  onChange={(e) => setDealStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="lead">Lead / Inquired</option>
                  <option value="pitched">Pitched</option>
                  <option value="replied">Replied / Interested</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="approved">Approved / Contracted</option>
                  <option value="delivered">Delivered / Review</option>
                  <option value="paid">Paid & Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Rate Fee ($ USD)</label>
                <input 
                  value={rateDollars}
                  type="number"
                  onChange={(e) => setRateDollars(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Campaign Deadline</label>
                <input 
                  value={dueDate}
                  type="date"
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Deliverables Checklist (Comma-separated)</label>
              <textarea 
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                placeholder="1x YouTube Video, 1x Newsletter Shoutout"
                rows={2}
                className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Deal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collab Room Modal */}
      {selectedCollabDeal && (
        <BrandCollabModal
          deal={selectedCollabDeal}
          onClose={() => setSelectedCollabDeal(null)}
          onUpdateStatus={(dealId, newStatus) => {
            setDeals((prev) =>
              prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d))
            );
            setSelectedCollabDeal((prev) =>
              prev && prev.id === dealId ? { ...prev, status: newStatus } : prev
            );
          }}
        />
      )}
    </div>
  );
}
