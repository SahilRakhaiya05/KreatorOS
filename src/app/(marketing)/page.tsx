"use client";

import { CSSProperties, FormEvent, PointerEvent, useEffect, useMemo, useState } from "react";

type BillingInterval = "monthly" | "annual";
type Tilt = { rx: number; ry: number };

type Feature = {
  eyebrow: string;
  title: string;
  text: string;
  accent: string;
  icon: string;
};

type Plan = {
  name: string;
  eyebrow: string;
  monthly: number;
  annual: number;
  description: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#security" },
];

const features: Feature[] = [
  {
    eyebrow: "Audience store",
    title: "Turn every click into a clean checkout journey.",
    text: "Publish a soft mobile storefront for calls, downloads, memberships, portals, and product drops.",
    accent: "#c9eef3",
    icon: "🛍️",
  },
  {
    eyebrow: "AI operator",
    title: "Draft workflows without losing approval control.",
    text: "Your operator prepares outreach, bookings, upsells, invoices, and follow-ups, then waits for your final click.",
    accent: "#dff3b8",
    icon: "✨",
  },
  {
    eyebrow: "Brand CRM",
    title: "Track sponsor terms, tasks, and payouts together.",
    text: "Keep campaign rooms, deliverables, usage rights, net terms, and payment status in one calm interface.",
    accent: "#f5d5b9",
    icon: "📊",
  },
  {
    eyebrow: "Member access",
    title: "Ship paid portals with secure content rules.",
    text: "Gate templates, courses, files, community rooms, and recurring access from one connected workspace.",
    accent: "#dedaff",
    icon: "🔐",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect your creator surface",
    text: "Link Stripe, calendar, public bio, audience forms, documents, and sponsor intake under one operating layer.",
  },
  {
    n: "02",
    title: "Describe the workflow",
    text: "Ask the operator to launch an offer, schedule calls, organize leads, draft replies, or build a recurring product path.",
  },
  {
    n: "03",
    title: "Approve, launch, repeat",
    text: "Review each generated action before it goes live. No charges, emails, contract syncs, or CRM updates without approval.",
  },
];

const plans: Plan[] = [
  {
    name: "Starter",
    eyebrow: "Start mapping",
    monthly: 0,
    annual: 0,
    description: "For validating your first creator operating system.",
    cta: "Start Free",
    features: [
      "1 public creator page",
      "10 assisted operator runs / month",
      "Basic booking blocks",
      "Stripe checkout setup",
      "Manual CRM pipeline",
    ],
  },
  {
    name: "Creator Pro",
    eyebrow: "Most popular",
    monthly: 39,
    annual: 31,
    description: "For creators ready to monetize traffic and automate admin.",
    cta: "Launch Creator Pro",
    featured: true,
    features: [
      "Unlimited automation maps",
      "500 assisted operator runs / month",
      "Custom domain routing",
      "Brand CRM deal rooms",
      "Member portal permissions",
      "1% platform transaction fee",
    ],
  },
  {
    name: "Studio Suite",
    eyebrow: "Agency scale",
    monthly: 149,
    annual: 119,
    description: "For multi-brand teams and high-volume operator workflows.",
    cta: "Talk to Sales",
    features: [
      "Unlimited assisted runs",
      "Multi-brand workspaces",
      "White-labeled portals",
      "Dedicated operator training",
      "Private database instance",
      "0% platform transaction fee",
    ],
  },
];

const faqs = [
  {
    q: "Is this a direct clone of Grassfeld?",
    a: "No. It uses a similar broad product-site language: soft illustrated landscapes, rounded app mockups, large editorial spacing, and download-style calls to action. All copy, visuals, structure, and animations are custom for KreatorOS.",
  },
  {
    q: "Can I use this as a drop-in page?",
    a: "Yes. Replace your current landing page component with this file. It is a single client component and does not need image assets or external component libraries.",
  },
  {
    q: "What does the AI operator execute?",
    a: "It can draft replies, map checkout flows, prepare campaign follow-ups, and organize CRM tasks. Every production action stays supervised by explicit approval.",
  },
  {
    q: "Does pricing switch annually?",
    a: "Yes. The pricing toggle updates the displayed monthly equivalent for annual billing while keeping the plan cards stable and responsive.",
  },
];

const dashboardRows = [
  ["Brand deal", "$2.4k", "74%", "#5c7cfa"],
  ["Downloads", "$860", "46%", "#9bd466"],
  ["Calls", "$1.2k", "62%", "#f4ba63"],
] as const;

const operatorTasks = [
  { label: "Draft brand proposal", meta: "Usage rights, net-30, 3 deliverables", status: "Approval" },
  { label: "Create coaching offer", meta: "$149 audit call with intake form", status: "Queued" },
  { label: "Send member renewal", meta: "62 subscribers expiring this week", status: "Ready" },
] as const;

const creatorProfileLinks = [
  ["Book a strategy call", "$149", "booking"],
  ["Creator OS templates", "$29", "product"],
  ["Private membership", "$19/mo", "member"],
] as const;

const subscriptionStats = [
  ["MRR tracked", "$18.4k", "+22%"],
  ["Active members", "1,284", "94% retention"],
  ["Approved actions", "312", "this month"],
  ["Brand pipeline", "$42k", "12 rooms"],
] as const;

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function StoreBadge({ type }: { type: "apple" | "google" | "web" }) {
  const label = type === "apple" ? "App Store" : type === "google" ? "Google Play" : "Web App";
  const sub = type === "web" ? "Open" : "Download on";
  const icon = type === "apple" ? "" : type === "google" ? "▶" : "↗";

  return (
    <button className="store-badge" onClick={(event) => event.preventDefault()} type="button">
      <span className="store-icon" aria-hidden="true">{icon}</span>
      <span>
        <small>{sub}</small>
        <strong>{label}</strong>
      </span>
    </button>
  );
}

function Cityscape3D() {
  return (
    <svg className="cityscape-3d" viewBox="0 0 1400 620" role="img" aria-label="Soft 3D city road illustration">
      <defs>
        <linearGradient id="heroSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d9f3f6" />
          <stop offset="0.58" stopColor="#f8f4d8" />
          <stop offset="1" stopColor="#d9eebf" />
        </linearGradient>
        <linearGradient id="roadFace" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffeec2" />
          <stop offset="1" stopColor="#f7d97e" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#314155" floodOpacity="0.16" />
        </filter>
      </defs>
      <rect width="1400" height="620" rx="46" fill="url(#heroSky)" />
      <circle className="sun-orb" cx="700" cy="170" r="88" fill="#fff3b5" opacity="0.92" />
      <g className="cloud cloud-a" opacity="0.78">
        <ellipse cx="255" cy="130" rx="62" ry="24" fill="#fff" />
        <ellipse cx="312" cy="126" rx="42" ry="19" fill="#fff" />
        <ellipse cx="205" cy="138" rx="38" ry="17" fill="#fff" />
      </g>
      <g className="cloud cloud-b" opacity="0.6">
        <ellipse cx="1080" cy="116" rx="70" ry="26" fill="#fff" />
        <ellipse cx="1140" cy="112" rx="48" ry="20" fill="#fff" />
        <ellipse cx="1028" cy="124" rx="34" ry="15" fill="#fff" />
      </g>
      <path d="M0 398C156 318 304 380 452 332C588 287 725 298 865 351C1027 414 1172 328 1400 372V620H0Z" fill="#bfe37e" />
      <path d="M0 452C174 386 305 452 466 408C633 362 822 382 988 446C1146 505 1265 424 1400 408V620H0Z" fill="#94ca5f" />
      <path d="M555 620L684 255L835 620Z" fill="url(#roadFace)" opacity="0.96" />
      <path d="M690 306L693 366M700 420L704 505" stroke="#fff7d7" strokeWidth="9" strokeLinecap="round" strokeDasharray="34 38" opacity="0.92" />
      <path d="M0 620C125 504 276 457 455 464C322 520 252 575 222 620H0Z" fill="#dcefb2" />
      <path d="M1400 620C1268 504 1118 457 938 464C1074 520 1147 575 1178 620H1400Z" fill="#dcefb2" />
      {[
        [185, 262, 82, 172, "#aacde4"],
        [280, 216, 112, 214, "#c6d8eb"],
        [418, 286, 76, 154, "#efb6bc"],
        [510, 218, 104, 228, "#bdd4e9"],
        [800, 226, 110, 220, "#bfd9ec"],
        [934, 292, 84, 154, "#f0b7bc"],
        [1038, 207, 104, 225, "#a9cce2"],
        [1165, 286, 82, 164, "#c8ddec"],
      ].map(([xRaw, yRaw, wRaw, hRaw, fill], index) => {
        const x = Number(xRaw);
        const y = Number(yRaw);
        const w = Number(wRaw);
        const h = Number(hRaw);
        return (
          <g key={index} filter="url(#softShadow)">
            <path d={`M${x} ${y + h}L${x + w * 0.12} ${y + 24}L${x + w} ${y}L${x + w * 0.88} ${y + h}Z`} fill={String(fill)} />
            <path d={`M${x + w * 0.75} ${y + 28}C${x + w * 0.96} ${y + 5} ${x + w + 16} ${y + 28} ${x + w * 0.86} ${y + 52}C${x + w + 20} ${y + 46} ${x + w + 26} ${y + 70} ${x + w * 0.79} ${y + 68}Z`} fill="#7fbd53" />
            {Array.from({ length: 4 }).map((_, dot) => (
              <circle key={dot} cx={x + 22 + dot * 18} cy={y + 60 + (dot % 2) * 28} r="5" fill="#ffffff" opacity="0.42" />
            ))}
          </g>
        );
      })}
      {[205, 362, 512, 875, 1066, 1206].map((x, index) => (
        <path key={x} className="bird" style={{ animationDelay: `${index * 0.45}s` }} d={`M${x} ${160 + (index % 2) * 28}q18 14 36 0q18 -14 36 0`} fill="none" stroke="#687989" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      ))}
    </svg>
  );
}

function PhoneMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "phone compact" : "phone"} aria-label="KreatorOS creator profile mobile preview">
      <div className="phone-rim" />
      <div className="phone-island" />
      <div className="phone-screen">
        <div className="phone-topbar">
          <span>‹</span>
          <b>•••</b>
        </div>
        <div className="profile-hero-card">
          <div className="avatar-stack">
            <span className="creator-avatar">AK</span>
            <span className="live-pill">Live</span>
          </div>
          <div className="profile-copy">
            <small>CREATOR PROFILE</small>
            <h4>{compact ? "Asha Studio" : "Asha Kreator"}</h4>
            <p>Courses, calls, templates, and member drops.</p>
          </div>
        </div>
        <div className="phone-social-row">
          <span>132k fans</span>
          <span>4.9 rating</span>
          <span>$18k MRR</span>
        </div>
        <div className="phone-offer-hero">
          <small>Featured offer</small>
          <strong>Launch sprint</strong>
          <p>7-day creator revenue setup with AI operator follow-up.</p>
          <button type="button">Book $299</button>
        </div>
        <div className="phone-title legacy-phone-title">
          <small>{compact ? "LIVE CAMPAIGN" : "PRIVATE BETA"}</small>
          <h4>{compact ? "Paid workshop" : "Creator launch"}</h4>
          <p>{compact ? "May 18 → May 30" : "Workspace health · 92%"}</p>
        </div>
        <div className="phone-budget-card legacy-phone-budget">
          <small>Revenue left to capture</small>
          <strong>{compact ? "$1,280" : "$4,650"}</strong>
          <div><span style={{ width: compact ? "68%" : "82%" }} /></div>
          <footer>
            <span>Captured {compact ? "68%" : "82%"}</span>
            <b>{compact ? "$2,720" : "$21,350"}</b>
          </footer>
        </div>
        <div className="profile-action-list">
          {creatorProfileLinks.map(([label, value, type], index) => (
            <div className="profile-link-row" key={label}>
              <span data-type={type}>{index + 1}</span>
              <strong>{label}</strong>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <div className="phone-tabs legacy-phone-tabs"><span>Offers</span><span>Tasks</span><span>CRM</span></div>
        {[
          ["Stripe invoice", "$450", "#e3f3c8"],
          ["Calendar slot", "$250", "#d9f3f6"],
          ["Sponsor follow-up", "Ready", "#fff0d7"],
        ].map(([label, value, color]) => (
          <div className="phone-list" key={label}>
            <span style={{ background: color }} />
            <strong>{label}</strong>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function LaptopMockup() {
  return (
    <div className="laptop-wrap" aria-label="KreatorOS AI operator desktop workspace">
      <div className="laptop-screen">
        <div className="desktop-app">
          <aside>
            <LogoMark />
            {["Operator", "Offers", "CRM", "Calendar", "Files"].map((item, index) => (
              <span key={item} className={index === 0 ? "active" : ""}>{item}</span>
            ))}
          </aside>
          <main>
            <div className="desktop-top">
              <div>
                <small>AI operator workspace</small>
                <strong>Creator launch command</strong>
              </div>
              <button type="button">Approve 7</button>
            </div>
            <section className="operator-command">
              <div className="operator-avatar">AI</div>
              <div>
                <small>Operator prompt</small>
                <p>Build a paid workshop funnel, update the public profile, and prepare brand follow-ups.</p>
              </div>
              <span>Gemini live</span>
            </section>
            <section className="balance-card">
              <small>Projected creator revenue</small>
              <strong>$12,480</strong>
              <div className="blue-bar"><span /></div>
            </section>
            <section className="dash-grid">
              <div className="agent-chat-card">
                <small>Suggested plan</small>
                <strong>3 actions ready</strong>
                {operatorTasks.map((task) => (
                  <div className="operator-task" key={task.label}>
                    <span>{task.status}</span>
                    <div>
                      <b>{task.label}</b>
                      <em>{task.meta}</em>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pie-card legacy-pie-card">
                <span className="donut" />
                <div>
                  <strong>Campaign mix</strong>
                  <small>Brand · Store · Calls</small>
                </div>
              </div>
              <div className="row-card approval-queue-card">
                {dashboardRows.map(([label, amount, width, color]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{amount}</strong>
                    <em><i style={{ width, background: color }} /></em>
                  </div>
                ))}
                <div className="operator-health">
                  <span>Workspace health</span>
                  <strong>92%</strong>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
      <div className="laptop-base" />
    </div>
  );
}

function FloatingRevenueCard() {
  return (
    <div className="float-card revenue-card">
      <small>Operator saved</small>
      <strong>26h</strong>
      <span>this month</span>
    </div>
  );
}

function FloatingApprovalCard() {
  return (
    <div className="float-card approval-card">
      <span className="pulse-dot" />
      <div>
        <small>Awaiting approval</small>
        <strong>Stripe campaign invoice</strong>
      </div>
    </div>
  );
}

function HeroDeviceStack() {
  return (
    <div className="device-stage">
      <Cityscape3D />
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="device-layer">
        <FloatingRevenueCard />
        <LaptopMockup />
        <div className="phone-float primary"><PhoneMockup compact /></div>
        <FloatingApprovalCard />
      </div>
    </div>
  );
}

function SubscriptionProofSection() {
  return (
    <div className="subscription-proof">
      <div className="subscription-proof-inner">
        <div>
          <span className="section-kicker">Subscription engine</span>
          <h2>Memberships, paid files, bookings, and brand retainers stay connected.</h2>
        </div>
        <div className="subscription-stat-grid">
          {subscriptionStats.map(([label, value, note]) => (
            <div className="subscription-stat" key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureIllustration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="illustration-card phone-scene">
        <div className="mini-coin coin-a">$</div>
        <div className="mini-coin coin-b">✓</div>
        <PhoneMockup />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="illustration-card workflow-card">
        {steps.map((step, stepIndex) => (
          <div key={step.n} className="workflow-node" style={{ animationDelay: `${stepIndex * 0.18}s` }}>
            <span>{step.n}</span>
            <strong>{stepIndex === 0 ? "Lead detected" : stepIndex === 1 ? "Offer drafted" : "Needs approval"}</strong>
          </div>
        ))}
        <svg viewBox="0 0 460 126" aria-hidden="true">
          <path d="M64 68C135 7 198 122 268 58C327 5 370 30 416 74" fill="none" stroke="#5c7cfa" strokeWidth="6" strokeLinecap="round" strokeDasharray="12 12" />
          <circle className="runner-dot" cx="64" cy="68" r="8" fill="#9bd466" />
        </svg>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="illustration-card report-card">
        <div className="paper one"><strong>$8.2k</strong><span>Campaign value</span></div>
        <div className="paper two"><strong>Net-30</strong><span>Terms approved</span></div>
        <div className="paper three"><strong>92%</strong><span>Delivery score</span></div>
      </div>
    );
  }

  return (
    <div className="illustration-card security-card">
      <div className="shield">✓</div>
      <p>Private member room</p>
      <span>RLS · Stripe · Storage</span>
    </div>
  );
}

function Modal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="beta-title">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose} type="button" aria-label="Close modal">×</button>
        {!submitted ? (
          <>
            <span className="section-kicker">Private beta</span>
            <h3 id="beta-title">Get your creator workspace ready.</h3>
            <p>Enter your business email and we’ll reserve a polished KreatorOS setup for your launch.</p>
            <form onSubmit={submit}>
              <label htmlFor="email">Business email</label>
              <input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@brand.com"
                type="email"
                required
              />
              <button className="btn btn-dark" type="submit" disabled={loading}>
                {loading ? "Preparing workspace..." : "Request access →"}
              </button>
            </form>
          </>
        ) : (
          <div className="modal-success">
            <div>✓</div>
            <h3>Workspace reserved.</h3>
            <p>We logged <strong>{email}</strong> for onboarding. Your setup link will be sent shortly.</p>
            <button className="btn btn-dark" type="button" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KreatorOSV2() {
  const [scrolled, setScrolled] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showModal, setShowModal] = useState(false);
  const [tilt, setTilt] = useState<Tilt>({ rx: 0, ry: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const yearlySaving = useMemo(() => billingInterval === "annual", [billingInterval]);

  const onHeroMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: Number((-y * 7).toFixed(2)), ry: Number((x * 9).toFixed(2)) });
  };

  const heroVars = {
    "--rx": `${tilt.rx}deg`,
    "--ry": `${tilt.ry}deg`,
  } as CSSProperties;

  return (
    <main className="kreatoros-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
          --ink: #151519;
          --muted: #6e737c;
          --line: rgba(21, 21, 25, 0.1);
          --paper: #fffefa;
          --cream: #fbf7e9;
          --sky: #d9f3f6;
          --mint: #e8f7cf;
          --grass: #9bd466;
          --blue: #5c7cfa;
          --orange: #f4ba63;
          --pink: #f5b7bb;
          --violet: #8b7cf6;
          --shadow: 0 28px 80px rgba(38, 44, 63, 0.14);
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        .kreatoros-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 4%, rgba(217, 243, 246, 0.72), transparent 30%),
            radial-gradient(circle at 90% 8%, rgba(232, 247, 207, 0.9), transparent 30%),
            var(--paper);
          color: var(--ink);
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .display { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; letter-spacing: -0.06em; }
        .container { max-width: 1180px; margin: 0 auto; }
        .section { padding: 104px 24px; position: relative; }
        .section::before {
          content: '';
          position: absolute;
          inset: 0 auto auto 50%;
          width: 640px;
          height: 320px;
          translate: -50% 0;
          background: radial-gradient(circle, rgba(92, 124, 250, 0.08), transparent 62%);
          pointer-events: none;
        }
        .section-kicker {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(21, 21, 25, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.68);
          padding: 8px 13px;
          color: #32343a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0 14px 34px rgba(21, 21, 25, 0.05);
          backdrop-filter: blur(14px);
        }
        .section-kicker::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--grass);
          box-shadow: 0 0 0 5px rgba(155, 212, 102, 0.16);
        }

        .site-header {
          position: fixed;
          inset: 0 0 auto;
          z-index: 50;
          padding: 18px 24px 0;
          pointer-events: none;
        }
        .nav-shell {
          pointer-events: auto;
          max-width: 1180px;
          height: 68px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          border: 1px solid rgba(21, 21, 25, 0.08);
          border-radius: 22px;
          background: rgba(255, 254, 250, 0.78);
          box-shadow: 0 18px 50px rgba(26, 31, 44, 0.10);
          backdrop-filter: blur(20px);
          padding: 0 12px 0 20px;
          transition: transform .25s ease, background .25s ease, box-shadow .25s ease;
        }
        .nav-shell.not-scrolled { box-shadow: 0 10px 30px rgba(26, 31, 44, 0.04); background: rgba(255, 254, 250, 0.66); }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--ink);
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 900;
          letter-spacing: -0.04em;
          font-size: 21px;
          white-space: nowrap;
        }
        .logo-mark {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          position: relative;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(21, 21, 25, 0.1);
          box-shadow: inset 0 -5px 10px rgba(21,21,25,0.04), 0 10px 18px rgba(21,21,25,0.07);
        }
        .logo-mark span { position: absolute; border-radius: 999px; }
        .logo-mark span:nth-child(1) { width: 17px; height: 17px; left: 7px; top: 8px; background: var(--grass); }
        .logo-mark span:nth-child(2) { width: 15px; height: 15px; right: 6px; bottom: 6px; background: var(--blue); opacity: .92; }
        .logo-mark span:nth-child(3) { width: 10px; height: 10px; left: 9px; bottom: 7px; background: var(--orange); }
        .nav-links { display: flex; align-items: center; gap: 6px; }
        .nav-links a, .nav-action-light {
          color: #454851;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          padding: 12px 13px;
          border-radius: 999px;
          transition: background .2s ease, color .2s ease, transform .2s ease;
        }
        .nav-links a:hover, .nav-action-light:hover { background: rgba(21, 21, 25, 0.05); color: var(--ink); transform: translateY(-1px); }
        .nav-actions { display: flex; align-items: center; gap: 8px; }
        button { font-family: inherit; }
        .btn {
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 46px;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 900;
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease, opacity .22s ease;
          text-decoration: none;
          white-space: nowrap;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { cursor: not-allowed; opacity: .7; }
        .btn-dark { background: var(--ink); color: white; box-shadow: 0 12px 24px rgba(21, 21, 25, 0.16); }
        .btn-dark:hover { background: #000; box-shadow: 0 16px 34px rgba(21, 21, 25, 0.2); }
        .btn-soft { background: rgba(255,255,255,.78); color: var(--ink); border: 1px solid rgba(21, 21, 25, 0.1); box-shadow: 0 12px 28px rgba(21,21,25,0.06); }
        .btn-green { background: var(--grass); color: #15210e; box-shadow: 0 14px 34px rgba(100, 164, 45, 0.18); }

        .hero { position: relative; padding: 128px 24px 0; perspective: 1800px; }
        .hero-inner {
          position: relative;
          max-width: 1240px;
          min-height: 860px;
          margin: 0 auto;
          border-radius: 42px;
          overflow: hidden;
          border: 1px solid rgba(21, 21, 25, 0.08);
          background: linear-gradient(180deg, #d9f3f6 0%, #f5f4d9 55%, #dcefbf 100%);
          box-shadow: 0 36px 110px rgba(68, 104, 109, 0.16);
          transform-style: preserve-3d;
          isolation: isolate;
        }
        .hero-inner::before {
          content: '';
          position: absolute;
          inset: -22%;
          background:
            radial-gradient(circle at 26% 22%, rgba(255,255,255,.72), transparent 26%),
            radial-gradient(circle at 72% 18%, rgba(255, 236, 181, .62), transparent 24%),
            radial-gradient(circle at 50% 80%, rgba(92,124,250,.18), transparent 28%);
          pointer-events: none;
          animation: heroAurora 11s ease-in-out infinite alternate;
        }
        .hero-copy {
          position: relative;
          z-index: 8;
          max-width: 900px;
          margin: 0 auto;
          padding: 68px 22px 0;
          text-align: center;
          transform: translateZ(80px);
        }
        .hero-copy h1 {
          margin: 24px auto 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(48px, 7vw, 98px);
          line-height: 0.94;
          font-weight: 900;
          letter-spacing: -0.08em;
          max-width: 980px;
          text-wrap: balance;
        }
        .hero-copy h1 em { font-style: normal; color: #4f6df3; text-shadow: 0 18px 40px rgba(92,124,250,.16); }
        .hero-copy p {
          max-width: 670px;
          margin: 0 auto 28px;
          color: #4c5963;
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.7;
          font-weight: 650;
        }
        .hero-ctas { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
        .hero-badges { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .store-badge {
          height: 48px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(21, 21, 25, 0.12);
          background: rgba(255,255,255,0.74);
          border-radius: 999px;
          padding: 0 15px 0 12px;
          color: var(--ink);
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(21,21,25,0.06);
          backdrop-filter: blur(12px);
          transition: transform .22s ease, box-shadow .22s ease;
        }
        .store-badge:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 16px 34px rgba(21,21,25,0.1); }
        .store-icon { width: 26px; height: 26px; border-radius: 50%; background: var(--ink); color: white; display: grid; place-items: center; font-weight: 900; font-size: 13px; }
        .store-badge small, .store-badge strong { display: block; text-align: left; line-height: 1.05; }
        .store-badge small { font-size: 10px; color: var(--muted); font-weight: 800; }
        .store-badge strong { font-size: 13px; font-weight: 900; }

        .device-stage { position: absolute; inset: auto 0 0; height: 590px; transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transform-style: preserve-3d; transition: transform .16s ease-out; }
        .cityscape-3d { position: absolute; inset: auto 0 0; width: 100%; height: 570px; object-fit: cover; transform: translateZ(-60px) scale(1.05); }
        .cloud { animation: cloudDrift 14s ease-in-out infinite alternate; transform-origin: center; }
        .cloud-b { animation-duration: 17s; animation-delay: -3s; }
        .sun-orb { animation: sunPulse 5s ease-in-out infinite; transform-origin: center; }
        .bird { animation: birdBob 3.2s ease-in-out infinite; }
        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(.2px) drop-shadow(0 20px 28px rgba(21,21,25,.18));
          transform-style: preserve-3d;
        }
        .orb-one { width: 66px; height: 66px; left: 13%; bottom: 182px; background: linear-gradient(135deg, #fff6c9, #f4ba63); transform: translateZ(120px); animation: floatY 5s ease-in-out infinite; }
        .orb-two { width: 42px; height: 42px; right: 18%; bottom: 260px; background: linear-gradient(135deg, #ffffff, #9bd466); transform: translateZ(110px); animation: floatY 6.6s ease-in-out infinite reverse; }
        .device-layer { position: absolute; inset: 168px 0 0; display: flex; align-items: flex-end; justify-content: center; pointer-events: none; transform-style: preserve-3d; }
        .laptop-wrap { width: min(704px, 62vw); position: relative; filter: drop-shadow(0 34px 44px rgba(31, 41, 55, 0.24)); transform: translateZ(130px) rotateX(4deg); animation: deviceFloat 6s ease-in-out infinite; transform-style: preserve-3d; }
        .laptop-screen { aspect-ratio: 16 / 10; background: linear-gradient(180deg,#21212a,#0f0f15); border-radius: 22px 22px 12px 12px; padding: 14px; border: 2px solid #202027; box-shadow: inset 0 2px 0 rgba(255,255,255,.14); }
        .laptop-screen::before { content: ''; position: absolute; inset: 14px; border-radius: 13px; background: linear-gradient(120deg, rgba(255,255,255,.16), transparent 28%); pointer-events: none; z-index: 2; }
        .laptop-base { height: 28px; width: 114%; margin-left: -7%; border-radius: 0 0 48px 48px; background: linear-gradient(180deg,#2b2b36,#09090d); box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 18px 24px rgba(0,0,0,.13); position: relative; }
        .laptop-base::after { content: ''; position: absolute; left: 50%; top: 0; translate: -50% 0; width: 130px; height: 9px; border-radius: 0 0 16px 16px; background: rgba(255,255,255,.16); }
        .desktop-app { height: 100%; display: grid; grid-template-columns: 134px 1fr; background: #f8fbff; border-radius: 12px; overflow: hidden; position: relative; }
        .desktop-app aside { background: rgba(255,255,255,.93); padding: 18px 12px; border-right: 1px solid rgba(21,21,25,.08); display: flex; flex-direction: column; gap: 8px; }
        .desktop-app aside .logo-mark { width: 28px; height: 28px; margin-bottom: 8px; }
        .desktop-app aside > span:not(.logo-mark) { font-size: 11px; color: #747985; font-weight: 850; padding: 9px 10px; border-radius: 9px; }
        .desktop-app aside > span.active { background: #eef3ff; color: var(--blue); box-shadow: inset 0 0 0 1px rgba(92,124,250,.08); }
        .desktop-app main { padding: 18px; display: flex; flex-direction: column; gap: 13px; }
        .desktop-top { display: flex; justify-content: space-between; align-items: center; }
        .desktop-top small, .balance-card small, .pie-card small { color: #9298a5; font-size: 10px; font-weight: 850; }
        .desktop-top strong { display: block; font-size: 15px; }
        .desktop-top button { border: 0; background: var(--ink); color: white; border-radius: 10px; padding: 8px 12px; font-weight: 900; font-size: 11px; }
        .balance-card { background: linear-gradient(135deg, #e9f8fb, #ffffff); border: 1px solid rgba(21,21,25,.07); border-radius: 18px; padding: 18px; box-shadow: 0 18px 34px rgba(48, 91, 116, .07); }
        .balance-card strong { display: block; font-size: 31px; margin: 5px 0 12px; letter-spacing: -0.05em; }
        .blue-bar { height: 11px; border-radius: 999px; background: #e5e7f0; overflow: hidden; }
        .blue-bar span { display: block; width: 76%; height: 100%; background: linear-gradient(90deg, var(--blue), #92a8ff); border-radius: inherit; animation: barPulse 2.8s ease-in-out infinite; }
        .operator-command { display: grid; grid-template-columns: 42px 1fr auto; gap: 11px; align-items: center; background: linear-gradient(135deg, #151519, #303747); color: white; border-radius: 18px; padding: 14px; box-shadow: 0 18px 34px rgba(21,21,25,.16); }
        .operator-avatar { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; background: var(--grass); color: #16220f; font-size: 12px; font-weight: 950; }
        .operator-command small { display: block; color: rgba(255,255,255,.56); font-size: 9px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .operator-command p { margin: 3px 0 0; color: rgba(255,255,255,.82); font-size: 11px; line-height: 1.35; font-weight: 750; }
        .operator-command > span { border-radius: 999px; padding: 7px 9px; background: rgba(255,255,255,.1); color: #dff3b8; font-size: 9px; font-weight: 950; white-space: nowrap; }
        .dash-grid { display: grid; grid-template-columns: .86fr 1.14fr; gap: 13px; flex: 1; }
        .legacy-pie-card { display: none; }
        .agent-chat-card, .approval-queue-card { background: white; border: 1px solid rgba(21,21,25,.07); border-radius: 16px; padding: 14px; box-shadow: 0 14px 26px rgba(21,21,25,.05); }
        .agent-chat-card > small { color: #9298a5; font-size: 10px; font-weight: 850; }
        .agent-chat-card > strong { display: block; margin: 4px 0 10px; font-size: 14px; }
        .operator-task { display: grid; grid-template-columns: 54px 1fr; gap: 8px; align-items: start; padding: 9px 0; border-top: 1px solid rgba(21,21,25,.06); }
        .operator-task span { border-radius: 999px; padding: 5px 6px; background: #eef3ff; color: var(--blue); text-align: center; font-size: 8px; font-weight: 950; }
        .operator-task b, .operator-task em { display: block; }
        .operator-task b { font-size: 10px; color: var(--ink); }
        .operator-task em { margin-top: 2px; color: #747985; font-size: 9px; font-style: normal; font-weight: 750; line-height: 1.3; }
        .approval-queue-card { display: flex; flex-direction: column; justify-content: center; gap: 11px; }
        .operator-health { display: flex; justify-content: space-between; align-items: center; border-radius: 14px; padding: 10px; background: #f4f9ec; color: #4a642f; font-size: 10px; font-weight: 900; }
        .operator-health strong { color: #243716; font-size: 16px; }
        .pie-card, .row-card { background: white; border: 1px solid rgba(21,21,25,.07); border-radius: 16px; padding: 14px; box-shadow: 0 14px 26px rgba(21,21,25,.05); }
        .pie-card { display: flex; align-items: center; gap: 12px; }
        .donut { width: 72px; height: 72px; border-radius: 50%; background: conic-gradient(var(--blue) 0 38%, var(--grass) 38% 66%, var(--orange) 66% 83%, var(--pink) 83% 100%); position: relative; flex-shrink: 0; animation: slowSpin 8s linear infinite; }
        .donut::after { content: ''; position: absolute; inset: 18px; background: white; border-radius: 50%; }
        .pie-card strong { display: block; font-size: 13px; margin-bottom: 3px; }
        .row-card { display: flex; flex-direction: column; justify-content: center; gap: 13px; }
        .row-card div { display: grid; grid-template-columns: 1fr auto; gap: 5px 8px; align-items: center; font-size: 11px; font-weight: 850; color: #626976; }
        .row-card strong { color: var(--ink); }
        .row-card em { grid-column: 1 / -1; height: 7px; border-radius: 99px; background: #eef0f5; overflow: hidden; }
        .row-card i { display: block; height: 100%; border-radius: inherit; }
        .row-card .operator-health { display: flex; grid-template-columns: none; justify-content: space-between; align-items: center; gap: 10px; margin-top: 2px; padding: 10px; }
        .row-card .operator-health strong { font-size: 16px; }
        .phone-float { position: absolute; right: calc(50% - 432px); bottom: 32px; filter: drop-shadow(0 28px 34px rgba(21,21,25,.28)); transform: translateZ(240px) rotateY(-15deg) rotateZ(2deg); animation: phoneFloat 6.8s ease-in-out infinite; transform-style: preserve-3d; }
        .phone { width: 232px; height: 462px; border-radius: 44px; padding: 10px; background: linear-gradient(145deg, #2b2b34, #09090e 55%, #24242b); box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), inset 8px 0 18px rgba(255,255,255,.04), 0 34px 52px rgba(21,21,25,.28); position: relative; transform-style: preserve-3d; }
        .phone::after { content: ''; position: absolute; inset: 7px; border-radius: 38px; background: linear-gradient(125deg, rgba(255,255,255,.16), transparent 32%); pointer-events: none; z-index: 4; }
        .phone-rim { position: absolute; inset: -2px; border-radius: inherit; border: 1px solid rgba(255,255,255,.18); pointer-events: none; }
        .phone.compact { width: 196px; height: 392px; }
        .phone-island { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 70px; height: 20px; border-radius: 999px; background: #07070a; z-index: 5; box-shadow: inset 0 1px 0 rgba(255,255,255,.1); }
        .phone-screen { width: 100%; height: 100%; border-radius: 35px; background: linear-gradient(180deg, #e9f9f8, #f7f8fc 43%, #ffffff 100%); padding: 42px 15px 15px; overflow: hidden; position: relative; }
        .phone-screen::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 70% 8%, rgba(155,212,102,.36), transparent 26%); pointer-events: none; }
        .phone.compact .phone-screen { border-radius: 31px; padding: 38px 13px 13px; }
        .phone-topbar { display: flex; justify-content: space-between; align-items: center; color: #333; font-weight: 900; margin-bottom: 14px; position: relative; z-index: 1; }
        .phone-topbar span, .phone-topbar b { width: 31px; height: 31px; border-radius: 50%; background: rgba(255,255,255,.78); display: grid; place-items: center; font-weight: 900; }
        .phone-title { position: relative; z-index: 1; }
        .phone-title small { color: #6d7680; font-size: 9px; font-weight: 900; letter-spacing: .11em; }
        .phone h4 { margin: 2px 0 0; font-size: 20px; letter-spacing: -0.05em; font-family: 'Plus Jakarta Sans', sans-serif; }
        .phone.compact h4 { font-size: 16px; }
        .phone p { margin: 4px 0 14px; font-size: 12px; color: #7b838d; font-weight: 750; }
        .legacy-phone-title, .legacy-phone-budget, .legacy-phone-tabs, .legacy-phone-tabs ~ .phone-list { display: none; }
        .profile-hero-card { position: relative; z-index: 1; display: grid; grid-template-columns: 52px 1fr; gap: 10px; align-items: center; margin-bottom: 9px; }
        .phone.compact .profile-hero-card { grid-template-columns: 44px 1fr; gap: 8px; }
        .avatar-stack { position: relative; }
        .creator-avatar { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 18px; background: linear-gradient(135deg, #151519, #394152); color: white; font-size: 14px; font-weight: 950; box-shadow: 0 16px 28px rgba(21,21,25,.18); }
        .phone.compact .creator-avatar { width: 44px; height: 44px; border-radius: 15px; font-size: 12px; }
        .live-pill { position: absolute; right: -8px; bottom: -6px; border-radius: 999px; padding: 4px 7px; background: var(--grass); color: #16210e; font-size: 8px; font-weight: 950; box-shadow: 0 10px 18px rgba(21,21,25,.14); }
        .profile-copy small { color: #6d7680; font-size: 8px; font-weight: 950; letter-spacing: .11em; }
        .profile-copy h4 { margin: 1px 0 0; }
        .profile-copy p { margin-bottom: 0; font-size: 10px; line-height: 1.35; }
        .phone-social-row { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 9px; }
        .phone.compact .phone-social-row { display: none; }
        .phone-social-row span { border-radius: 12px; background: rgba(255,255,255,.74); border: 1px solid rgba(21,21,25,.06); padding: 7px 4px; text-align: center; font-size: 8px; font-weight: 900; color: #4f5865; }
        .phone-offer-hero { position: relative; z-index: 1; border-radius: 21px; padding: 13px; margin-bottom: 9px; background: #151519; color: white; box-shadow: 0 18px 32px rgba(21,21,25,.2); }
        .phone-offer-hero small { color: rgba(255,255,255,.56); font-size: 9px; font-weight: 900; }
        .phone-offer-hero strong { display: block; margin-top: 3px; font-family: 'Plus Jakarta Sans'; font-size: 19px; letter-spacing: -.05em; }
        .phone.compact .phone-offer-hero strong { font-size: 16px; }
        .phone-offer-hero p { color: rgba(255,255,255,.68); margin: 3px 0 10px; font-size: 10px; line-height: 1.4; }
        .phone-offer-hero button { width: 100%; border: 0; border-radius: 999px; padding: 9px 10px; background: var(--grass); color: #15210f; font-weight: 950; font-size: 10px; }
        .profile-action-list { position: relative; z-index: 1; display: grid; gap: 7px; }
        .profile-link-row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 8px; background: rgba(255,255,255,.88); border: 1px solid rgba(21,21,25,.06); border-radius: 15px; padding: 8px; box-shadow: 0 9px 20px rgba(21,21,25,.04); }
        .phone.compact .profile-link-row { grid-template-columns: 24px 1fr auto; gap: 7px; padding: 7px; }
        .profile-link-row > span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 10px; background: #e3f3c8; color: #31481f; font-size: 10px; font-weight: 950; }
        .profile-link-row > span[data-type="product"] { background: #d9f3f6; color: #22505a; }
        .profile-link-row > span[data-type="member"] { background: #fff0d7; color: #6b4918; }
        .profile-link-row strong, .profile-link-row b { font-size: 10px; }
        .profile-link-row b { color: #59616c; }
        .phone-budget-card { position: relative; z-index: 1; background: #151519; color: white; border-radius: 24px; padding: 17px; margin-bottom: 12px; box-shadow: 0 18px 32px rgba(21,21,25,.2); }
        .phone.compact .phone-budget-card { padding: 13px; border-radius: 20px; }
        .phone-budget-card small { color: rgba(255,255,255,.56); font-size: 10px; font-weight: 850; }
        .phone-budget-card strong { display: block; font-size: 28px; letter-spacing: -0.06em; margin: 4px 0 13px; }
        .phone.compact .phone-budget-card strong { font-size: 23px; }
        .phone-budget-card > div { height: 9px; background: rgba(255,255,255,.16); border-radius: 999px; overflow: hidden; }
        .phone-budget-card > div span { display: block; height: 100%; background: linear-gradient(90deg, var(--grass), #dff3b8); border-radius: inherit; animation: barPulse 3s ease-in-out infinite; }
        .phone-budget-card footer { margin-top: 11px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: rgba(255,255,255,.58); }
        .phone-budget-card footer b { color: white; font-size: 11px; }
        .phone-tabs { display: flex; gap: 6px; margin-bottom: 9px; position: relative; z-index: 1; }
        .phone-tabs span { flex: 1; text-align: center; border-radius: 999px; background: rgba(21,21,25,.06); padding: 7px 0; font-size: 9px; font-weight: 900; }
        .phone-tabs span:first-child { background: var(--grass); }
        .phone-list { position: relative; z-index: 1; display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 8px; background: rgba(255,255,255,.84); border: 1px solid rgba(21,21,25,.06); border-radius: 16px; padding: 10px; margin-bottom: 7px; box-shadow: 0 9px 20px rgba(21,21,25,.04); }
        .phone.compact .phone-list { grid-template-columns: 24px 1fr auto; padding: 8px; border-radius: 14px; gap: 7px; }
        .phone-list > span { width: 28px; height: 28px; border-radius: 10px; }
        .phone.compact .phone-list > span { width: 24px; height: 24px; border-radius: 9px; }
        .phone-list strong { font-size: 11px; }
        .phone-list b { font-size: 11px; color: #5b6370; }
        .float-card { position: absolute; z-index: 3; border: 1px solid rgba(21,21,25,.09); background: rgba(255,255,255,.78); backdrop-filter: blur(16px); border-radius: 22px; box-shadow: 0 24px 42px rgba(21,21,25,.13); pointer-events: none; transform-style: preserve-3d; }
        .revenue-card { left: calc(50% - 520px); bottom: 104px; padding: 18px 22px; transform: translateZ(280px) rotateY(18deg) rotateX(8deg); animation: floatY 5.8s ease-in-out infinite; }
        .revenue-card small, .approval-card small { display: block; color: #707782; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .revenue-card strong { display: block; font-size: 38px; letter-spacing: -.07em; font-family: 'Plus Jakarta Sans', sans-serif; }
        .revenue-card span { color: #59616c; font-size: 12px; font-weight: 800; }
        .approval-card { right: calc(50% - 520px); bottom: 152px; display: flex; gap: 12px; align-items: center; padding: 15px 17px; transform: translateZ(300px) rotateY(-20deg) rotateX(7deg); animation: floatY 6.4s ease-in-out infinite reverse; }
        .approval-card strong { display: block; font-size: 13px; }
        .pulse-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--grass); box-shadow: 0 0 0 0 rgba(155,212,102,.5); animation: pulse 1.8s infinite; }

        .section-head { position: relative; z-index: 1; display: grid; grid-template-columns: 1.08fr .72fr; gap: 40px; align-items: end; margin-bottom: 48px; }
        .section-head.center { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 780px; margin-left: auto; margin-right: auto; }
        .section-head h2, .overview-copy h2, .download-copy h2, .final-panel h2 {
          margin: 16px 0 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(36px, 5vw, 66px);
          line-height: 1;
          letter-spacing: -0.075em;
          font-weight: 900;
          text-wrap: balance;
        }
        .section-head p, .overview-copy p, .download-copy p, .final-panel p { color: #666d78; line-height: 1.75; font-size: 16px; font-weight: 650; margin: 0; }
        .section-head.center p { max-width: 660px; }

        .feature-grid { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .feature-card {
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(21,21,25,.08);
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 18px 42px rgba(21,21,25,.06);
          transition: transform .32s cubic-bezier(.16,1,.3,1), box-shadow .32s ease, border-color .32s ease;
          transform-style: preserve-3d;
        }
        .feature-card:hover { transform: translateY(-10px) rotateX(2deg); box-shadow: 0 34px 70px rgba(21,21,25,.12); border-color: rgba(21,21,25,.16); }
        .feature-visual { height: 268px; display: grid; place-items: center; position: relative; overflow: hidden; }
        .feature-visual::before { content: ''; position: absolute; inset: 12%; border-radius: 50%; background: rgba(255,255,255,.36); filter: blur(24px); }
        .feature-body { padding: 24px 24px 28px; }
        .feature-body small { color: #737b85; text-transform: uppercase; font-size: 11px; font-weight: 950; letter-spacing: .11em; }
        .feature-body h3 { margin: 10px 0 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; line-height: 1.08; letter-spacing: -0.055em; }
        .feature-body p { margin: 0; color: #66707a; line-height: 1.62; font-size: 14px; font-weight: 620; }
        .illustration-card { width: 100%; height: 100%; display: grid; place-items: center; position: relative; transform-style: preserve-3d; }
        .phone-scene .phone { transform: scale(.72) rotateY(-16deg) rotateX(7deg); }
        .mini-coin { position: absolute; z-index: 3; display: grid; place-items: center; border-radius: 50%; font-weight: 950; box-shadow: 0 18px 28px rgba(21,21,25,.14); }
        .coin-a { width: 54px; height: 54px; left: 28px; top: 48px; background: #ffe69b; animation: floatY 5s ease-in-out infinite; }
        .coin-b { width: 42px; height: 42px; right: 36px; bottom: 52px; background: #ffffff; animation: floatY 6s ease-in-out infinite reverse; }
        .workflow-card { padding: 34px 22px; align-content: center; gap: 16px; }
        .workflow-node { width: 78%; min-height: 50px; display: flex; align-items: center; gap: 12px; border-radius: 18px; background: rgba(255,255,255,.78); border: 1px solid rgba(21,21,25,.08); padding: 12px; box-shadow: 0 16px 28px rgba(21,21,25,.08); animation: nodeLift 3.4s ease-in-out infinite; }
        .workflow-node:nth-child(2) { margin-left: 34px; }
        .workflow-node span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 10px; background: var(--ink); color: #fff; font-size: 11px; font-weight: 900; }
        .workflow-node strong { font-size: 13px; }
        .workflow-card svg { position: absolute; inset: auto 0 18px; width: 100%; height: 92px; opacity: .82; }
        .runner-dot { animation: runner 3s ease-in-out infinite; }
        .report-card .paper { position: absolute; width: 180px; height: 112px; border-radius: 22px; border: 1px solid rgba(21,21,25,.08); background: rgba(255,255,255,.78); box-shadow: 0 22px 36px rgba(21,21,25,.11); display: grid; place-items: center; text-align: center; transform-style: preserve-3d; }
        .report-card .paper strong { display: block; font-size: 30px; font-family: 'Plus Jakarta Sans'; letter-spacing: -.06em; }
        .report-card .paper span { color: #737b85; font-size: 12px; font-weight: 800; }
        .paper.one { transform: rotate(-9deg) translate(-35px,-44px); background: #fff9d6; animation: cardBreathe 5s ease-in-out infinite; }
        .paper.two { transform: rotate(7deg) translate(32px,12px); background: #e7f4ff; animation: cardBreathe 5.6s ease-in-out infinite reverse; }
        .paper.three { transform: rotate(-3deg) translate(-12px,74px); background: #e6f5d2; animation: cardBreathe 5.8s ease-in-out infinite; }
        .security-card { text-align: center; gap: 10px; }
        .shield { width: 102px; height: 116px; display: grid; place-items: center; color: white; font-size: 46px; font-weight: 950; background: linear-gradient(160deg, #151519, #434a57); clip-path: polygon(50% 0, 90% 16%, 82% 78%, 50% 100%, 18% 78%, 10% 16%); box-shadow: 0 25px 38px rgba(21,21,25,.18); animation: shieldTilt 5s ease-in-out infinite; }
        .security-card p { margin: 6px 0 0; font-weight: 950; font-size: 17px; }
        .security-card span { color: #69717b; font-size: 12px; font-weight: 850; }

        .overview-section { background: linear-gradient(180deg, rgba(251,247,233,0), rgba(232,247,207,.35)); }
        .overview-layout { display: grid; grid-template-columns: .9fr 1.1fr; gap: 48px; align-items: center; position: relative; z-index: 1; }
        .overview-copy p { margin-top: 20px; }
        .mini-feature-list { margin-top: 28px; display: grid; gap: 12px; }
        .mini-feature-list div { display: flex; align-items: center; gap: 10px; font-weight: 850; color: #3d444c; }
        .mini-feature-list span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--grass); box-shadow: 0 12px 22px rgba(105,170,48,.16); }
        .dashboard-card { border-radius: 42px; padding: 26px; background: linear-gradient(145deg, rgba(255,255,255,.78), rgba(255,255,255,.42)); border: 1px solid rgba(21,21,25,.08); box-shadow: var(--shadow); transform: perspective(1000px) rotateY(-7deg) rotateX(3deg); transform-style: preserve-3d; }
        .mock-panel { border-radius: 30px; padding: 24px; background: #f9fbff; border: 1px solid rgba(21,21,25,.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,.5); }
        .mock-panel header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .mock-panel h3 { margin: 0; font-family: 'Plus Jakarta Sans'; font-size: 24px; letter-spacing: -.06em; }
        .mock-panel header span { border-radius: 999px; background: #e6f5d2; color: #406b23; padding: 8px 12px; font-size: 11px; font-weight: 950; letter-spacing: .1em; }
        .money-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
        .money-grid div { background: white; border: 1px solid rgba(21,21,25,.07); border-radius: 22px; padding: 18px; box-shadow: 0 14px 28px rgba(21,21,25,.05); }
        .money-grid small { color: #7b838d; font-weight: 850; }
        .money-grid strong { display: block; margin-top: 8px; font-size: 28px; font-family: 'Plus Jakarta Sans'; letter-spacing: -.06em; }
        .chart-box { height: 250px; border-radius: 26px; background: linear-gradient(180deg, #eef9fb, #fff); border: 1px solid rgba(21,21,25,.07); padding: 22px; display: flex; align-items: end; gap: 12px; overflow: hidden; position: relative; }
        .chart-box::before { content: ''; position: absolute; inset: 24px; background-image: linear-gradient(rgba(21,21,25,.05) 1px, transparent 1px); background-size: 100% 44px; }
        .chart-box span { position: relative; z-index: 1; flex: 1; max-width: 46px; border-radius: 16px 16px 6px 6px; background: linear-gradient(180deg, var(--blue), #b4c1ff); box-shadow: 0 14px 24px rgba(92,124,250,.18); animation: growBar 5s ease-in-out infinite; transform-origin: bottom; }
        .chart-box span:nth-child(2n) { background: linear-gradient(180deg, var(--grass), #dff3b8); animation-delay: -.8s; }
        .chart-box span:nth-child(3n) { background: linear-gradient(180deg, var(--orange), #ffdf9b); animation-delay: -1.4s; }

        .how-section { background: #fbf7e9; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; position: relative; z-index: 1; }
        .step-card { position: relative; min-height: 310px; padding: 34px; overflow: hidden; border-radius: 34px; background: rgba(255,255,255,.72); border: 1px solid rgba(21,21,25,.08); box-shadow: 0 18px 42px rgba(21,21,25,.06); transition: transform .3s ease, box-shadow .3s ease; }
        .step-card:hover { transform: translateY(-8px); box-shadow: 0 34px 70px rgba(21,21,25,.12); }
        .step-card::after { content: attr(data-n); position: absolute; right: 22px; bottom: -18px; font-family: 'Plus Jakarta Sans'; font-size: 140px; font-weight: 900; letter-spacing: -.1em; color: rgba(21,21,25,.045); }
        .step-card > span { width: 54px; height: 54px; border-radius: 18px; display: grid; place-items: center; background: var(--ink); color: white; font-weight: 950; box-shadow: 0 18px 30px rgba(21,21,25,.17); }
        .step-card h3 { position: relative; margin: 24px 0 12px; font-family: 'Plus Jakarta Sans'; font-size: 26px; line-height: 1.08; letter-spacing: -.06em; z-index: 1; }
        .step-card p { position: relative; margin: 0; color: #68707a; line-height: 1.72; font-weight: 650; z-index: 1; }

        .download-section { padding: 32px 24px 104px; }
        .download-panel { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: .7fr 1.3fr; gap: 36px; align-items: center; border-radius: 44px; padding: 48px; background: radial-gradient(circle at 15% 20%, rgba(155,212,102,.28), transparent 30%), linear-gradient(135deg, #151519, #2a2f38); color: white; overflow: hidden; position: relative; box-shadow: 0 36px 90px rgba(21,21,25,.25); }
        .download-panel::after { content: ''; position: absolute; right: -120px; top: -120px; width: 360px; height: 360px; border-radius: 50%; background: rgba(92,124,250,.2); filter: blur(10px); }
        .qr-card { position: relative; z-index: 1; width: 286px; aspect-ratio: 1; border-radius: 34px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); display: grid; place-items: center; align-content: center; gap: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 26px 50px rgba(0,0,0,.22); transform: perspective(800px) rotateY(12deg) rotateX(5deg); }
        .qr-grid { width: 150px; height: 150px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding: 10px; border-radius: 22px; background: white; }
        .qr-grid span { border-radius: 5px; background: var(--ink); opacity: .12; }
        .qr-grid span:nth-child(2n), .qr-grid span:nth-child(5n), .qr-grid span:nth-child(9n) { opacity: .95; }
        .qr-card p { margin: 0; color: rgba(255,255,255,.72); font-weight: 850; }
        .download-copy { position: relative; z-index: 1; }
        .download-copy h2 { color: white; margin-top: 0; max-width: 690px; }
        .download-copy p { color: rgba(255,255,255,.68); max-width: 680px; margin-top: 20px; }
        .dark-badges { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }
        .dark-badges .store-badge { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.14); }
        .dark-badges .store-badge small { color: rgba(255,255,255,.56); }
        .dark-badges .store-icon { background: #fff; color: var(--ink); }

        .subscription-proof { margin: -16px 0 58px; position: relative; z-index: 1; }
        .subscription-proof-inner { display: grid; grid-template-columns: .9fr 1.1fr; gap: 24px; align-items: stretch; border-radius: 38px; padding: 30px; background: linear-gradient(135deg, rgba(21,21,25,.95), rgba(43,48,56,.92)); color: white; box-shadow: 0 28px 70px rgba(21,21,25,.2); overflow: hidden; }
        .subscription-proof-inner h2 { margin: 12px 0 0; max-width: 430px; font-family: 'Plus Jakarta Sans'; font-size: clamp(28px, 3.3vw, 46px); line-height: 1; letter-spacing: -.07em; }
        .subscription-stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .subscription-stat { min-height: 132px; border-radius: 24px; padding: 18px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
        .subscription-stat small { display: block; color: rgba(255,255,255,.54); font-size: 10px; font-weight: 950; letter-spacing: .12em; text-transform: uppercase; }
        .subscription-stat strong { display: block; margin: 14px 0 5px; font-family: 'Plus Jakarta Sans'; font-size: 34px; letter-spacing: -.07em; }
        .subscription-stat span { color: #dff3b8; font-size: 12px; font-weight: 850; }

        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; position: relative; z-index: 1; }
        .billing-toggle { display: inline-flex; padding: 5px; gap: 5px; border-radius: 999px; background: rgba(21,21,25,.08); margin-top: 24px; }
        .billing-toggle button { border: 0; border-radius: 999px; padding: 10px 17px; background: transparent; color: #5f6670; font-weight: 900; cursor: pointer; transition: background .2s ease, color .2s ease, box-shadow .2s ease; }
        .billing-toggle button.active { background: white; color: var(--ink); box-shadow: 0 10px 20px rgba(21,21,25,.08); }
        .plan-card { position: relative; border-radius: 34px; padding: 32px; background: rgba(255,255,255,.78); border: 1px solid rgba(21,21,25,.08); box-shadow: 0 18px 42px rgba(21,21,25,.06); display: flex; flex-direction: column; min-height: 570px; transition: transform .28s ease, box-shadow .28s ease; }
        .plan-card:hover { transform: translateY(-10px); box-shadow: 0 34px 70px rgba(21,21,25,.13); }
        .plan-card.featured { background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(232,247,207,.72)); border-color: rgba(113, 176, 54, .3); transform: translateY(-14px); }
        .plan-card.featured:hover { transform: translateY(-20px); }
        .badge { position: absolute; top: 22px; right: 22px; background: var(--grass); color: #17220f; border-radius: 999px; padding: 8px 12px; font-size: 11px; font-weight: 950; letter-spacing: .09em; text-transform: uppercase; }
        .plan-card > small { color: #6b727d; font-size: 11px; font-weight: 950; letter-spacing: .12em; text-transform: uppercase; }
        .plan-card h3 { margin: 18px 0 10px; font-family: 'Plus Jakarta Sans'; font-size: 32px; letter-spacing: -.065em; }
        .price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 12px; }
        .price strong { font-family: 'Plus Jakarta Sans'; font-size: 52px; letter-spacing: -.075em; }
        .price span { color: #6a727b; font-weight: 800; }
        .plan-card p { margin: 0 0 24px; color: #66707a; line-height: 1.6; font-weight: 650; }
        .plan-card ul { list-style: none; padding: 0; margin: 0 0 28px; display: grid; gap: 13px; }
        .plan-card li { display: flex; gap: 10px; align-items: flex-start; color: #414851; font-size: 14px; font-weight: 750; }
        .plan-card li::before { content: '✓'; width: 22px; height: 22px; flex: 0 0 22px; display: grid; place-items: center; border-radius: 50%; background: #e6f5d2; color: #4f7c2b; font-size: 12px; font-weight: 950; }
        .plan-card .btn { width: 100%; margin-top: auto; }

        .security-section { background: linear-gradient(180deg, rgba(217,243,246,.3), rgba(255,254,250,0)); }
        .security-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; position: relative; z-index: 1; }
        .security-tile { border-radius: 34px; padding: 32px; background: rgba(255,255,255,.76); border: 1px solid rgba(21,21,25,.08); box-shadow: 0 18px 42px rgba(21,21,25,.06); min-height: 260px; transition: transform .28s ease, box-shadow .28s ease; }
        .security-tile:hover { transform: translateY(-8px); box-shadow: 0 34px 70px rgba(21,21,25,.12); }
        .security-tile > span { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 20px; background: var(--ink); font-size: 24px; box-shadow: 0 18px 30px rgba(21,21,25,.17); }
        .security-tile h3 { margin: 24px 0 12px; font-family: 'Plus Jakarta Sans'; font-size: 25px; line-height: 1.1; letter-spacing: -.06em; }
        .security-tile p { margin: 0; color: #68707a; line-height: 1.72; font-weight: 650; }

        .faq-list { max-width: 900px; margin: 0 auto; display: grid; gap: 14px; position: relative; z-index: 1; }
        .faq-item { border-radius: 24px; background: rgba(255,255,255,.76); border: 1px solid rgba(21,21,25,.08); overflow: hidden; box-shadow: 0 14px 30px rgba(21,21,25,.05); }
        .faq-item button { width: 100%; border: 0; background: transparent; padding: 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; text-align: left; cursor: pointer; color: var(--ink); }
        .faq-item button span:first-child { font-family: 'Plus Jakarta Sans'; font-size: 18px; font-weight: 900; letter-spacing: -.04em; }
        .faq-item button span:last-child { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: rgba(21,21,25,.06); font-size: 22px; font-weight: 800; transition: transform .22s ease; }
        .faq-item.open button span:last-child { transform: rotate(45deg); }
        .faq-item p { margin: 0; padding: 0 24px 24px; color: #66707a; line-height: 1.7; font-weight: 650; }

        .final-cta { padding: 0 24px 104px; }
        .final-panel { max-width: 1180px; margin: 0 auto; text-align: center; border-radius: 48px; padding: 82px 28px; position: relative; overflow: hidden; background: linear-gradient(180deg, #d9f3f6, #e8f7cf); border: 1px solid rgba(21,21,25,.08); box-shadow: 0 30px 80px rgba(68,104,109,.14); }
        .final-panel::before, .final-panel::after { content: ''; position: absolute; border-radius: 50%; filter: blur(3px); }
        .final-panel::before { width: 220px; height: 220px; background: rgba(92,124,250,.18); left: -70px; bottom: -80px; }
        .final-panel::after { width: 260px; height: 260px; background: rgba(244,186,99,.22); right: -80px; top: -100px; }
        .final-panel > * { position: relative; z-index: 1; }
        .final-panel h2 { max-width: 850px; margin-left: auto; margin-right: auto; }
        .final-panel p { max-width: 650px; margin: 20px auto 32px; }

        .footer { padding: 72px 24px 30px; background: #151519; color: white; }
        .footer-inner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr repeat(3, .7fr); gap: 42px; }
        .footer .brand { color: white; }
        .footer p { color: rgba(255,255,255,.58); line-height: 1.7; max-width: 360px; font-weight: 650; }
        .footer h4 { margin: 4px 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: .14em; color: rgba(255,255,255,.46); }
        .footer a, .footer button { display: block; width: fit-content; border: 0; background: transparent; padding: 0; margin: 0 0 12px; color: rgba(255,255,255,.78); text-decoration: none; font: inherit; font-weight: 750; cursor: pointer; }
        .footer a:hover, .footer button:hover { color: white; }
        .footer-bottom { max-width: 1180px; margin: 56px auto 0; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.1); display: flex; justify-content: space-between; gap: 16px; color: rgba(255,255,255,.46); font-size: 13px; font-weight: 700; }

        .modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(11, 12, 16, .54); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 20px; animation: fadeIn .22s ease both; }
        .modal-card { width: min(470px, 100%); border-radius: 34px; background: var(--paper); border: 1px solid rgba(21,21,25,.08); box-shadow: 0 34px 90px rgba(0,0,0,.24); padding: 38px; position: relative; animation: popIn .28s cubic-bezier(.16,1,.3,1) both; }
        .modal-close { position: absolute; right: 18px; top: 16px; width: 38px; height: 38px; border-radius: 50%; border: 0; background: rgba(21,21,25,.06); cursor: pointer; font-size: 22px; }
        .modal-card h3 { margin: 20px 0 10px; font-family: 'Plus Jakarta Sans'; font-size: 34px; line-height: 1; letter-spacing: -.07em; }
        .modal-card p { margin: 0 0 22px; color: #66707a; line-height: 1.7; font-weight: 650; }
        .modal-card form { display: grid; gap: 12px; }
        .modal-card label { font-size: 13px; font-weight: 900; color: #4c5159; }
        .modal-card input { width: 100%; border: 1px solid rgba(21,21,25,.14); border-radius: 16px; padding: 15px 16px; font: inherit; font-weight: 750; outline: none; background: #fff; }
        .modal-card input:focus { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(92,124,250,.12); }
        .modal-card form .btn { width: 100%; margin-top: 4px; }
        .modal-success { text-align: center; }
        .modal-success > div { width: 70px; height: 70px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 24px; background: var(--grass); font-weight: 900; font-size: 34px; }

        @keyframes heroAurora { from { transform: translate3d(-2%, -1%, 0) rotate(0deg); } to { transform: translate3d(2%, 1%, 0) rotate(3deg); } }
        @keyframes cloudDrift { from { transform: translateX(-16px); } to { transform: translateX(22px); } }
        @keyframes sunPulse { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.04); opacity: 1; } }
        @keyframes birdBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes floatY { 0%, 100% { translate: 0 0; } 50% { translate: 0 -16px; } }
        @keyframes deviceFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -10px; } }
        @keyframes phoneFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -18px; } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(155,212,102,.46); } 70% { box-shadow: 0 0 0 14px rgba(155,212,102,0); } 100% { box-shadow: 0 0 0 0 rgba(155,212,102,0); } }
        @keyframes barPulse { 0%,100% { transform: scaleX(.98); } 50% { transform: scaleX(1.03); } }
        @keyframes slowSpin { to { rotate: 360deg; } }
        @keyframes nodeLift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes runner { 0% { transform: translate(0,0); } 50% { transform: translate(200px,-15px); } 100% { transform: translate(352px,6px); } }
        @keyframes cardBreathe { 0%,100% { scale: 1; } 50% { scale: 1.045; } }
        @keyframes shieldTilt { 0%,100% { transform: rotateY(-10deg); } 50% { transform: rotateY(12deg) translateY(-8px); } }
        @keyframes growBar { 0%,100% { transform: scaleY(.92); } 50% { transform: scaleY(1.06); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        @media (max-width: 1120px) {
          .feature-grid, .pricing-grid, .security-grid { grid-template-columns: repeat(2, 1fr); }
          .subscription-proof-inner { grid-template-columns: 1fr; }
          .overview-layout, .download-panel { grid-template-columns: 1fr; }
          .qr-card { width: 100%; max-width: 320px; }
          .footer-inner { grid-template-columns: 1fr 1fr; }
          .phone-float { right: calc(50% - 340px); transform: translateZ(240px) rotateY(-15deg) rotateZ(2deg) scale(.9); }
          .revenue-card { left: calc(50% - 430px); }
          .approval-card { right: calc(50% - 430px); }
        }
        @media (max-width: 860px) {
          .nav-links { display: none; }
          .hero-inner { min-height: 790px; }
          .hero-copy { padding-top: 50px; }
          .device-stage { height: 510px; }
          .device-layer { inset: 160px 0 0; }
          .laptop-wrap { width: 82vw; }
          .revenue-card, .approval-card { display: none; }
          .phone-float { right: 20px; bottom: 20px; transform: translateZ(240px) rotateY(-13deg) rotateZ(2deg) scale(.72); transform-origin: bottom right; }
          .steps-grid { grid-template-columns: 1fr; }
          .dashboard-card { transform: none; }
        }
        @media (max-width: 680px) {
          .site-header { padding: 12px 12px 0; }
          .nav-shell { height: 62px; border-radius: 19px; padding-left: 14px; }
          .brand { font-size: 18px; }
          .nav-action-light { display: none; }
          .nav-actions .btn { min-height: 40px; padding: 0 14px; font-size: 12px; }
          .hero { padding: 88px 12px 0; }
          .hero-inner { border-radius: 28px; min-height: 720px; }
          .hero-copy { padding: 42px 18px 0; }
          .hero-copy h1 { font-size: clamp(42px, 14vw, 64px); }
          .hero-copy p { font-size: 15px; }
          .hero-ctas { flex-direction: column; align-items: stretch; max-width: 310px; margin-left: auto; margin-right: auto; }
          .hero-badges { display: none; }
          .device-stage { height: 430px; }
          .device-layer { inset: 142px 0 0; }
          .laptop-wrap { width: 95vw; }
          .phone-float { right: 4px; bottom: 10px; transform: translateZ(240px) rotateY(-12deg) rotateZ(2deg) scale(.62); }
          .desktop-app { grid-template-columns: 82px 1fr; }
          .desktop-app aside { padding: 10px 8px; }
          .desktop-app aside > span:not(.logo-mark) { font-size: 8px; padding: 7px 5px; }
          .desktop-app main { padding: 10px; gap: 8px; }
          .dash-grid { grid-template-columns: 1fr; }
          .pie-card { display: none; }
          .balance-card strong { font-size: 22px; }
          .section { padding: 76px 18px; }
          .section-head { grid-template-columns: 1fr; gap: 18px; margin-bottom: 34px; }
          .feature-grid, .pricing-grid, .security-grid, .money-grid { grid-template-columns: 1fr; }
          .subscription-proof { margin-bottom: 40px; }
          .subscription-proof-inner { border-radius: 28px; padding: 22px; }
          .subscription-stat-grid { grid-template-columns: 1fr; }
          .feature-visual { height: 250px; }
          .dashboard-card { padding: 18px; border-radius: 28px; }
          .chart-box { height: 160px; padding: 14px; }
          .download-section, .final-cta { padding-left: 18px; padding-right: 18px; }
          .download-panel { padding: 28px; border-radius: 30px; }
          .dark-badges { flex-direction: column; align-items: stretch; }
          .dark-badges .store-badge { width: 100%; justify-content: center; }
          .plan-card.featured { transform: none; }
          .plan-card.featured:hover { transform: translateY(-8px); }
          .final-panel { border-radius: 30px; padding: 54px 22px; }
          .footer-inner { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; }
          .modal-card { padding: 30px 22px; border-radius: 26px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .001ms !important; }
          .device-stage { transform: none !important; }
        }
      `}</style>

      <header className="site-header">
        <nav className={scrolled ? "nav-shell" : "nav-shell not-scrolled"} aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="KreatorOS home">
            <LogoMark />
            KreatorOS
          </a>
          <div className="nav-links">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </div>
          <div className="nav-actions">
            <button className="nav-action-light" type="button" onClick={() => setShowModal(true)}>Sign in</button>
            <button className="btn btn-dark" type="button" onClick={() => setShowModal(true)}>Get Started</button>
          </div>
        </nav>
      </header>

      <section id="top" className="hero" onPointerMove={onHeroMove} onPointerLeave={() => setTilt({ rx: 0, ry: 0 })} style={heroVars}>
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="section-kicker">Kreator OS</span>
            <h1>Run your creator business on the <em>right track.</em></h1>
            <p>
              A calm operating dashboard for products, bookings, members, and brand deals — with a supervised AI operator that turns messy admin into approved workflows.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-dark" type="button" onClick={() => setShowModal(true)}>Download App</button>
              <button className="btn btn-soft" type="button" onClick={() => setShowModal(true)}>Get Started →</button>
            </div>
            <div className="hero-badges">
              <StoreBadge type="apple" />
              <StoreBadge type="google" />
              <StoreBadge type="web" />
            </div>
          </div>
          <HeroDeviceStack />
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-kicker">All features</span>
              <h2>Everything your creator business needs, inside one soft control room.</h2>
            </div>
            <p>
              A premium app-like system with clear hierarchy, friendly colors, animated mockups, and dashboards that make complex creator workflows feel simple.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-visual" style={{ background: feature.accent }}>
                  <FeatureIllustration index={index} />
                </div>
                <div className="feature-body">
                  <small>{feature.eyebrow}</small>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section overview-section">
        <div className="container overview-layout">
          <div className="overview-copy">
            <span className="section-kicker">Financial overview</span>
            <h2>Peace of mind for every product, payout, and campaign.</h2>
            <p>
              Replace scattered checkout links, untracked deals, and calendar back-and-forth with a single overview that shows what is live, what is earning, and what needs approval.
            </p>
            <div className="mini-feature-list">
              {[
                "Live revenue and offer tracking",
                "Campaign rooms with deliverables",
                "Calendar sessions and paid bookings",
                "Member storage and access rules",
              ].map((item) => (
                <div key={item}><span>✓</span>{item}</div>
              ))}
            </div>
          </div>
          <div className="dashboard-card">
            <div className="mock-panel">
              <header>
                <h3>Creator overview</h3>
                <span>ACTIVE</span>
              </header>
              <div className="money-grid">
                <div><small>Monthly revenue</small><strong>$18.4k</strong></div>
                <div><small>Open deals</small><strong>12</strong></div>
                <div><small>Tasks done</small><strong>86%</strong></div>
              </div>
              <div className="chart-box">
                {[44, 82, 56, 120, 96, 140, 72, 158, 110].map((height) => (
                  <span key={height} style={{ height }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section how-section">
        <div className="container">
          <div className="section-head center">
            <span className="section-kicker">System pipeline</span>
            <h2>From idea to production in three guided steps.</h2>
            <p>Keep the interface light, the automation supervised, and the business logic clear from first connection to approved launch.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.n} data-n={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="download-section">
        <div className="download-panel">
          <div className="qr-card">
            <div className="qr-grid" aria-label="Decorative QR code">
              {Array.from({ length: 49 }).map((_, index) => <span key={index} />)}
            </div>
            <p>Scan to join the beta</p>
          </div>
          <div className="download-copy">
            <h2>Join the creator operations revolution today.</h2>
            <p>
              Launch your mobile creator storefront, open the web dashboard, and keep the AI operator close while you approve high-impact work from anywhere.
            </p>
            <div className="dark-badges">
              <StoreBadge type="apple" />
              <StoreBadge type="google" />
              <StoreBadge type="web" />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="container">
          <SubscriptionProofSection />
          <div className="section-head center">
            <span className="section-kicker">Pricing</span>
            <h2>Plans sized for creator leverage.</h2>
            <div className="billing-toggle" role="group" aria-label="Billing interval">
              <button
                className={billingInterval === "monthly" ? "active" : ""}
                type="button"
                onClick={() => setBillingInterval("monthly")}
              >Monthly</button>
              <button
                className={billingInterval === "annual" ? "active" : ""}
                type="button"
                onClick={() => setBillingInterval("annual")}
              >Annual · Save 20%</button>
            </div>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => {
              const price = billingInterval === "monthly" ? plan.monthly : plan.annual;
              return (
                <article className={plan.featured ? "plan-card featured" : "plan-card"} key={plan.name}>
                  {plan.featured && <span className="badge">Popular</span>}
                  <small>{plan.eyebrow}</small>
                  <h3>{plan.name}</h3>
                  <div className="price">
                    <strong>{price === 0 ? "$0" : `$${price}`}</strong>
                    <span>{price === 0 ? "/ forever" : "/ month"}</span>
                  </div>
                  <p>{plan.description} {yearlySaving && price > 0 ? "Annual billing shown as monthly equivalent." : ""}</p>
                  <ul>
                    {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <button className={plan.featured ? "btn btn-green" : "btn btn-soft"} type="button" onClick={() => setShowModal(true)}>{plan.cta}</button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="security" className="section security-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-kicker">Maximum control</span>
              <h2>Secure, supervised, and built for serious creator businesses.</h2>
            </div>
            <p>
              The UI feels soft and approachable while the workflows stay explicit: you see what the operator generated, approve it, and keep ownership of the business surface.
            </p>
          </div>
          <div className="security-grid">
            {[
              ["🔒", "Approval-first actions", "No emails, invoices, calendar syncs, or CRM updates are sent without your final approval."],
              ["🧾", "Readable audit trails", "Every generated task, suggested reply, and checkout change is visible inside a clean activity timeline."],
              ["🧠", "Human-in-the-loop AI", "The operator handles repetitive work while you keep strategic control over brand and revenue decisions."],
            ].map(([icon, title, text]) => (
              <article className="security-tile" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="section-kicker">Knowledge base</span>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <article className={openFaq === index ? "faq-item open" : "faq-item"} key={faq.q}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span>{faq.q}</span>
                  <span>+</span>
                </button>
                {openFaq === index && <p>{faq.a}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-panel">
          <span className="section-kicker">Private onboarding</span>
          <h2>Create the creator business you deserve.</h2>
          <p>
            Give your audience a clean buying path, give sponsors a professional room, and give yourself one calm place to run the whole operation.
          </p>
          <button className="btn btn-dark" type="button" onClick={() => setShowModal(true)}>Reserve Workspace →</button>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <a className="brand" href="#top"><LogoMark />KreatorOS</a>
            <p>Supervised creator business automation with a friendly, app-like interface.</p>
            <div className="hero-badges" style={{ justifyContent: "flex-start" }}>
              <StoreBadge type="apple" />
              <StoreBadge type="web" />
            </div>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#features">All Features</a>
            <a href="#pricing">Pricing</a>
            <button type="button" onClick={() => setShowModal(true)}>Beta Access</button>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#security">Security</a>
            <button type="button" onClick={() => setShowModal(true)}>Contact</button>
            <button type="button" onClick={() => setShowModal(true)}>Partnerships</button>
          </div>
          <div>
            <h4>Language</h4>
            <button type="button">English</button>
            <button type="button">Deutsch</button>
            <button type="button">Español</button>
            <button type="button">Français</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} KreatorOS. All rights reserved.</span>
          <span>Privacy · Terms · AI Policy</span>
        </div>
      </footer>

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </main>
  );
}
