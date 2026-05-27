import { AppShell } from "@/components/layout/appShell";
import { AIOperator } from "@/features/aiOperator/components/aiOperator";
import { Card, Metric, PageTitle, Badge } from "@/components/ui";
import { stats, products, bookings, brandDeals } from "@/shared/mock/data";
import { Calendar, CheckCircle2, Sparkles, Zap } from "lucide-react";

export default function CreatorCommand() {
  return <AppShell role="creator"><div className="space-y-8"><PageTitle eyebrow="Creator command center" title="Run the whole creator business from one AI-aware workspace." text="The command center shows revenue, bookings, products, brand deals, approval queue, and what the AI operator recommends next." />
  <div className="grid gap-4 md:grid-cols-4">{stats.map(s => <Metric key={s.label} {...s} />)}</div>
  <div className="grid gap-6 xl:grid-cols-[1fr_420px]"><div className="space-y-6"><Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Approval queue</h2><Badge tone="amber">4 actions waiting</Badge></div>{["Publish $19 async audit offer", "Send brand proposal to NotionFlow", "Enable WhatsApp reminder template", "Run customer research interview batch"].map(item => <div key={item} className="flex items-center justify-between border-t border-slate-100 py-4"><p className="font-semibold text-slate-700">{item}</p><button className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white">Approve</button></div>)}</Card><Card className="p-5"><h2 className="font-black">Business graph snapshot</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><Mini title="Products" value={products.length} /><Mini title="Bookings" value={bookings.length} /><Mini title="Brand deals" value={brandDeals.length} /></div></Card></div><AIOperator compact /></div></div></AppShell>;
}
function Mini({ title, value }: { title: string; value: number }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div> }
