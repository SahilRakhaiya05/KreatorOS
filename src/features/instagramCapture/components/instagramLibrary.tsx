"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, Columns3, Film, Grid2X2, Search, Table2, 
  Brain, Sparkles, Tag, MessageSquare, CheckCircle2, Lightbulb, 
  Calendar, Eye, Play, RefreshCw, X, AlertCircle, Heart, User, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InstagramCaptureRow } from "@/server/instagram/captureService";

type ViewMode = "board" | "table";

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

export function InstagramLibrary({ captures: initialCaptures }: { captures: InstagramCaptureRow[] }) {
  const [capturesList, setCapturesList] = useState<InstagramCaptureRow[]>(initialCaptures);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("table"); // Default to table for Second Brain Notion-style view
  const [selectedCapture, setSelectedCapture] = useState<InstagramCaptureRow | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Dynamic filter lists
  const types = useMemo(() => Array.from(new Set(capturesList.map((c) => c.media_type))).sort(), [capturesList]);

  // Filter logic
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return capturesList.filter((capture) => {
      const matchesType = type === "all" || capture.media_type === type;
      const matchesStatus = statusFilter === "all" || capture.status === statusFilter;
      const matchesQuery = !needle || searchableText(capture).includes(needle);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [capturesList, query, type, statusFilter]);

  // Re-run AI analysis using our PATCH route
  const handleReanalyze = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setAnalyzingId(id);
    try {
      const res = await fetch("/api/import/instagram", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        throw new Error("Re-analysis failed");
      }

      const body = await res.json();
      if (body.ok && body.data?.capture) {
        const updated = body.data.capture;
        
        // Update local captures array
        setCapturesList(prev => prev.map(item => item.id === id ? updated : item));
        
        // Update selected capture details panel if currently open
        if (selectedCapture?.id === id) {
          setSelectedCapture(updated);
        }
      }
    } catch (err) {
      console.error("[Re-analysis error]", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Stats Counters
  const stats = [
    { label: "Total Saves", value: capturesList.length, icon: Brain, color: "text-rose-500" },
    { label: "AI Analyzed", value: capturesList.filter((c) => c.status === "analyzed").length, icon: Sparkles, color: "text-emerald-500" },
    { label: "Unique Topics", value: new Set(capturesList.flatMap((c) => c.topics)).size, icon: Tag, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats Panel */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-md transition-all hover:border-border/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-card-foreground">{stat.value}</p>
              </div>
              <div className={`rounded-lg bg-secondary/50 p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            {/* Subtle glow background */}
            <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-primary/5 blur-xl pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Filter and View Control Bar */}
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search hook concepts, creators, tag lists, captions..."
            className="pl-9 h-10 bg-card/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 rounded-lg"
          />
        </div>

        {/* Media Type Filter */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="md:w-44 h-10 bg-card/50 border-border/80 rounded-lg">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content Types</SelectItem>
            {types.map((item) => (
              <SelectItem key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AI Analysis Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44 h-10 bg-card/50 border-border/80 rounded-lg">
            <SelectValue placeholder="AI Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="analyzed">Analyzed with AI</SelectItem>
            <SelectItem value="pending">Pending Analysis</SelectItem>
            <SelectItem value="failed">Failed Analysis</SelectItem>
          </SelectContent>
        </Select>

        {/* Toggle Board/Table views */}
        <div className="flex h-10 gap-1 rounded-lg border border-border/80 bg-card/50 p-1">
          <Button
            type="button"
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            className="h-full px-3.5 rounded-md text-xs font-semibold"
            aria-label="Table View"
          >
            <Table2 className="h-4 w-4 mr-1.5" />
            Notion Table
          </Button>
          <Button
            type="button"
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            className="h-full px-3.5 rounded-md text-xs font-semibold"
            aria-label="Board View"
          >
            <Grid2X2 className="h-4 w-4 mr-1.5" />
            Gallery Cards
          </Button>
        </div>
      </div>

      {/* Main Swipe Content Panel */}
      {!filtered.length ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center backdrop-blur-sm">
          <Film className="mx-auto h-10 w-10 text-muted-foreground/60 animate-pulse" />
          <p className="mt-4 text-base font-semibold text-card-foreground">No Instagram saves found</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query, or use the Chrome extension on Instagram posts to capture items directly.
          </p>
        </div>
      ) : view === "board" ? (
        // Board View
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((capture) => (
            <Card 
              key={capture.id} 
              onClick={() => setSelectedCapture(capture)}
              className="group overflow-hidden border-border/70 bg-card/60 hover:bg-card hover:border-border shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {capture.thumbnail_url ? (
                  <div className="relative aspect-[16/10] bg-secondary overflow-hidden border-b border-border/40">
                    <img 
                      src={capture.thumbnail_url} 
                      alt={capture.title || "Instagram thumbnail"} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> View Second Brain Analysis
                      </span>
                    </div>
                    {capture.media_type === "reel" && (
                      <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-secondary/50 border-b border-border/40 flex items-center justify-center">
                    <Film className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                
                <CardHeader className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-secondary border border-border/40 text-muted-foreground">
                      {capture.media_type}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(capture.created_at)}
                    </span>
                  </div>
                  
                  <CardTitle className="line-clamp-2 text-sm font-semibold tracking-tight text-card-foreground group-hover:text-primary transition-colors leading-snug">
                    {capture.hook || capture.title || "Instagram Swipe Record"}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="px-4 pb-3 pt-0 space-y-3.5">
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {capture.summary || capture.caption || "Captured. Pending deep AI strategy review."}
                  </p>
                  
                  {/* Tag List */}
                  {capture.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {capture.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="px-2 py-0 text-[10px] font-medium border-border/80 bg-background/30 text-muted-foreground">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Opportunities */}
                  {capture.opportunities.length > 0 ? (
                    <div className="rounded-lg bg-secondary/35 border border-border/20 p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/90">AI Strategy Angle</p>
                      <p className="mt-1 text-xs text-card-foreground/90 line-clamp-1 leading-snug">{capture.opportunities[0]}</p>
                    </div>
                  ) : null}
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 mt-2 border-t border-border/30 flex items-center justify-between gap-2.5">
                <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  <User className="h-3 w-3 text-primary/70" /> {capture.username ? `@${capture.username}` : "Instagram Creator"}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleReanalyze(capture.id, e)}
                    disabled={analyzingId === capture.id}
                    title="Re-run AI Analysis"
                    className="h-8 w-8 hover:bg-secondary border border-transparent hover:border-border/40 text-muted-foreground"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${analyzingId === capture.id ? "animate-spin text-primary" : ""}`} />
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold px-3 border-border/60 hover:bg-secondary">
                    <Link href={capture.canonical_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      Original <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Notion-Style Premium Table View
        <Card className="border-border/70 bg-card/50 overflow-hidden shadow-sm backdrop-blur-md">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 p-4 space-y-0">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold tracking-tight text-card-foreground">Instagram Second Brain Hub</CardTitle>
            </div>
            <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase border-border/80 bg-background/30">
              {filtered.length} captured items
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] select-none">
                  <th className="p-4 font-bold">Content Concept (Title / Hook)</th>
                  <th className="p-4 font-bold">Creator</th>
                  <th className="p-4 font-bold">Media Type</th>
                  <th className="p-4 font-bold">Search Tags</th>
                  <th className="p-4 font-bold">Opportunities / Next Action</th>
                  <th className="p-4 font-bold">Date Saved</th>
                  <th className="p-4 text-center font-bold">AI Status</th>
                  <th className="p-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((capture) => (
                  <tr 
                    key={capture.id} 
                    onClick={() => setSelectedCapture(capture)}
                    className="hover:bg-muted/15 transition-all duration-200 cursor-pointer group"
                  >
                    {/* Title / Hook */}
                    <td className="p-4 font-medium max-w-[280px]">
                      <div className="flex items-center gap-3">
                        {capture.thumbnail_url ? (
                          <img 
                            src={capture.thumbnail_url} 
                            alt="" 
                            className="h-9 w-12 rounded object-cover border border-border/50 bg-secondary flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-9 w-12 rounded bg-secondary/60 flex items-center justify-center border border-border/40 flex-shrink-0">
                            <Film className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                        <span className="truncate block font-semibold text-card-foreground group-hover:text-primary transition-colors" title={capture.hook || capture.title || capture.canonical_url}>
                          {capture.hook || capture.title || "Instagram Swipe Record"}
                        </span>
                      </div>
                    </td>
                    
                    {/* Creator username */}
                    <td className="p-4 text-muted-foreground font-medium">
                      {capture.username ? (
                        <span className="rounded bg-secondary/40 px-2 py-1 text-[11px] font-bold text-card-foreground/90 border border-border/20">
                          @{capture.username}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/60">Unknown</span>
                      )}
                    </td>

                    {/* Media Type */}
                    <td className="p-4">
                      <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase font-bold border border-border/30 text-muted-foreground bg-secondary/80">
                        {capture.media_type}
                      </Badge>
                    </td>

                    {/* Tags */}
                    <td className="p-4 text-muted-foreground max-w-[180px]">
                      <span className="truncate block" title={capture.tags.join(", ")}>
                        {capture.tags.length > 0 ? (
                          capture.tags.slice(0, 3).map(tag => `#${tag}`).join(" ")
                        ) : (
                          <span className="italic text-muted-foreground/40">None</span>
                        )}
                      </span>
                    </td>

                    {/* Next Opportunity */}
                    <td className="p-4 text-muted-foreground max-w-[220px]">
                      <span className="truncate block" title={capture.opportunities[0] || "Review capture later"}>
                        {capture.opportunities[0] || <span className="italic text-muted-foreground/40">Review later</span>}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-muted-foreground whitespace-nowrap font-medium">
                      {formatDate(capture.created_at)}
                    </td>

                    {/* AI Analysis Status */}
                    <td className="p-4 text-center">
                      <Badge 
                        variant={capture.status === "analyzed" ? "default" : "outline"}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          capture.status === "analyzed" 
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border border-emerald-500/20" 
                            : capture.status === "failed" 
                              ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border border-amber-500/20"
                        }`}
                      >
                        {capture.status}
                      </Badge>
                    </td>

                    {/* Actions Row */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReanalyze(capture.id)}
                          disabled={analyzingId === capture.id}
                          title="Re-run AI Analysis"
                          className="h-8 w-8 hover:bg-secondary text-muted-foreground"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${analyzingId === capture.id ? "animate-spin text-primary" : ""}`} />
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary text-muted-foreground">
                          <Link href={capture.canonical_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Notion-Style Side-Drawer Second Brain Inspector */}
      {selectedCapture && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedCapture(null)}
          />
          
          {/* Drawer Body container */}
          <div className="relative h-full w-full max-w-xl border-l border-border bg-card/98 shadow-2xl backdrop-blur-md transition-transform duration-300 flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border p-5 bg-muted/10">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Second Brain Inspector</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedCapture(null)}
                className="h-8 w-8 rounded-full hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Media Thumbnail & Identity Section */}
              <div className="space-y-4">
                {selectedCapture.thumbnail_url ? (
                  <div className="relative w-full aspect-[16/9] bg-secondary rounded-xl overflow-hidden border border-border shadow-inner">
                    <img src={selectedCapture.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    {selectedCapture.media_type === "reel" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-secondary tracking-wider text-muted-foreground border border-border/40">
                      {selectedCapture.media_type}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        selectedCapture.status === "analyzed" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      AI STATUS: {selectedCapture.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(selectedCapture.created_at)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold tracking-tight text-card-foreground leading-snug">
                    {selectedCapture.hook || selectedCapture.title || "Instagram Capture"}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary/70" />
                    <span>Captured from </span>
                    {selectedCapture.username ? (
                      <span className="font-bold text-card-foreground">@{selectedCapture.username}</span>
                    ) : (
                      <span className="italic text-muted-foreground/60">Unknown Creator</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Analysis Block */}
              {selectedCapture.status === "analyzed" ? (
                <div className="space-y-5">
                  {/* Hook concept */}
                  {selectedCapture.hook && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full pointer-events-none" />
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Gemini Key Hook Concept</p>
                          <p className="mt-1 text-sm font-semibold leading-relaxed text-card-foreground/90">{selectedCapture.hook}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Brain className="h-4 w-4 text-muted-foreground/80" />
                      <span>AI Strategic Summary</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground bg-secondary/20 border border-border/40 p-3.5 rounded-xl">
                      {(selectedCapture.summary as string) || "Pending strategic summary analysis."}
                    </p>
                  </div>

                  {/* Topics and tags */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Topics / Categories</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCapture.topics.length > 0 ? (
                          selectedCapture.topics.map(t => (
                            <Badge key={t} variant="secondary" className="px-2 py-0 text-[10px] bg-secondary/80 text-muted-foreground">
                              {t as string}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs italic text-muted-foreground/55">None identified</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Searchable Hashtags</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCapture.tags.length > 0 ? (
                          selectedCapture.tags.map(t => (
                            <Badge key={t} variant="outline" className="px-2 py-0 text-[10px] font-medium border-border/70 bg-background/20 text-muted-foreground">
                              #{t as string}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs italic text-muted-foreground/55">None identified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Opportunities */}
                  {selectedCapture.opportunities && selectedCapture.opportunities.length > 0 && (
                    <div className="space-y-3 border-t border-border/40 pt-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Actionable Creator Opportunities</span>
                      </div>
                      <ul className="space-y-2">
                        {selectedCapture.opportunities.map((opp, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed">
                            <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{opp as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Creative Remix Ideas */}
                  {(selectedCapture.analysis as any)?.remixIdeas && ((selectedCapture.analysis as any).remixIdeas as string[]).length > 0 && (
                    <div className="space-y-3 border-t border-border/40 pt-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Lightbulb className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span>Creative Remix Prompts</span>
                      </div>
                      <ul className="space-y-2.5">
                        {((selectedCapture.analysis as any).remixIdeas as string[] || []).map((idea: any, idx: number) => (
                          <li key={idx} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-xs text-card-foreground leading-relaxed flex gap-2.5 items-start">
                            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>{idea as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center flex flex-col items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-500/60 animate-bounce mb-3" />
                  <p className="text-sm font-semibold">Gemini AI Analysis Stalled</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    This swipe is missing strategic AI categorization. Trigger Gemini below to generate hooks, tags, opportunities, and remix suggestions.
                  </p>
                </div>
              )}

              {/* Source Caption Section */}
              {selectedCapture.caption && (
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-muted-foreground/80" />
                    <span>Original Scraped Caption</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-muted/30 border border-border/60 rounded-xl p-3.5 text-xs text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedCapture.caption}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-border p-4 bg-muted/15 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleReanalyze(selectedCapture.id)}
                disabled={analyzingId === selectedCapture.id}
                className="flex-1 h-10 text-xs font-bold rounded-lg border-border/60 hover:bg-secondary gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${analyzingId === selectedCapture.id ? "animate-spin text-primary" : ""}`} />
                {analyzingId === selectedCapture.id ? "Analyzing with Gemini..." : "Trigger AI Re-Analysis"}
              </Button>
              
              <Button asChild className="flex-1 h-10 text-xs font-bold rounded-lg gap-2">
                <Link href={selectedCapture.canonical_url} target="_blank" rel="noreferrer">
                  Open Original Reel
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
