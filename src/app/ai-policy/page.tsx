import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Policy | KreatorOS",
  description: "How supervised AI assistance works inside KreatorOS.",
};

const sections = [
  ["Approval-first automation", "KreatorOS AI is designed to draft, summarize, organize, and recommend. Public changes, outbound communication, payments, calendar updates, and sensitive workspace actions should remain reviewable before execution."],
  ["Human accountability", "Users remain responsible for approving messages, offers, claims, deliverables, and business decisions generated or suggested by AI workflows."],
  ["Data boundaries", "AI features should use the minimum workspace context needed for the task. Do not add secrets, private credentials, or unrelated personal data to prompts or saved knowledge."],
  ["Quality control", "AI output can be incomplete or incorrect. Review recommendations before relying on them for client work, brand commitments, pricing, legal decisions, or financial actions."],
];

export default function AiPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">KreatorOS</Link>
        <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">AI Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated May 31, 2026. This policy keeps AI assistance practical, supervised, and clear for creator business work.</p>
        <div className="mt-10 space-y-8">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
