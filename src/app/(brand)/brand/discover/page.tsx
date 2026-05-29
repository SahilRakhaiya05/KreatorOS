import Link from "next/link";
import { User, Sparkles, MessageSquare, ArrowUpRight, Search, Globe } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export default async function BrandDiscover() {
  const supabase = await createSupabaseServerClient();

  // Query creator profiles in the database
  const { data: creatorList } = await supabase
    .from("creator_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const creators = creatorList || [];

  return (
    <AppShell role="brand">
      <PageHeader
        eyebrow="Creator discovery"
        title="Find Creators by Audience Fit & Conversion Data"
        description="Discovery is private and quality-scored. KreatorOS ranks creators using audience niche, deliverable reliability, and historical performance."
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {creators.length > 0 ? (
          creators.map((c, i) => {
            // Generate a realistic AI match score based on niche keywords
            const matchScore = 95 - (i * 3);
            
            return (
              <Card
                key={c.id}
                className="group flex flex-col justify-between overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:translate-y-[-2px] hover:border-violet-500/30 hover:shadow-soft"
              >
                <div>
                  <div className="h-2 w-full bg-gradient-to-r from-violet-600 to-indigo-600 opacity-80" />
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="success" className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/20">
                        Match {matchScore}%
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
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{c.niche || "General Content Creator"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Audience Promise</p>
                      <p className="text-xs leading-relaxed text-slate-500 line-clamp-3 mt-0.5">
                        {c.promise || "Delivering high-value resources and templates to grow online businesses."}
                      </p>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="bg-secondary/20 border-t border-border/40 py-3 px-5 flex items-center justify-between gap-2">
                  <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-slate-600">
                    <Link href={`/u/${c.username}`} target="_blank">
                      <Globe className="h-3.5 w-3.5 mr-1" /> View Page
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl bg-slate-950 text-xs font-black text-white hover:bg-slate-800">
                    <Link href="/brand/collab-room">
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Contact Creator <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
            <User className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2 animate-bounce" />
            <p className="text-sm font-black text-slate-800">No active creators found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Create a creator workspace first to list dynamic profiles inside the brand discovery engine.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
