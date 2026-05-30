"use client";

import { useMemo, useState } from "react";
import { 
  Brain, Sparkles, Tag, MessageSquare, Calendar, Play, 
  RefreshCw, X, Eye, Copy, Check, Search, Film, ChevronRight,
  ArrowUpRight, CheckCircle2
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

// Regex utility to extract metrics and username from the original caption / description
function parseCaptionFallback(caption: string | null) {
  if (!caption) return { likes: null, comments: null, username: null };

  let likes: string | null = null;
  let comments: string | null = null;
  let username: string | null = null;

  const likesMatch = caption.match(/([\d.,]+[KMB]?)\s+likes/i);
  if (likesMatch) likes = likesMatch[1];

  const commentsMatch = caption.match(/([\d.,]+[KMB]?)\s+comments/i);
  if (commentsMatch) comments = commentsMatch[1];

  // Match e.g., "likes, comments - username on Date:" or "likes, comments - username:"
  const pattern1 = caption.match(/(?:likes|comments)\s+-\s+([a-zA-Z0-9._]+)(?:\s+on\s+[^:]+)?:\s*/i);
  if (pattern1) {
    username = pattern1[1];
  }

  // Fallback match @username anywhere
  if (!username) {
    const pattern2 = caption.match(/(?:^|\s)@([a-zA-Z0-9._]+)/);
    if (pattern2) username = pattern2[1];
  }

  // Fallback match username on date
  if (!username) {
    const pattern3 = caption.match(/^([a-zA-Z0-9._]+)\s+on\s+[A-Z][a-z]+\s+\d+,\s+\d{4}\s*:/i);
    if (pattern3) username = pattern3[1];
  }

  return { likes, comments, username };
}

// Robust fallback username parser that extracts from caption, OpenGraph title, desc, or canonical URL paths
function resolveUsernameFallback(capture: InstagramCaptureRow) {
  if (capture.username && capture.username !== "Unknown" && capture.username.toLowerCase() !== "instagram") {
    return capture.username;
  }

  const parsed = parseCaptionFallback(capture.caption);
  if (parsed.username && parsed.username.toLowerCase() !== "instagram") {
    return parsed.username;
  }

  const raw = capture.raw_payload as any;
  if (raw) {
    const ogDescription = raw.instagram?.openGraph?.description || raw.page?.description || "";
    const ogTitle = raw.instagram?.openGraph?.title || raw.page?.title || "";
    const visibleText = raw.raw?.visibleTextSample || raw.raw_text || "";

    const textPool = `${ogTitle} \n ${ogDescription} \n ${visibleText}`;

    const userMention = textPool.match(/(?:^|\s)@([a-zA-Z0-9._]{2,30})/);
    if (userMention && userMention[1].toLowerCase() !== "instagram") {
      return userMention[1];
    }

    const photoBy = textPool.match(/(?:photo|video|content)\s+by\s+@?([a-zA-Z0-9._]{2,30})/i);
    if (photoBy && photoBy[1].toLowerCase() !== "instagram") {
      return photoBy[1];
    }

    const seeFrom = textPool.match(/from\s+@?([a-zA-Z0-9._]{2,30})/i);
    if (seeFrom && seeFrom[1].toLowerCase() !== "instagram") {
      return seeFrom[1];
    }

    const canonicalUrl = capture.canonical_url || capture.url || "";
    const urlMatch = canonicalUrl.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})\/(?:p|reels?|reel|tv)\//i);
    if (urlMatch && !["reels", "reel", "p", "tv", "stories"].includes(urlMatch[1].toLowerCase())) {
      return urlMatch[1];
    }
  }

  if (capture.username) return capture.username;
  if (parsed.username) return parsed.username;
  return "Unknown";
}

