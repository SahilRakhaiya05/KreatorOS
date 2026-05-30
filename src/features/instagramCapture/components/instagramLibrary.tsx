"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Columns3, Film, Grid2X2, Search, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InstagramCaptureRow } from "@/server/instagram/captureService";

type ViewMode = "board" | "table";

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value),
  );
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

export function InstagramLibrary({ captures }: { captures: InstagramCaptureRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [view, setView] = useState<ViewMode>("board");

  const types = useMemo(() => Array.from(new Set(captures.map((capture) => capture.media_type))).sort(), [captures]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return captures.filter((capture) => {
      const matchesType = type === "all" || capture.media_type === type;
      const matchesQuery = !needle || searchableText(capture).includes(needle);
      return matchesType && matchesQuery;
    });
  }, [captures, query, type]);

  const stats = [
    { label: "Saved", value: captures.length },
    { label: "Reels", value: captures.filter((capture) => capture.media_type === "reel").length },
    { label: "Topics", value: new Set(captures.flatMap((capture) => capture.topics)).size },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search hooks, creators, topics, captions..."
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All content</SelectItem>
            {types.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-card p-1">
          <Button
            type="button"
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            aria-label="Board view"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <Table2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {!filtered.length ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Film className="mx-auto h-9 w-9 text-muted-foreground" />
          <p className="mt-3 font-semibold">No Instagram saves found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the Chrome extension on an Instagram reel or post, then it will appear here with Gemini analysis.
          </p>
        </div>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((capture) => (
            <Card key={capture.id} className="overflow-hidden border-border/70">
              {capture.thumbnail_url ? (
                <div className="aspect-[16/10] bg-secondary">
                  <img src={capture.thumbnail_url} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="secondary">{capture.media_type}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(capture.created_at)}</span>
                </div>
                <CardTitle className="line-clamp-2 text-base">{capture.hook || capture.title || "Instagram save"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {capture.summary || capture.caption || "Captured and ready for review."}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {capture.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[11px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {capture.opportunities.length ? (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next use</p>
                    <p className="mt-1 text-sm">{capture.opportunities[0]}</p>
                  </div>
                ) : null}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={capture.canonical_url} target="_blank" rel="noreferrer">
                    Open original <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Database view</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-medium">Save</th>
                  <th className="pb-2 font-medium">Creator</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Tags</th>
                  <th className="pb-2 font-medium">Opportunity</th>
                  <th className="pb-2 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((capture) => (
                  <tr key={capture.id}>
                    <td className="max-w-[260px] py-3 font-medium">
                      <Link href={capture.canonical_url} target="_blank" rel="noreferrer" className="line-clamp-1 hover:underline">
                        {capture.hook || capture.title || capture.canonical_url}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{capture.username ? `@${capture.username}` : "Unknown"}</td>
                    <td className="py-3">
                      <Badge variant="secondary">{capture.media_type}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{capture.tags.slice(0, 3).join(", ") || "None"}</td>
                    <td className="max-w-[260px] py-3 text-muted-foreground">
                      <span className="line-clamp-1">{capture.opportunities[0] || "Review later"}</span>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{formatDate(capture.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
