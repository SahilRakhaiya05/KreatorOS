import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | KreatorOS",
  description: "Core service terms for using KreatorOS creator, brand, and client workspaces.",
};

const sections = [
  ["Use of the product", "KreatorOS is provided for creator business operations, brand collaboration, client delivery, and AI-assisted workflow preparation. You are responsible for the content, offers, client communications, and provider accounts you connect."],
  ["Payments and providers", "Payment, calendar, messaging, and social services may be handled by third-party providers. Their own terms apply when you connect or use those services through KreatorOS."],
  ["Acceptable use", "Do not use KreatorOS for unlawful content, deceptive offers, unauthorized scraping, spam, credential sharing, or activity that violates a connected platform's rules."],
  ["Availability", "We work to keep the service reliable, but features may change as the product improves. Beta or prototype workflows may be updated, paused, or replaced."],
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">KreatorOS</Link>
        <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated May 31, 2026. These terms summarize the operating expectations for KreatorOS users and workspaces.</p>
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
