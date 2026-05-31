"use client";

import { type CSSProperties, useMemo, useState } from "react";

type BillingInterval = "monthly" | "annual";

const nav = [
  ["Product", "#product"],
  ["Workflows", "#workflows"],
  ["Pricing", "#pricing"],
  ["Contact", "#contact"],
] as const;

const marqueeItems = [
  "Smart Link",
  "Store",
  "Bookings",
  "Brand CRM",
  "Client portal",
  "Short links",
  "Stripe checkout",
  "AI operator",
] as const;

const workspaces = [
  {
    title: "Creator workspace",
    text: "Products, bookings, calendar, members, custom pages, and revenue in one calm command center.",
    items: ["Live page", "48 slots", "$12.4k tracked"],
  },
  {
    title: "Brand workspace",
    text: "Brands publish programs, discover creators, review applications, chat, and manage payouts.",
    items: ["Creator fit", "Campaign rooms", "Payments"],
  },
  {
    title: "Client portal",
    text: "Customers get a clean place to access sessions, downloads, memberships, and support.",
    items: ["Access", "Files", "Follow-ups"],
  },
] as const;

const workflows = [
  ["Build", "Create a Smart Link, product, booking page, and custom short link without touching settings chaos."],
  ["Sell", "Stripe checkout handles paid products, sessions, subscriptions, and brand campaign payments."],
  ["Manage", "See bookings, customers, messages, applications, client access, and delivery status together."],
  ["Grow", "Use AI to draft offers, find creator-brand fit, write follow-ups, and prepare next actions."],
] as const;

const proofStats = [
  ["Launch surface", "Bio, shop, bookings, and contact in one page"],
  ["Revenue flow", "Products, sessions, subscriptions, and Stripe checkout"],
  ["Relationship layer", "Brand CRM, client portal, messages, and delivery status"],
  ["Operator help", "Offer drafts, follow-ups, creator fit, and task suggestions"],
] as const;

const faqItems = [
  [
    "What is KreatorOS?",
    "KreatorOS is a business workspace for creators. It connects your public page, products, bookings, brand CRM, clients, subscriptions, and AI help in one dashboard.",
  ],
  [
    "Can I start free?",
    "Yes. The free plan is for launching your Smart Link, products, bookings, short links, and basic CRM. Pro is $20 per month when you want the full operating system.",
  ],
  [
    "Does checkout use Stripe?",
    "Yes. Paid plans, products, bookings, and campaign payments route through Stripe checkout and subscription settings inside the app.",
  ],
  [
    "Is the public page customizable?",
    "Yes. You can style the Smart Link page, add products, social links, bookings, gallery sections, custom background themes, and custom short-link campaigns.",
  ],
  [
    "How does Brand CRM work?",
    "Brands can publish programs and find creators. Creators apply with proper details, both sides can chat, and campaign payments or payouts stay attached to the collaboration.",
  ],
  [
    "Do I need multiple tools?",
    "No. KreatorOS is designed to replace the messy stack of bio tool, product checkout, booking link, CRM sheet, and client delivery folder.",
  ],
] as const;

const plans = [
  {
    name: "Free",
    price: 0,
    annual: 0,
    href: "/api/billing/checkout?plan=free",
    cta: "Start free",
    text: "Launch a clean public page and start selling.",
    featured: false,
    features: ["Smart Link", "Products", "Bookings", "Short links", "Basic CRM"],
  },
  {
    name: "Pro",
    price: 20,
    annual: 16,
    href: "/api/billing/checkout?plan=pro",
    cta: "Start Pro",
    text: "The full creator business operating system.",
    featured: true,
    features: ["AI operator", "Custom themes", "Brand CRM", "Stripe checkout", "Subscription settings"],
  },
  {
    name: "Business",
    price: 99,
    annual: 79,
    href: "mailto:hello@kreatoros.com?subject=KreatorOS%20business%20workspace",
    cta: "Contact us",
    text: "For brands, client work, and creator teams.",
    featured: false,
    features: ["Brand workspace", "Creator discovery", "Campaign rooms", "Team setup", "Priority help"],
  },
] as const;

function Logo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span className="logo-core" />
      <span className="logo-spark" />
    </span>
  );
}

