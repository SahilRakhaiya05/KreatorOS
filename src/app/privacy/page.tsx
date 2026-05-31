import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | KreatorOS",
  description: "How KreatorOS handles account, workspace, client, and research data.",
};

const sections = [
  ["What we collect", "KreatorOS may collect account details, workspace settings, creator page content, saved research references, bookings, product records, client portal activity, and provider connection metadata needed to operate the service."],
  ["How we use data", "We use data to authenticate users, run creator and brand workspaces, deliver client portal access, improve product reliability, prepare AI-assisted drafts, and provide support."],
  ["Provider connections", "When you connect services such as payments, calendar, or social research tools, KreatorOS stores only the configuration and records required to provide the requested workflow."],
  ["Control and deletion", "Workspace owners can update or remove business content from inside the product. For account-level deletion or export requests, contact support from the email associated with the workspace."],
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">KreatorOS</Link>
        <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated May 31, 2026. This policy explains the practical data boundaries for the KreatorOS application.</p>
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