// Clean caption helper to strip scraped likes/comments prefix
function cleanCaptionText(caption: string | null) {
  if (!caption) return "";
  
  const match = caption.match(/^(?:[\d.,KMB]+\s+likes?,\s+[\d.,KMB]+\s+comments?\s+-\s+[a-zA-Z0-9._]+(?:\s+on\s+[^:]+)?:\s*)"(.*)"$/is);
  if (match) return match[1];
  
  const matchColon = caption.match(/^(?:[\d.,KMB]+\s+likes?,\s+[\d.,KMB]+\s+comments?\s+-\s+[a-zA-Z0-9._]+(?:\s+on\s+[^:]+)?:\s*)(.*)$/is);
  if (matchColon) return matchColon[1].replace(/^["']|["']$/g, "").trim();

  return caption;
}

// Resolves a beautiful, short, descriptive title based on clean caption text if default title is generic/Instagram
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

// Premium cinematic thumbnail renderer with no-referrer policy to bypass 403 hotlinking block
function ReelThumbnail({ 
  id, 
  thumbnailUrl, 
  backupUrls = [],
  retryIndex = 0,
  isImageBroken, 
  onError 
}: { 
  id: string; 
  thumbnailUrl: string | null; 
  backupUrls?: string[];
  retryIndex?: number;
  isImageBroken: boolean; 
  onError: () => void; 
}) {
  const currentUrl = retryIndex > 0 && retryIndex <= backupUrls.length 
    ? backupUrls[retryIndex - 1] 
    : thumbnailUrl;

  const isBase64 = currentUrl?.startsWith("data:") ?? false;

  if ((isImageBroken && !isBase64) || (!currentUrl && backupUrls.length === 0)) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-indigo-950/40 via-purple-900/30 to-pink-950/20 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 border border-purple-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" />
        
        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <Film className="h-5 w-5 text-purple-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.4)] animate-pulse" />
          <span className="text-[9px] tracking-wider uppercase font-bold text-purple-300/80 mt-1 select-none">
            Stream Offline
          </span>
        </div>
      </div>
    );
  }

  if (!currentUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={currentUrl} 
      alt="" 
      className="h-full w-full object-cover animate-fade-in transition-all duration-300"
      loading="lazy"
      referrerPolicy={isBase64 ? undefined : "no-referrer"}
      onError={isBase64 ? undefined : onError}
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
  const [imageRetryIndices, setImageRetryIndices] = useState<Record<string, number>>({});
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [remixedOffers, setRemixedOffers] = useState<Record<string, any>>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return capturesList.filter((capture) => !needle || searchableText(capture).includes(needle));
  }, [capturesList, query]);

  const handleRemixOffer = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setRemixingId(id);
    try {
      const res = await fetch("/api/import/instagram/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureId: id }),
      });
      if (!res.ok) throw new Error("Remix failed");
      const body = await res.json();
      if (body.ok && body.data?.offer) {
        setRemixedOffers(prev => ({ ...prev, [id]: body.data.offer }));
      }
    } catch (err) {
      console.error("[Remix Error]", err);
      alert("Failed to remix swipe into a live offer. Check server logs.");
    } finally {
      setRemixingId(null);
    }
  };

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

  const selectedDisplayUsername = selectedCapture
    ? resolveUsernameFallback(selectedCapture)
    : "Unknown";

  const selectedCleanCaption = selectedCapture
    ? cleanCaptionText(selectedCapture.caption)
    : "";

  const selectedDisplayTitle = selectedCapture
    ? resolveDisplayTitle(selectedCapture)
    : "";

  return (
    <div className="space-y-6">
      {/* Centered Premium AI Search Engine Banner */}
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
                  const retryIndex = imageRetryIndices[capture.id] ?? 0;
                  const backupUrls = capture.media_image_urls || [];
                  const isImageBroken = (!capture.thumbnail_url && backupUrls.length === 0) || imageErrors[capture.id];

                  const handleImageError = () => {
                    if (retryIndex < backupUrls.length) {
                      setImageRetryIndices(prev => ({ ...prev, [capture.id]: (prev[capture.id] ?? 0) + 1 }));
                    } else {
                      setImageErrors(prev => ({ ...prev, [capture.id]: true }));
                    }
                  };

                  const cleanCaption = cleanCaptionText(capture.caption);
                  return (
                    <tr key={capture.id} onClick={() => setSelectedCapture(capture)} className="hover:bg-muted/15 transition-all duration-200 cursor-pointer group">
                      <td className="p-4 whitespace-nowrap border-r border-border/20">
                        <div className="relative h-16 w-12 rounded-lg bg-secondary overflow-hidden shadow-sm transition-transform group-hover:scale-[1.03]">
                          <ReelThumbnail 
                            id={capture.id} 
                            thumbnailUrl={capture.thumbnail_url} 
                            backupUrls={backupUrls}
                            retryIndex={retryIndex}
                            isImageBroken={isImageBroken} 
                            onError={handleImageError} 
                          />
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
                          <div className="space-y-2">
                            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold py-0.5 tracking-wide animate-pulse">Awaiting Analysis</Badge>
                            <Button type="button" onClick={(e) => handleReanalyze(capture.id, e)} disabled={analyzingId === capture.id} className="w-full text-[11px] font-bold rounded-lg bg-primary/10 text-primary border border-primary/20">
                              <Sparkles className="h-3 w-3 mr-1" /> Extract Narrative
                            </Button>
                          </div>
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
              
              {/* Compact Thumbnail Frame with no-referrer referrer policy bypass */}
              <div className="relative w-full aspect-[16/9] bg-secondary rounded-xl overflow-hidden border border-border shadow-inner">
                <ReelThumbnail 
                  id={selectedCapture.id} 
                  thumbnailUrl={selectedCapture.thumbnail_url} 
                  backupUrls={selectedCapture.media_image_urls || []}
                  retryIndex={imageRetryIndices[selectedCapture.id] ?? 0}
                  isImageBroken={(!selectedCapture.thumbnail_url && (selectedCapture.media_image_urls || []).length === 0) || imageErrors[selectedCapture.id]} 
                  onError={() => {
                    const idx = imageRetryIndices[selectedCapture.id] ?? 0;
                    const len = (selectedCapture.media_image_urls || []).length;
                    if (idx < len) {
                      setImageRetryIndices(prev => ({ ...prev, [selectedCapture.id]: idx + 1 }));
                    } else {
                      setImageErrors(prev => ({ ...prev, [selectedCapture.id]: true }));
                    }
                  }} 
                />
              </div>

              {/* Title Header */}
              <h3 className="text-base font-bold text-card-foreground leading-snug">{selectedDisplayTitle || "Swipe Record Details"}</h3>

              {/* Ultra-compact Notion Grid Properties (No metrics/links) to avoid wasting vertical space */}
              <div className="border border-border/40 bg-muted/5 rounded-xl p-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs select-none">
                <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium text-[11px]">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground/60" /> Creator
                  </span>
                  <span className="font-bold text-card-foreground">
                    @{selectedDisplayUsername}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium text-[11px]">
                    <Film className="h-3.5 w-3.5 text-muted-foreground/60" /> Format
                  </span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[9px] uppercase font-bold bg-secondary tracking-wider text-muted-foreground border border-border/30 leading-none">
                    {selectedCapture.media_type}
                  </Badge>
                </div>

                <div className="flex items-center justify-between col-span-2 pt-0.5">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" /> Saved Date
                  </span>
                  <span className="font-semibold text-card-foreground text-[11px]">
                    {formatDate(selectedCapture.created_at)}
                  </span>
                </div>
              </div>

              {/* Main Script Reconstruction Content */}
              {selectedCapture.status === "analyzed" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                        <Brain className="h-4 w-4 text-primary" />
                        <span>Narrative Script / Transcript</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCopyScript(selectedCapture.id, selectedCapture.summary, e)}
                        className="h-7 text-xs font-semibold px-2 rounded hover:bg-secondary text-primary border border-transparent hover:border-border/30 gap-1.5"
                      >
                        {copiedId === selectedCapture.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy Script
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground bg-secondary/15 border border-border/40 p-4 rounded-xl font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {selectedCapture.summary}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                      <Tag className="h-4 w-4 text-primary" />
                      <span>Niche Focus Pillars</span>
                    </div>
                    <div className="flex flex-wrap gap-1 bg-secondary/20 border border-border/30 p-2.5 rounded-xl">
                      {selectedCapture.topics.length > 0 ? (
                        selectedCapture.topics.map((t) => (
                          <Badge key={t} variant="secondary" className="px-2 py-0.5 text-[10px] bg-card text-muted-foreground border border-border/30">
                            {t}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs italic text-muted-foreground/50">Standard</span>
                      )}
                    </div>
                  </div>

                  {/* AI Swipe-to-Offer Remix Section */}
                  <div className="space-y-3 border-t border-border/40 pt-4 mt-4 select-none">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      <span>AI Swipe-to-Offer Remix</span>
                    </div>

                    {remixedOffers[selectedCapture.id] ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 text-left space-y-3 animate-fade-in">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Offer Remixed Successfully!</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Gemini successfully analyzed the Reel's transcripts and created a high-converting <strong>1:1 Booking Session</strong> Offer:
                        </p>
                        <div className="bg-background/45 border border-border/40 p-2.5 rounded-lg text-xs font-bold text-card-foreground">
                          {remixedOffers[selectedCapture.id].title} (Price: {remixedOffers[selectedCapture.id].price_cents > 0 ? `$${remixedOffers[selectedCapture.id].price_cents / 100}` : "Free"})
                        </div>
                        <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9">
                          <a 
                            href={`/creator/calendar`} 
                            className="flex items-center justify-center gap-1.5 w-full"
                          >
                            Manage Booking Offer <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/60 bg-muted/5 p-4 text-left space-y-3">
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Convert this viral concept into an automated product flow. AI will draft 1:1 call copy, configure scheduling duration, and initialize transactional message templates.
                        </p>
                        <Button 
                          type="button"
                          disabled={remixingId === selectedCapture.id}
                          onClick={(e) => handleRemixOffer(selectedCapture.id, e)}
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-9 transition-all duration-200"
                        >
                          {remixingId === selectedCapture.id ? (
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Analyzing Narrative Pillars...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              Remix into Creator Offer
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center flex flex-col items-center justify-center">
                  <Sparkles className="h-6 w-6 text-amber-500/60 animate-pulse mb-2" />
                  <p className="text-xs font-semibold">Narrative Flow Ready</p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    This capture is ready for narrative restructuring and content pillar indexing. Click the action button below to reconstruct the script.
                  </p>
                </div>
              )}

              {selectedCleanCaption && (
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-muted-foreground/80" />
                    <span>Scraped Caption Description</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-muted/20 border border-border/60 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedCleanCaption}
                  </div>
                </div>
              )}

            </div>
            
            {/* Drawer Footer Actions - Compact full-width Reconstruct button (no external link) */}
            <div className="border-t border-border p-4 bg-muted/15">
              <Button 
                type="button" 
                onClick={() => handleReanalyze(selectedCapture.id)} 
                disabled={analyzingId === selectedCapture.id} 
                className="w-full h-10 font-bold bg-primary hover:bg-primary/95 text-primary-foreground transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzingId === selectedCapture.id ? "animate-spin" : ""}`} /> 
                {analyzingId === selectedCapture.id ? "Processing..." : "Reconstruct Narrative"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
