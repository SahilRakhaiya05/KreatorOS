"use client";

import { useMemo, useState } from "react";
import { 
  Brain, Sparkles, Tag, MessageSquare, Calendar, Play, 
  RefreshCw, X, Eye, Copy, Check, Search, Film, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InstagramCaptureRow } from "@/server/instagram/captureService";

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { 
    month: "short", 
    day: "numeric", 
    hour: "numeric", 
    minute: "2-digit" 
  }).format(new Date(value));
}

function searchableText(capture: InstagramCaptureRow) {
  return [
    capture.title,
    capture.caption,
    capture.summary,
    capture.hook,
    capture.username,
    capture.media_type,
    ...capture.tags,
    ...capture.topics,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function parseCaptionFallback(caption: string | null) {
  if (!caption) return { likes: null, comments: null, username: null };

  let likes: string | null = null;
  let comments: string | null = null;
  let username: string | null = null;

  const likesMatch = caption.match(/([\d.,]+[KMB]?)\s+likes/i);
  if (likesMatch) likes = likesMatch[1];

  const commentsMatch = caption.match(/([\d.,]+[KMB]?)\s+comments/i);
  if (commentsMatch) comments = commentsMatch[1];

  const usernameMatch = caption.match(/(?:likes|comments)\s+-\s+([a-zA-Z0-9._]+)(?:\s+on\s+|$)/i);
  if (usernameMatch) username = usernameMatch[1];

  return { likes, comments, username };
}

function resolveUsernameFallback(capture: InstagramCaptureRow) {
  if (capture.username && capture.username !== "Unknown") {
    return capture.username;
  }

  const parsed = parseCaptionFallback(capture.caption);
  if (parsed.username) {
    return parsed.username;
  }

  const raw = capture.raw_payload as any;
  if (raw) {
    const ogDescription = raw.instagram?.openGraph?.description || raw.page?.description || "";
    const ogTitle = raw.instagram?.openGraph?.title || raw.page?.title || "";

    const ogUserMatch = ogDescription.match(/@([a-zA-Z0-9._]+)/) || ogTitle.match(/@([a-zA-Z0-9._]+)/);
    if (ogUserMatch) {
      return ogUserMatch[1];
    }

    const photoByMatch = ogDescription.match(/photo by @?([a-zA-Z0-9._]+)/i);
    if (photoByMatch) {
      return photoByMatch[1];
    }

    const canonicalUrl = capture.canonical_url || "";
    const urlMatch = canonicalUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)\/(?:p|reels|reel)\//i);
    if (urlMatch && !["reels", "reel", "p"].includes(urlMatch[1].toLowerCase())) {
      return urlMatch[1];
    }
  }

  return "Unknown";
}

function cleanCaptionText(caption: string | null) {
  if (!caption) return "";
  
  const match = caption.match(/^(?:[\d.,KMB]+\s+likes?,\s+[\d.,KMB]+\s+comments?\s+-\s+[a-zA-Z0-9._]+(?:\s+on\s+[^:]+)?:\s*)"(.*)"$/is);
  if (match) return match[1];
  
  const matchColon = caption.match(/^(?:[\d.,KMB]+\s+likes?,\s+[\d.,KMB]+\s+comments?\s+-\s+[a-zA-Z0-9._]+(?:\s+on\s+[^:]+)?:\s*)(.*)$/is);
  if (matchColon) return matchColon[1].replace(/^["']|["']$/g, "").trim();

  return caption;
}

function resolveDisplayTitle(capture: InstagramCaptureRow) {
  const clean = cleanCaptionText(capture.caption);
  const genericTitles = ["instagram", "(1) instagram", "(2) instagram", "(3) instagram", "reel", "post", "instagram post", "instagram reel"];
  const currentTitle = (capture.title || "").trim().toLowerCase();

  if (!capture.title || genericTitles.includes(currentTitle) || /^\(\d+\)\s*instagram/i.test(currentTitle)) {
    if (clean) {
      const firstLine = clean.split("\n")[0].trim();
      if (firstLine.length > 50) return firstLine.slice(0, 50).trim() + "...";
      return firstLine || "Captured Swipe Content";
    }
    return "Captured Swipe Content";
  }
  
  return capture.title;
}

function ReelThumbnail({ 
  id, 
  thumbnailUrl, 
  isImageBroken, 
  onError 
}: { 
  id: string; 
  thumbnailUrl: string | null; 
  isImageBroken: boolean; 
  onError: () => void; 
}) {
  if (isImageBroken || !thumbnailUrl) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-indigo-950/40 via-purple-900/30 to-pink-950/20 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 border border-purple-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-purple-500/10 border border-purple-400/25 shadow-lg shadow-purple-500/5 backdrop-blur-md">
            <Film className="h-5 w-5 text-purple-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.4)]" />
          </div>
          <span className="text-[9px] tracking-wider uppercase font-bold text-purple-300/80 mt-1 select-none">Stream Offline</span>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={thumbnailUrl} 
      alt="" 
      className="h-full w-full object-cover animate-fade-in transition-all duration-300"
      loading="lazy"
      onError={onError}
    />
  );
}

export function InstagramLibrary({ captures: initialCaptures }: { captures: InstagramCaptureRow[] }) {
  const [capturesList, setCapturesList] = useState<InstagramCaptureRow[]>(initialCaptures);
  const [query, setQuery] = useState("");
  const [selectedCapture, setSelectedCapture] = useState<InstagramCaptureRow | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return capturesList.filter((capture) => !needle || searchableText(capture).includes(needle));
  }, [capturesList, query]);

  const handleReanalyze = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setAnalyzingId(id);
    try {
      const res = await fetch("/api/import/instagram", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Re-analysis failed");
      const body = await res.json();
      if (body.ok && body.data?.capture) {
        const updated = body.data.capture;
        setCapturesList(prev => prev.map(item => item.id === id ? updated : item));
        if (selectedCapture?.id === id) setSelectedCapture(updated);
      }
    } catch (err) {
      console.error("[AI Analysis Error]", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleCopyScript = (id: string, text: string | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stats = {
    total: capturesList.length,
    analyzed: capturesList.filter((c) => c.status === "analyzed").length,
    pending: capturesList.filter((c) => c.status === "pending").length,
  };

  const selectedDisplayTitle = selectedCapture ? resolveDisplayTitle(selectedCapture) : "";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card/70 via-card/50 to-background p-6 md:p-8 shadow-sm backdrop-blur-md">
        <div className="max-w-2xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Brain className="h-3.5 w-3.5" />
            <span>KreatorOS Swipe Intelligence Platform</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-card-foreground">Narrative Search & Pillar Reconstruction</h2>
          <div className="relative mt-2 max-w-xl mx-auto shadow-lg shadow-primary/5 rounded-xl overflow-hidden">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/70" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by creator, transcript, or narrative pillars..."
              className="pl-12 pr-4 h-12 bg-background border-primary/20 focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl text-sm font-medium"
            />
          </div>
          <div className="flex justify-center gap-6 pt-1 text-xs font-medium text-muted-foreground select-none">
            <span>Captured Reels: <strong className="text-card-foreground font-semibold">{stats.total}</strong></span>
            <span>•</span>
            <span>Analyzed Narrative: <strong className="text-emerald-500 font-semibold">{stats.analyzed}</strong></span>
            <span>•</span>
            <span>Awaiting Analysis: <strong className="text-amber-500 font-semibold">{stats.pending}</strong></span>
          </div>
        </div>
      </div>

      {!filtered.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center backdrop-blur-sm">
          <p className="text-sm font-bold text-card-foreground">No captures found</p>
        </div>
      ) : (
        <Card className="border-border/70 bg-card/40 overflow-hidden shadow-sm backdrop-blur-md rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] select-none">
                  <th className="p-4 font-bold border-r border-border/40">Reel Preview</th>
                  <th className="p-4 font-bold border-r border-border/40">Creator</th>
                  <th className="p-4 font-bold border-r border-border/40">Description</th>
                  <th className="p-4 font-bold border-r border-border/40">Narrative Reconstruction</th>
                  <th className="p-4 font-bold border-r border-border/40">Niche Pillars</th>
                  <th className="p-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((capture) => {
                  const displayUsername = resolveUsernameFallback(capture);
                  const isImageBroken = !capture.thumbnail_url || imageErrors[capture.id];
                  const cleanCaption = cleanCaptionText(capture.caption);
                  return (
                    <tr key={capture.id} onClick={() => setSelectedCapture(capture)} className="hover:bg-muted/15 transition-all duration-200 cursor-pointer group">
                      <td className="p-4 whitespace-nowrap border-r border-border/20">
                        <div className="relative h-16 w-12 rounded-lg bg-secondary overflow-hidden shadow-sm transition-transform group-hover:scale-[1.03]">
                          <ReelThumbnail id={capture.id} thumbnailUrl={capture.thumbnail_url} isImageBroken={isImageBroken} onError={() => setImageErrors(prev => ({ ...prev, [capture.id]: true }))} />
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground font-semibold border-r border-border/20">
                        {displayUsername !== "Unknown" ? <span className="inline-flex rounded-lg bg-secondary/60 px-2.5 py-1 text-xs font-bold text-card-foreground border border-border/30">@{displayUsername}</span> : <span className="italic text-muted-foreground/50">Unknown</span>}
                      </td>
                      <td className="p-4 max-w-[320px] border-r border-border/20">
                        <span className="line-clamp-3 text-xs leading-relaxed text-card-foreground/90 font-medium">{cleanCaption || "No description provided."}</span>
                      </td>
                      <td className="p-4 max-w-[320px] border-r border-border/20">
                        {capture.status === "analyzed" ? (
                          <div className="space-y-2">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">Ready</Badge>
                            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground font-mono bg-secondary/15 p-2 rounded-lg">{capture.summary}</p>
                          </div>
                        ) : (
                          <Button type="button" onClick={(e) => handleReanalyze(capture.id, e)} disabled={analyzingId === capture.id} className="w-full text-[11px] font-bold rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Sparkles className="h-3 w-3 mr-1" /> Extract Narrative
                          </Button>
                        )}
                      </td>
                      <td className="p-4 max-w-[180px] border-r border-border/20">
                        {capture.status === "analyzed" ? (
                          <div className="flex flex-wrap gap-1">
                            {capture.topics.slice(0, 4).map((t) => <Badge key={t} variant="secondary" className="px-2 py-0 text-[10px]">{t}</Badge>)}
                          </div>
                        ) : <span className="italic text-muted-foreground/45">Pending</span>}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedCapture(capture)} className="h-8 w-8 hover:bg-secondary">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedCapture && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCapture(null)} />
          <div className="relative h-full w-full max-w-xl border-l border-border bg-background shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5 bg-muted/10">
              <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /><span className="text-xs font-bold uppercase text-muted-foreground">Narrative Flow</span></div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCapture(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="relative w-full aspect-[16/9] bg-secondary rounded-xl overflow-hidden border border-border">
                <ReelThumbnail id={selectedCapture.id} thumbnailUrl={selectedCapture.thumbnail_url} isImageBroken={!selectedCapture.thumbnail_url || imageErrors[selectedCapture.id]} onError={() => setImageErrors(prev => ({ ...prev, [selectedCapture.id]: true }))} />
              </div>
              <h3 className="text-base font-bold text-card-foreground">{selectedDisplayTitle || "Swipe Record Details"}</h3>
              <div className="border border-border/60 bg-muted/5 rounded-xl p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Creator</span><span className="font-bold">@{resolveUsernameFallback(selectedCapture)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Saved</span><span className="font-semibold">{formatDate(selectedCapture.created_at)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Index Status</span><Badge variant="outline">{selectedCapture.status === "analyzed" ? "Script Restructured" : "Awaiting Analysis"}</Badge></div>
              </div>
            </div>
            <div className="border-t border-border p-4 bg-muted/15">
              <Button type="button" onClick={() => handleReanalyze(selectedCapture.id)} disabled={analyzingId === selectedCapture.id} className="w-full h-10 font-bold bg-primary hover:bg-primary/95 text-primary-foreground">
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzingId === selectedCapture.id ? "animate-spin" : ""}`} /> {analyzingId === selectedCapture.id ? "Processing..." : "Reconstruct Narrative"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
