import Link from "next/link";
import { ArrowRight } from "lucide-react";

export { cn } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "violet" | "amber" | "blue" | "rose" | "dark" }) {
  const tones = {
    slate: "bg-stone-100 text-stone-700 ring-stone-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-stone-100 text-stone-700 ring-stone-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-stone-100 text-stone-700 ring-stone-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    dark: "bg-stone-950 text-white ring-stone-900"
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1", tones[tone])}>{children}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,.05),0_18px_45px_rgba(16,24,40,.06)]", className)}>{children}</section>;
}

export function ButtonLink({ href, children, variant = "dark" }: { href: string; children: React.ReactNode; variant?: "dark" | "light" | "violet" }) {
  const variants = {
    dark: "bg-stone-950 text-white hover:bg-stone-800",
    light: "bg-white text-stone-950 ring-1 ring-stone-200 hover:bg-stone-50",
    violet: "bg-emerald-700 text-white hover:bg-emerald-800"
  };
  return <Link href={href} className={cn("inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition", variants[variant])}>{children}<ArrowRight className="h-4 w-4" /></Link>;
}

export function PageTitle({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-sm font-black uppercase tracking-wide text-emerald-700">{eyebrow}</p> : null}
        <h1 className="max-w-5xl text-3xl font-black tracking-tight text-stone-950 md:text-5xl">{title}</h1>
        {text ? <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Metric({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>
      {change ? <p className="mt-3 text-sm font-bold text-emerald-700">{change}</p> : null}
    </Card>
  );
}
