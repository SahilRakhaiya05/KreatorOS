import Link from "next/link";
import { Bell, Search, Sparkles } from "lucide-react";
import { creator, nav } from "@/shared/mock/data";
import { cn } from "@/components/ui";

type Role = "creator" | "brand" | "portal";

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const items = nav[role];
  const title = role === "creator" ? "KreatorOS" : role === "brand" ? "Brand HQ" : "Client Portal";
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 p-4 lg:block">
          <Link href="/" className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="font-black">{title}</p>
              <p className="text-xs font-medium text-slate-500">AI business operator</p>
            </div>
          </Link>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 rounded-[1.5rem] bg-violet-50 p-4 ring-1 ring-violet-100">
            <p className="flex items-center gap-2 text-sm font-black text-violet-900"><Sparkles className="h-4 w-4" /> Suggested by AI</p>
            <p className="mt-2 text-sm leading-6 text-violet-800">Add a $19 intro call and a brand intake route. Both are likely to convert better than one generic CTA.</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative hidden flex-1 md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:bg-white" placeholder="Search or ask the AI operator across customers, bookings, products, brands, workflows..." />
              </div>
              <div className="flex items-center gap-3">
                <Link href="/u/aarav" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Live page</Link>
                <button className="relative rounded-2xl border border-slate-200 bg-white p-2"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" /></button>
                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 sm:flex">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-300" />
                  <div><p className="text-sm font-black">{creator.name}</p><p className="text-xs text-slate-500">{creator.handle}</p></div>
                </div>
              </div>
            </div>
          </header>
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
