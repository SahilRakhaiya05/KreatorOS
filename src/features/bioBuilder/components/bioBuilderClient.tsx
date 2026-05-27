"use client";

import { useState } from "react";
import { Calendar, GripVertical, Handshake, Link as LinkIcon, LockKeyhole, Palette, Plus, ShoppingBag, Sparkles, Wand2 } from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { creator as defaultCreator } from "@/shared/mock/data";

type Theme = {
  name: string;
  bg: string;
  button: string;
};

type Creator = {
  name: string;
  handle: string;
  promise: string;
};

type PageBlock = {
  name: string;
  type: string;
  status: string;
  clicks: number;
};

function PreviewBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-[1.25rem] bg-white/92 p-4 text-left shadow-sm ring-1 ring-slate-200 backdrop-blur">
      <span className="flex items-center gap-3">
        <span className="rounded-xl bg-slate-950 p-2 text-white">{icon}</span>
        <span>
          <span className="block text-sm font-black text-slate-950">{title}</span>
          <span className="text-xs leading-5 text-slate-500">{text}</span>
        </span>
      </span>
      <Wand2 className="h-4 w-4 text-violet-600" />
    </button>
  );
}

const defaultTheme = { name: "Askiva Mint", bg: "from-[#d9fbef] via-white to-[#efe7ff]", button: "bg-slate-950" };

export function PublicPreview({ theme = defaultTheme, layout = "Stacked commerce", creator = defaultCreator }: { theme?: Theme; layout?: string; creator?: Creator }) {
  return (
    <Card className="sticky top-24 overflow-hidden p-3">
      <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-2 shadow-2xl">
        <div className={cn("min-h-[720px] overflow-hidden rounded-[1.5rem] bg-gradient-to-br p-4", theme.bg)}>
          <div className="mb-4 flex items-center justify-between">
            <Badge tone="dark">{layout}</Badge>
            <LinkIcon className="h-4 w-4 text-slate-600" />
          </div>
          <div className="rounded-[1.5rem] bg-white/86 p-5 shadow-soft backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-300" />
              <div>
                <p className="text-xl font-black text-slate-950">{creator.name}</p>
                <p className="text-sm font-semibold text-slate-500">{creator.handle}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{creator.promise}</p>
          </div>
          <div className="mt-4 space-y-3">
            <PreviewBlock icon={<Sparkles className="h-4 w-4" />} title="Ask my AI guide" text="Tell it your goal and it recommends product, call, or membership." />
            <PreviewBlock icon={<Calendar className="h-4 w-4" />} title="Book AI Strategy Call" text="$49 · routed by goal · payment + calendar + reminder" />
            <PreviewBlock icon={<ShoppingBag className="h-4 w-4" />} title="Creator AI Templates" text="$29 · instant access · bundle upsell" />
            <PreviewBlock icon={<LockKeyhole className="h-4 w-4" />} title="Join AI Creator Club" text="$15/mo · gated content · weekly office hours" />
            <PreviewBlock icon={<Handshake className="h-4 w-4" />} title="Brand collaboration" text="Media kit, campaign brief, budget, and booking route" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function BioBuilderClient({ creator, pageBlocks, themes }: { creator: Creator; pageBlocks: PageBlock[]; themes: Theme[] }) {
  const [theme, setTheme] = useState(themes[0]);
  const [layout, setLayout] = useState("Stacked commerce");

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-slate-950">Brand theme</p>
              <p className="text-sm text-slate-500">Askiva-like calm cards, soft gradients, generous spacing.</p>
            </div>
            <Badge tone="violet">AI-customizable</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {themes.map((item) => (
              <button
                key={item.name}
                onClick={() => setTheme(item)}
                className={cn(
                  "rounded-[1.25rem] border p-3 text-left transition",
                  theme.name === item.name ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className={cn("mb-3 h-20 rounded-2xl bg-gradient-to-br", item.bg)} />
                <p className="text-sm font-black">{item.name}</p>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-slate-950">Page layout mode</p>
              <p className="text-sm text-slate-500">The creator chooses what the page should become.</p>
            </div>
            <Palette className="h-5 w-5 text-violet-600" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              "Stacked commerce",
              "Calendar-first",
              "Storefront",
              "Membership hub",
              "Brand media kit",
              "AI concierge"
            ].map((item) => (
              <button
                key={item}
                onClick={() => setLayout(item)}
                className={cn(
                  "rounded-2xl p-4 text-left text-sm font-black ring-1",
                  layout === item ? "bg-slate-950 text-white ring-slate-950" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-black text-slate-950">Dynamic blocks</p>
              <p className="text-sm text-slate-500">Not static links: every block can have checkout, routing, gating, automations, and analytics.</p>
            </div>
            <button className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white">
              <Plus className="mr-2 inline h-4 w-4" />
              Add
            </button>
          </div>
          <div className="space-y-3">
            {pageBlocks.map((block) => (
              <div key={block.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-black text-slate-950">{block.name}</p>
                    <p className="text-sm text-slate-500">
                      {block.type} · {block.clicks} clicks · automation enabled
                    </p>
                  </div>
                </div>
                <Badge tone={block.status === "Live" ? "green" : "amber"}>{block.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <PublicPreview theme={theme} layout={layout} creator={creator} />
    </div>
  );
}