function LaptopPreview() {
  return (
    <div className="laptop" aria-hidden="true">
      <div className="laptop-screen">
        <div className="topbar">
          <div className="dots">
            <span />
            <span />
            <span />
          </div>
          <strong>KreatorOS Smart Link</strong>
          <span>Live</span>
        </div>
        <div className="desktop-grid">
          <aside className="app-rail">
            {["Command", "Smart Link", "Products", "Calendar", "Brand CRM"].map((item, index) => (
              <span key={item} className={index === 0 ? "active" : undefined}>
                {item}
              </span>
            ))}
          </aside>
          <section className="command-panel">
            <div className="dashboard-hero">
              <div>
                <small>CreatorOS Link Commerce</small>
                <h3>Manage Your Smart Link</h3>
                <p>Products, bookings, social links, referrals, AI assistant, analytics, and public shop.</p>
              </div>
              <span>Publish</span>
            </div>
            <div className="metric-row">
              <article>
                <small>Setup checklist</small>
                <b>88%</b>
                <span className="progress"><i /></span>
              </article>
              <article>
                <small>Revenue</small>
                <b>$12,480</b>
                <span className="progress"><i /></span>
              </article>
              <article>
                <small>Bookings</small>
                <b>48</b>
                <span>open slots</span>
              </article>
            </div>
            <div className="studio-grid">
              <div className="social-card">
                <small>Social media links</small>
                <div>
                  <span>IG</span>
                  <span>YT</span>
                  <span>TK</span>
                </div>
              </div>
              <div className="preview-card">
                <small>Live page</small>
                <b>AI Prompt Pack</b>
                <span>$29</span>
              </div>
              <div className="preview-card muted">
                <small>Book a 1:1 Session</small>
                <b>1-on-1 AI Consultation</b>
                <span>$199</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="laptop-base" />
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="phone" aria-hidden="true">
      <span className="notch" />
      <div className="phone-actions">
        <span />
        <span />
      </div>
      <div className="profile-orb">SR</div>
      <h3>Sahil Studio</h3>
      <p>Products, sessions, and tools in one custom page.</p>
      <div className="phone-product">
        <small>Featured product</small>
        <b>AI Prompt Pack</b>
        <span>$29</span>
      </div>
      <div className="phone-booking">
        <small>Book a 1:1 Session</small>
        <b>Today 4:30 PM</b>
      </div>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="hero-scene" aria-label="KreatorOS product preview with laptop and mobile page">
      <div className="scene-grid" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="hill hill-back" />
      <div className="hill hill-front" />
      <div className="track" />
      <div className="float-card saved">
        <small>Setup ready</small>
        <b>26h</b>
        <span>saved this month</span>
      </div>
      <div className="float-card checkout">
        <small>Checkout ready</small>
        <b>Stripe session</b>
      </div>
      <LaptopPreview />
      <PhonePreview />
    </div>
  );
}

function ProductShowcase() {
  return (
    <div className="product-showcase" aria-label="Product workspace preview">
      <div className="showcase-header">
        <Logo />
        <span>Live workspace</span>
        <b>All systems connected</b>
      </div>
      <div className="showcase-grid">
        <div className="showcase-main">
          <small>Smart Link</small>
          <h3>One public page for everything you sell.</h3>
          <div className="link-stack">
            <span>AI Prompt Pack <b>$29</b></span>
            <span>1:1 Session <b>$199</b></span>
            <span>Member tools <b>Live</b></span>
          </div>
        </div>
        <div className="showcase-side">
          <small>Brand CRM</small>
          <span>Application submitted</span>
          <span>Chat room open</span>
          <span>Payout attached</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const [billing, setBilling] = useState<BillingInterval>("monthly");
  const visiblePlans = useMemo(
    () => plans.map((plan) => ({ ...plan, shownPrice: billing === "annual" ? plan.annual : plan.price })),
    [billing],
  );

  return (
    <main className="landing">
      <header className="site-nav">
        <a className="brand" href="#top" aria-label="KreatorOS home">
          <Logo />
          <b>KreatorOS</b>
        </a>
        <nav>
          {nav.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href="/login">Login</a>
          <a className="nav-cta" href="/api/billing/checkout?plan=free">
            Start free
          </a>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Creator business operating system</span>
          <h1>
            Run your creator business on the <em>right track.</em>
          </h1>
          <p>
            One modern workspace for your bio page, store, paid calls, calendar, brand deals, client access, and Stripe checkout.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/api/billing/checkout?plan=free">
              Start free
            </a>
            <a className="button secondary" href="#product">
              See product
            </a>
          </div>
        </div>
        <HeroScene />
        <div className="below-hero-actions">
          <span>Already have a workspace?</span>
          <a href="/login?next=/creator">Open dashboard</a>
        </div>
      </section>

      <section className="marquee" aria-label="KreatorOS connected features">
        <div>
          {marqueeItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div>
          {marqueeItems.map((item) => (
            <span key={`${item}-repeat`}>{item}</span>
          ))}
        </div>
      </section>

      <section id="product" className="product-section">
        <div className="section-copy">
          <span className="eyebrow dark">The product</span>
          <h2>Your link-in-bio becomes the front door to a real business.</h2>
          <p>
            Visitors can buy, book, apply, message, and access what they paid for. You manage the whole journey from one dashboard.
          </p>
        </div>
        <ProductShowcase />
      </section>

      <section className="workspace-section">
        {workspaces.map((workspace, index) => (
          <article key={workspace.title} style={{ "--delay": `${index * 90}ms` } as CSSProperties}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{workspace.title}</h3>
            <p>{workspace.text}</p>
            <div>
              {workspace.items.map((item) => (
                <b key={item}>{item}</b>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="proof-section">
        <div className="section-copy centered">
          <span className="eyebrow dark">Built for the real workflow</span>
          <h2>From first click to paid delivery, every step has a place.</h2>
        </div>
        <div className="proof-grid">
          {proofStats.map(([title, text], index) => (
            <article key={title} style={{ "--delay": `${index * 70}ms` } as CSSProperties}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflows" className="workflow-section">
        <div className="workflow-copy">
          <span className="eyebrow">Workflows</span>
          <h2>Everything after the audience clicks, already connected.</h2>
        </div>
        <div className="workflow-grid">
          {workflows.map(([title, text], index) => (
            <article key={title} style={{ "--i": index } as CSSProperties}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-copy centered">
          <span className="eyebrow dark">Pricing</span>
          <h2>Free to start. $20 when you are ready to run it seriously.</h2>
          <p>Choose a plan, authenticate, pay through Stripe, and manage the subscription inside settings.</p>
          <div className="billing-toggle" aria-label="Billing interval">
            <button className={billing === "monthly" ? "active" : undefined} type="button" onClick={() => setBilling("monthly")}>
              Monthly
            </button>
            <button className={billing === "annual" ? "active" : undefined} type="button" onClick={() => setBilling("annual")}>
              Annual
            </button>
          </div>
        </div>
        <div className="plan-grid">
          {visiblePlans.map((plan) => (
            <article key={plan.name} className={plan.featured ? "plan featured" : "plan"}>
              {plan.featured ? <span className="plan-badge">Popular</span> : null}
              <h3>{plan.name}</h3>
              <p>{plan.text}</p>
              <div className="price">
                <b>{plan.shownPrice === 0 ? "Free" : `$${plan.shownPrice}`}</b>
                {plan.shownPrice > 0 ? <span>/mo</span> : null}
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a className={plan.featured ? "button primary" : "button secondary"} href={plan.href}>
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section">
        <div className="section-copy centered">
          <span className="eyebrow dark">FAQ</span>
          <h2>Everything you need to know before launching.</h2>
        </div>
        <div className="faq-list">
          {faqItems.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="final-cta">
        <span className="eyebrow">Ready</span>
        <h2>Give your audience one polished place to buy, book, message, and come back.</h2>
        <div className="hero-actions">
          <a className="button primary" href="/api/billing/checkout?plan=free">
            Start free
          </a>
          <a className="button secondary invert" href="mailto:hello@kreatoros.com?subject=KreatorOS%20setup">
            Contact us
          </a>
        </div>
      </section>

      <style jsx>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        .landing {
          --ink: #101116;
          --paper: #fbfff2;
          --muted: #646b73;
          --line: rgba(16, 17, 22, 0.12);
          --blue: #4f6dff;
          --acid: #b9ff3f;
          --sea: #bff3ea;
          min-height: 100vh;
          color: var(--ink);
          background:
            radial-gradient(circle at 10% 6%, rgba(191, 243, 234, 0.85), transparent 30%),
            radial-gradient(circle at 88% 4%, rgba(255, 244, 175, 0.7), transparent 28%),
            linear-gradient(180deg, #fafff3 0%, #eefad8 46%, #fbfff6 100%);
          overflow-x: hidden;
        }

        .site-nav {
          position: sticky;
          top: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1240px;
          margin: 0 auto;
          padding: 18px 24px;
          backdrop-filter: blur(18px);
        }

        .brand,
        .site-nav nav,
        .nav-actions,
        .hero-actions,
        .topbar,
        .showcase-header,
        .billing-toggle,
        .marquee {
          display: flex;
          align-items: center;
        }

        .brand {
          gap: 10px;
          color: var(--ink);
          text-decoration: none;
          font-size: 18px;
          letter-spacing: -0.04em;
        }

        .logo-mark {
          position: relative;
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: var(--ink);
          box-shadow: 0 16px 32px rgba(16, 17, 22, 0.18);
        }

        .logo-core {
          width: 17px;
          height: 17px;
          border-radius: 5px;
          background: var(--acid);
          transform: rotate(16deg);
        }

        .logo-spark {
          position: absolute;
          width: 10px;
          height: 25px;
          border-radius: 999px;
          background: white;
          transform: translate(7px, -3px) rotate(-36deg);
        }

        .site-nav nav {
          gap: 26px;
        }

        .site-nav a {
          color: rgba(16, 17, 22, 0.65);
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
        }

        .site-nav a:hover {
          color: var(--ink);
        }

        .nav-actions {
          gap: 12px;
        }

        .nav-cta {
          border-radius: 999px;
          padding: 10px 16px;
          color: var(--ink) !important;
          background: var(--acid);
          box-shadow: 0 14px 34px rgba(107, 148, 14, 0.22);
        }

        .hero {
          max-width: 1240px;
          margin: 0 auto;
          padding: 28px 24px 64px;
        }

        .hero-copy {
          position: relative;
          z-index: 4;
          max-width: 980px;
          margin: 0 auto 36px;
          text-align: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 13px;
          color: #5c7019;
          background: rgba(255, 255, 255, 0.78);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .eyebrow.dark {
          color: #40500e;
          background: rgba(16, 17, 22, 0.06);
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          margin-top: 20px;
          font-size: clamp(62px, 9.2vw, 136px);
          line-height: 0.78;
          letter-spacing: -0.095em;
          text-wrap: balance;
        }

        h1 em {
          color: var(--blue);
          font-style: normal;
          text-shadow: 0 16px 34px rgba(79, 109, 255, 0.22);
        }

        .hero-copy p {
          max-width: 760px;
          margin: 24px auto 0;
          color: rgba(16, 17, 22, 0.72);
          font-size: clamp(18px, 2vw, 24px);
          font-weight: 850;
          line-height: 1.38;
        }

        .hero-actions {
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 0 23px;
          overflow: hidden;
          text-decoration: none;
          font-size: 14px;
          font-weight: 950;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .button:hover {
          transform: translateY(-2px);
        }

        .button.primary {
          color: white;
          background: var(--ink);
          box-shadow: 0 22px 46px rgba(16, 17, 22, 0.24);
        }

        .button.primary::after {
          content: "";
          position: absolute;
          inset: -60% auto -60% -55%;
          width: 42%;
          transform: rotate(22deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent);
          animation: shine 3.5s ease-in-out infinite;
        }

        .button.secondary {
          color: var(--ink);
          border-color: var(--line);
          background: rgba(255, 255, 255, 0.82);
        }

        .button.bare {
          color: rgba(16, 17, 22, 0.7);
          background: rgba(255, 255, 255, 0.28);
        }

        .hero-scene {
          position: relative;
          min-height: 690px;
          overflow: hidden;
          border: 1px solid rgba(16, 17, 22, 0.08);
          border-radius: 50px;
          background: linear-gradient(180deg, #ebfbff 0%, #f7f7d2 47%, #bce973 48%, #7fc74c 100%);
          box-shadow: 0 36px 90px rgba(66, 92, 42, 0.24);
          isolation: isolate;
        }

        .scene-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(16, 17, 22, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 17, 22, 0.04) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(to bottom, black, transparent 82%);
        }

        .cloud {
          position: absolute;
          height: 38px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.78);
          animation: drift 12s linear infinite;
        }

        .cloud-one {
          top: 265px;
          left: 115px;
          width: 150px;
        }

        .cloud-two {
          top: 252px;
          right: 150px;
          width: 190px;
          animation-delay: -5s;
        }

        .hill {
          position: absolute;
          right: -9%;
          left: -9%;
          bottom: 0;
          height: 250px;
          border-radius: 50% 50% 0 0;
        }

        .hill-back {
          bottom: 22px;
          background: #ade061;
          transform: rotate(-4deg);
        }

        .hill-front {
          bottom: -85px;
          background: #86ca4a;
          transform: rotate(5deg);
        }

        .track {
          position: absolute;
          bottom: -78px;
          left: 36%;
          width: 280px;
          height: 360px;
          background: linear-gradient(180deg, rgba(249, 240, 183, 0.85), rgba(84, 105, 48, 0.36));
          clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%);
        }

        .laptop {
          position: absolute;
          z-index: 3;
          bottom: 38px;
          left: 50%;
          width: min(790px, 68vw);
          transform: translateX(-58%);
          animation: laptopFloat 5.8s ease-in-out infinite;
        }

        .laptop-screen {
          overflow: hidden;
          border: 16px solid #15161d;
          border-radius: 22px 22px 9px 9px;
          background: #f8faf7;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18), 0 28px 60px rgba(16, 17, 22, 0.28);
        }

        .topbar {
          justify-content: space-between;
          height: 34px;
          border-bottom: 1px solid rgba(16, 17, 22, 0.08);
          padding: 0 16px;
          color: #626a73;
          font-size: 12px;
        }

        .dots {
          display: flex;
          gap: 6px;
        }

        .dots span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #d0d6dc;
        }

        .desktop-grid {
          display: grid;
          grid-template-columns: 150px 1fr;
          min-height: 372px;
        }

        .app-rail {
          display: grid;
          align-content: start;
          gap: 14px;
          border-right: 1px solid rgba(16, 17, 22, 0.08);
          padding: 28px 20px;
          background: #f2f5f8;
        }

        .app-rail span {
          color: #727b86;
          font-size: 13px;
          font-weight: 950;
        }

        .app-rail .active {
          margin-left: -10px;
          border-radius: 13px;
          padding: 10px;
          color: var(--blue);
          background: rgba(79, 109, 255, 0.12);
        }

        .command-panel {
          padding: 28px;
        }

        .operator-card,
        .dashboard-hero {
          display: flex;
          align-items: center;
          gap: 14px;
          border-radius: 27px;
          padding: 20px;
          color: white;
          background: #17191f;
          box-shadow: 0 18px 34px rgba(16, 17, 22, 0.16);
        }

        .operator-icon {
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border-radius: 17px;
          color: var(--ink);
          background: var(--acid);
          font-weight: 950;
        }

        .operator-card small {
          color: rgba(255, 255, 255, 0.48);
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .operator-card p {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 850;
          line-height: 1.4;
        }

        .dashboard-hero {
          justify-content: space-between;
          color: var(--ink);
          background: white;
        }

        .dashboard-hero small {
          display: inline-flex;
          border-radius: 999px;
          padding: 6px 10px;
          color: #5b5f64;
          background: #f0f0ef;
          font-size: 11px;
          font-weight: 950;
        }

        .dashboard-hero h3 {
          margin-top: 10px;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .dashboard-hero p {
          max-width: 390px;
          margin-top: 8px;
          color: #6b706b;
          font-size: 13px;
          font-weight: 850;
          line-height: 1.35;
        }

        .dashboard-hero > span {
          border-radius: 16px;
          padding: 13px 18px;
          color: white;
          background: #211f1d;
          font-size: 13px;
          font-weight: 950;
          box-shadow: 0 16px 28px rgba(16, 17, 22, 0.16);
        }

        .metric-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 18px;
        }

        .metric-row article,
        .task-stack span {
          border-radius: 24px;
          background: white;
          box-shadow: 0 12px 30px rgba(16, 17, 22, 0.06);
        }

        .metric-row article {
          padding: 22px;
        }

        .metric-row small {
          color: #78816f;
          font-weight: 900;
        }

        .metric-row b {
          display: block;
          margin-top: 8px;
          font-size: 31px;
          letter-spacing: -0.08em;
        }

        .metric-row article:nth-child(3) > span {
          color: var(--muted);
          font-size: 12px;
          font-weight: 900;
        }

        .progress {
          display: block;
          height: 13px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9edf0;
        }

        .progress i {
          display: block;
          width: 82%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #4f6dff, #91a6ff);
        }

        .task-stack,
        .studio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
        }

        .task-stack span {
          padding: 15px;
          color: #39414b;
          font-size: 12px;
          font-weight: 950;
        }

        .social-card,
        .preview-card {
          min-height: 92px;
          border-radius: 24px;
          padding: 16px;
          background: white;
          box-shadow: 0 12px 30px rgba(16, 17, 22, 0.06);
        }

        .social-card small,
        .preview-card small {
          color: #747d74;
          font-size: 11px;
          font-weight: 950;
        }

        .social-card div {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .social-card span {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 13px;
          color: white;
          background: #22252c;
          font-size: 11px;
          font-weight: 950;
        }

        .preview-card b {
          display: block;
          margin-top: 12px;
          font-size: 14px;
          letter-spacing: -0.03em;
        }

        .preview-card span {
          display: inline-flex;
          margin-top: 8px;
          border-radius: 999px;
          padding: 6px 9px;
          color: #0b4f2d;
          background: #c9f7df;
          font-size: 11px;
          font-weight: 950;
        }

        .preview-card.muted {
          background: #eefaf7;
        }

        .laptop-base {
          width: 86%;
          height: 22px;
          margin: -2px auto 0;
          border-radius: 0 0 28px 28px;
          background: #111219;
          box-shadow: 0 14px 24px rgba(16, 17, 22, 0.26);
        }

        .phone {
          position: absolute;
          right: 16%;
          bottom: 82px;
          z-index: 4;
          width: 185px;
          min-height: 342px;
          border: 12px solid #14151b;
          border-radius: 42px;
          padding: 18px 13px;
          background: #fbfff7;
          box-shadow: 0 30px 55px rgba(16, 17, 22, 0.28);
          animation: phoneFloat 5.5s ease-in-out infinite;
        }

        .notch {
          position: absolute;
          top: 9px;
          left: 50%;
          width: 66px;
          height: 18px;
          border-radius: 999px;
          background: #08090c;
          transform: translateX(-50%);
        }

        .phone-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }

        .phone-actions span {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #eef3eb;
        }

        .profile-orb {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          margin-top: 18px;
          border-radius: 16px;
          color: white;
          background: #262a34;
          font-weight: 950;
        }

        .phone h3 {
          margin-top: 8px;
          font-size: 20px;
          letter-spacing: -0.05em;
        }

        .phone p {
          margin-top: 4px;
          color: #687060;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.32;
        }

        .phone-product,
        .phone-booking {
          margin-top: 13px;
          border-radius: 18px;
          padding: 13px;
        }

        .phone-product {
          color: white;
          background: #111219;
        }

        .phone-booking {
          color: var(--ink);
          background: #edf4e8;
        }

        .phone small {
          color: #9ca69c;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .phone b {
          display: block;
          margin-top: 5px;
          font-size: 14px;
        }

        .phone-product span {
          display: inline-flex;
          margin-top: 9px;
          border-radius: 999px;
          padding: 7px 12px;
          color: var(--ink);
          background: var(--acid);
          font-size: 11px;
          font-weight: 950;
        }

        .float-card {
          position: absolute;
          z-index: 4;
          display: grid;
          gap: 5px;
          border: 1px solid rgba(16, 17, 22, 0.08);
          border-radius: 26px;
          padding: 22px;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 24px 46px rgba(16, 17, 22, 0.14);
          animation: cardFloat 6s ease-in-out infinite;
        }

        .float-card small {
          color: #6a735f;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .float-card b {
          font-size: 34px;
          letter-spacing: -0.07em;
        }

        .float-card span {
          color: #5e6656;
          font-size: 13px;
          font-weight: 900;
        }

        .saved {
          bottom: 150px;
          left: 90px;
        }

        .checkout {
          right: 92px;
          bottom: 180px;
          max-width: 230px;
          animation-direction: reverse;
        }

        .checkout b {
          font-size: 15px;
          letter-spacing: -0.02em;
        }

        .below-hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 18px;
          color: rgba(16, 17, 22, 0.58);
          font-size: 14px;
          font-weight: 850;
        }

        .below-hero-actions a {
          color: var(--ink);
          text-decoration: none;
          font-weight: 950;
        }

        .below-hero-actions a::after {
          content: "";
          display: inline-block;
          width: 7px;
          height: 7px;
          margin-left: 8px;
          border-top: 2px solid currentColor;
          border-right: 2px solid currentColor;
          transform: rotate(45deg);
        }

        .marquee {
          gap: 28px;
          overflow: hidden;
          border-block: 1px solid rgba(16, 17, 22, 0.08);
          padding: 22px 0;
          color: rgba(16, 17, 22, 0.24);
          background: rgba(255, 255, 255, 0.38);
          font-size: clamp(34px, 5vw, 76px);
          font-weight: 950;
          letter-spacing: -0.08em;
          white-space: nowrap;
        }

        .marquee div {
          display: flex;
          gap: 28px;
          animation: marquee 22s linear infinite;
        }

        .marquee span::after {
          content: "";
          display: inline-block;
          width: 22px;
          height: 22px;
          margin-left: 28px;
          background: var(--acid);
          clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
        }

        .product-section,
        .workspace-section,
        .proof-section,
        .workflow-section,
        .pricing-section,
        .faq-section,
        .final-cta {
          max-width: 1160px;
          margin: 0 auto;
          padding: 96px 24px;
        }

        .product-section {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 36px;
          align-items: center;
        }

        .section-copy h2,
        .workflow-copy h2,
        .final-cta h2 {
          margin-top: 14px;
          font-size: clamp(42px, 6vw, 80px);
          line-height: 0.9;
          letter-spacing: -0.09em;
          text-wrap: balance;
        }

        .section-copy p,
        .workflow-copy p {
          margin-top: 18px;
          color: var(--muted);
          font-size: 18px;
          font-weight: 800;
          line-height: 1.55;
        }

        .centered {
          max-width: 820px;
          margin: 0 auto;
          text-align: center;
        }

        .product-showcase {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 38px;
          padding: 22px;
          color: white;
          background:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            #111219;
          background-size: 40px 40px;
          box-shadow: 0 28px 70px rgba(16, 17, 22, 0.2);
        }

        .showcase-header {
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
          font-weight: 900;
        }

        .showcase-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 14px;
          margin-top: 18px;
        }

        .showcase-main,
        .showcase-side {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.08);
        }

        .showcase-main h3 {
          margin-top: 10px;
          font-size: 36px;
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .link-stack,
        .showcase-side {
          display: grid;
          gap: 10px;
        }

        .link-stack {
          margin-top: 24px;
        }

        .link-stack span,
        .showcase-side span {
          display: flex;
          justify-content: space-between;
          border-radius: 17px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 13px;
          font-weight: 900;
        }

        .link-stack b {
          color: var(--acid);
        }

        .workspace-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-top: 28px;
        }

        .workspace-section article,
        .plan {
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.74);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 22px 50px rgba(62, 88, 43, 0.08);
        }

        .workspace-section article {
          min-height: 300px;
          border-radius: 34px;
          padding: 26px;
          animation: reveal 0.7s both;
          animation-delay: var(--delay);
        }

        .workspace-section article > span {
          color: var(--blue);
          font-weight: 950;
        }

        .workspace-section h3 {
          margin-top: 54px;
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .workspace-section p {
          margin-top: 12px;
          color: var(--muted);
          font-weight: 790;
          line-height: 1.55;
        }

        .workspace-section article div {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .workspace-section b {
          border-radius: 999px;
          padding: 8px 10px;
          background: rgba(79, 109, 255, 0.1);
          color: #3147c9;
          font-size: 12px;
        }

        .proof-section {
          padding-top: 52px;
        }

        .proof-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 34px;
        }

        .proof-grid article {
          min-height: 230px;
          border: 1px solid var(--line);
          border-radius: 30px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.74);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 22px 50px rgba(62, 88, 43, 0.08);
          animation: reveal 0.7s both;
          animation-delay: var(--delay);
        }

        .proof-grid small {
          color: var(--blue);
          font-weight: 950;
        }

        .proof-grid h3 {
          margin-top: 44px;
          font-size: 25px;
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .proof-grid p {
          margin-top: 12px;
          color: var(--muted);
          font-weight: 790;
          line-height: 1.5;
        }

        .workflow-section {
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: 28px;
          align-items: center;
          border-radius: 44px;
          color: white;
          background:
            radial-gradient(circle at 80% 20%, rgba(185, 255, 63, 0.22), transparent 30%),
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            #111219;
          background-size: auto, 44px 44px, 44px 44px, auto;
          box-shadow: 0 32px 80px rgba(16, 17, 22, 0.22);
        }

        .workflow-section .eyebrow {
          color: var(--acid);
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
        }

        .workflow-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .workflow-grid article {
          min-height: 220px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 26px;
          padding: 22px;
          background: rgba(255, 255, 255, 0.08);
          animation: popIn 0.75s both;
          animation-delay: calc(var(--i) * 80ms);
        }

        .workflow-grid small {
          color: var(--acid);
          font-weight: 950;
        }

        .workflow-grid h3 {
          margin-top: 42px;
          font-size: 30px;
          letter-spacing: -0.06em;
        }

        .workflow-grid p {
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.64);
          font-weight: 760;
          line-height: 1.55;
        }

        .pricing-section {
          padding-top: 110px;
        }

        .billing-toggle {
          width: fit-content;
          margin: 24px auto 0;
          border-radius: 999px;
          padding: 6px;
          background: rgba(16, 17, 22, 0.08);
        }

        .billing-toggle button {
          border: 0;
          border-radius: 999px;
          padding: 11px 17px;
          color: var(--muted);
          background: transparent;
          font-weight: 950;
          cursor: pointer;
        }

        .billing-toggle .active {
          color: var(--ink);
          background: white;
          box-shadow: 0 10px 26px rgba(16, 17, 22, 0.1);
        }

        .plan-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 36px;
        }

        .plan {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 520px;
          border-radius: 34px;
          padding: 30px;
        }

        .plan.featured {
          transform: translateY(-12px);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(185, 255, 63, 0.38));
        }

        .plan-badge {
          position: absolute;
          top: 22px;
          right: 22px;
          border-radius: 999px;
          padding: 7px 10px;
          color: white;
          background: var(--ink);
          font-size: 11px;
          font-weight: 950;
        }

        .plan h3 {
          font-size: 34px;
          letter-spacing: -0.07em;
        }

        .plan > p {
          margin-top: 8px;
          color: var(--muted);
          font-weight: 800;
        }

        .price {
          display: flex;
          align-items: end;
          gap: 8px;
          margin-top: 22px;
        }

        .price b {
          font-size: 58px;
          letter-spacing: -0.09em;
        }

        .price span {
          padding-bottom: 10px;
          color: var(--muted);
          font-weight: 900;
        }

        .plan ul {
          display: grid;
          gap: 12px;
          margin: 28px 0;
          padding: 0;
          list-style: none;
        }

        .plan li {
          color: #3f4550;
          font-size: 14px;
          font-weight: 850;
        }

        .plan li::before {
          content: "";
          display: inline-block;
          width: 10px;
          height: 10px;
          margin-right: 9px;
          border-radius: 50%;
          background: var(--blue);
        }

        .plan .button {
          margin-top: auto;
        }

        .faq-section {
          padding-top: 42px;
        }

        .faq-list {
          display: grid;
          max-width: 920px;
          margin: 34px auto 0;
          gap: 12px;
        }

        .faq-list details {
          border: 1px solid var(--line);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.76);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 16px 38px rgba(62, 88, 43, 0.07);
        }

        .faq-list summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px;
          color: var(--ink);
          cursor: pointer;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.03em;
          list-style: none;
        }

        .faq-list summary::-webkit-details-marker {
          display: none;
        }

        .faq-list summary::after {
          content: "+";
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(16, 17, 22, 0.06);
          font-size: 22px;
          line-height: 1;
        }

        .faq-list details[open] summary::after {
          content: "-";
          color: white;
          background: var(--ink);
        }

        .faq-list p {
          margin: 0;
          padding: 0 24px 24px;
          color: var(--muted);
          font-size: 16px;
          font-weight: 760;
          line-height: 1.55;
        }

        .final-cta {
          margin-bottom: 72px;
          border-radius: 44px;
          text-align: center;
          color: white;
          background: linear-gradient(135deg, #111219, #20243a);
          box-shadow: 0 32px 80px rgba(16, 17, 22, 0.22);
        }

        .final-cta .eyebrow {
          color: var(--acid);
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
        }

        .final-cta h2 {
          max-width: 860px;
          margin-inline: auto;
        }

        .invert {
          color: white !important;
          border-color: rgba(255, 255, 255, 0.18) !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }

        @keyframes laptopFloat {
          0%,
          100% {
            transform: translateX(-58%) translateY(0);
          }
          50% {
            transform: translateX(-58%) translateY(-14px);
          }
        }

        @keyframes phoneFloat {
          0%,
          100% {
            transform: translateY(0) rotate(2deg);
          }
          50% {
            transform: translateY(-12px) rotate(-1deg);
          }
        }

        @keyframes cardFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes drift {
          0%,
          100% {
            transform: translateX(-12px);
          }
          50% {
            transform: translateX(28px);
          }
        }

        @keyframes marquee {
          to {
            transform: translateX(calc(-100% - 28px));
          }
        }

        @keyframes shine {
          0%,
          30% {
            left: -55%;
          }
          62%,
          100% {
            left: 115%;
          }
        }

        @keyframes reveal {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1050px) {
          .site-nav nav {
            display: none;
          }

          .product-section,
          .workflow-section {
            grid-template-columns: 1fr;
          }

          .workspace-section,
          .proof-grid,
          .plan-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .showcase-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .site-nav {
            padding: 14px 16px;
          }

          .nav-actions > a:first-child {
            display: none;
          }

          .hero {
            padding: 22px 14px 48px;
          }

          .hero-copy {
            margin-bottom: 28px;
          }

          h1 {
            font-size: clamp(54px, 17vw, 82px);
          }

          .hero-copy p {
            font-size: 17px;
          }

          .hero-scene {
            min-height: 660px;
            border-radius: 32px;
          }

          .laptop {
            left: 46%;
            bottom: 58px;
            width: 660px;
          }

          .phone {
            right: 6%;
            bottom: 104px;
            animation: none;
            transform: scale(0.82);
            transform-origin: bottom right;
          }

          .float-card,
          .cloud,
          .track {
            display: none;
          }

          .button {
            width: 100%;
          }

          .workspace-section,
          .proof-grid,
          .workflow-grid,
          .plan-grid {
            grid-template-columns: 1fr;
          }

          .product-section,
          .workspace-section,
          .proof-section,
          .workflow-section,
          .pricing-section,
          .faq-section,
          .final-cta {
            padding: 64px 16px;
          }

          .plan.featured {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
