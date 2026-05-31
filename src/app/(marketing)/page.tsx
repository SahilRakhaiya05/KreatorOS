"use client";

import {
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Fingerprint,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  MessageSquareText,
  Play,
  Sparkles,
  Store,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import {
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BillingInterval = "monthly" | "annual";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Workflows", href: "#workflows" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

const heroMetrics = [
  ["$18.4k", "tracked revenue"],
  ["42", "tasks ready"],
  ["94%", "launch health"],
] as const;

const trustItems = ["Bio page", "Store", "Bookings", "Brand CRM", "Client portal", "AI operator", "Stripe", "Analytics"] as const;

const surfaces = [
  {
    icon: Store,
    title: "Public creator page",
    text: "A polished front door where followers can buy products, book time, join memberships, and message you.",
    tags: ["Smart Link", "Shop", "Bookings"],
    accent: "#d9f3f6",
  },
  {
    icon: Users,
    title: "Brand workspace",
    text: "Campaign rooms, creator discovery, applications, deal notes, and payout status organized around real collaborations.",
    tags: ["Campaigns", "CRM", "Payouts"],
    accent: "#e8f7cf",
  },
  {
    icon: LockKeyhole,
    title: "Client portal",
    text: "Give clients and members a calm place for files, product access, booking history, support, and follow-ups.",
    tags: ["Files", "Access", "Delivery"],
    accent: "#f5d5b9",
  },
] as const;

const operatorActions = [
  ["Draft offer page", "Ready for approval", "92%"],
  ["Follow up with sponsor", "Needs review", "74%"],
  ["Open booking slots", "Queued", "61%"],
  ["Package member files", "Synced", "88%"],
] as const;

const workflowSteps = [
  {
    n: "01",
    title: "Connect the business pieces",
    text: "Bring your public page, products, calendar, members, brand deals, and customer access into one operating layer.",
  },
  {
    n: "02",
    title: "Let AI prepare the next move",
    text: "KreatorOS drafts offers, replies, checkout flows, CRM updates, and follow-ups while keeping everything reviewable.",
  },
  {
    n: "03",
    title: "Approve, launch, measure",
    text: "You stay in control. The system ships approved actions, tracks revenue, and keeps the next priority visible.",
  },
] as const;

const featureGrid = [
  [LayoutDashboard, "Command center", "Daily revenue, deals, bookings, tasks, and launch health in one scan-friendly dashboard.", "#d9f3f6"],
  [Link2, "Smart links", "Turn social traffic into a real buying path with products, sessions, memberships, and forms.", "#e8f7cf"],
  [CreditCard, "Checkout ready", "Stripe-backed checkout routes for products, subscriptions, bookings, and campaign payments.", "#f5d5b9"],
  [CalendarDays, "Calendar flows", "Sell paid sessions, manage availability, and keep client context attached to every booking.", "#dedaff"],
  [MessageSquareText, "Relationship CRM", "Track clients, brands, applications, conversations, deliverables, and payout context.", "#d9f3f6"],
  [Fingerprint, "Access rules", "Gate paid products, member resources, portal files, and customer-only experiences cleanly.", "#e8f7cf"],
] as const;

const plans = [
  {
    name: "Launch",
    eyebrow: "Start mapping",
    monthly: 0,
    annual: 0,
    description: "For creators setting up the first serious business surface.",
    href: "/api/billing/checkout?plan=free",
    cta: "Start free",
    featured: false,
    features: ["Smart Link page", "Products and bookings", "Short links", "Basic CRM", "Creator dashboard"],
  },
  {
    name: "Operator",
    eyebrow: "Most popular",
    monthly: 20,
    annual: 16,
    description: "For creators who want AI-assisted workflows and better monetization.",
    href: "/api/billing/checkout?plan=pro",
    cta: "Start Operator",
    featured: true,
    features: ["AI operator", "Custom page themes", "Brand CRM", "Stripe checkout", "Client portal"],
  },
  {
    name: "Studio",
    eyebrow: "Agency scale",
    monthly: 99,
    annual: 79,
    description: "For brands, teams, and client-heavy creator businesses.",
    href: "mailto:hello@kreatoros.com?subject=KreatorOS%20Studio%20plan",
    cta: "Talk to sales",
    featured: false,
    features: ["Brand workspace", "Campaign rooms", "Team workflows", "Priority setup", "Advanced reporting"],
  },
] as const;

const faqs = [
  ["What does KreatorOS replace?", "It replaces the scattered stack of bio link tools, booking pages, product checkout, CRM sheets, client delivery folders, and manual follow-up lists."],
  ["Does the AI operator take actions automatically?", "No. It prepares actions and recommendations, but paid actions, outbound messages, calendar changes, and campaign updates stay approval-first."],
  ["Can I keep my current public links?", "Yes. The landing surface is designed to support stable URLs, short links, creator pages, products, bookings, and client portal routes."],
  ["Is Stripe required?", "Stripe is the checkout path for paid products, bookings, subscriptions, and campaign payments. Free pages and basic setup can still be prepared first."],
  ["Who is this for?", "Creators, educators, consultants, agencies, and brands that need a cleaner way to sell, book, manage relationships, and deliver paid access."],
] as const;

const dashboardRows = [
  ["Brand deal", "$2.4k", "74%", "#5c7cfa"],
  ["Downloads", "$860", "46%", "#9bd466"],
  ["Calls", "$1.2k", "62%", "#f4ba63"],
] as const;

/* ─── Helpers ─── */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Sub-components ─── */

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

function Cityscape() {
  return (
    <svg className="cityscape" viewBox="0 0 1400 520" role="img" aria-label="Soft illustrated landscape">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d9f3f6" />
          <stop offset="0.55" stopColor="#f8f4d8" />
          <stop offset="1" stopColor="#d9eebf" />
        </linearGradient>
        <linearGradient id="road" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffeec2" />
          <stop offset="1" stopColor="#f7d97e" />
        </linearGradient>
        <filter id="bldgShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#314155" floodOpacity="0.14" />
        </filter>
      </defs>
      <rect width="1400" height="520" rx="42" fill="url(#sky)" />
      <circle className="sun" cx="700" cy="140" r="80" fill="#fff3b5" opacity="0.92" />
      <g className="cloud cA" opacity="0.75">
        <ellipse cx="255" cy="108" rx="58" ry="22" fill="#fff" />
        <ellipse cx="310" cy="104" rx="40" ry="17" fill="#fff" />
        <ellipse cx="208" cy="115" rx="35" ry="15" fill="#fff" />
      </g>
      <g className="cloud cB" opacity="0.56">
        <ellipse cx="1080" cy="96" rx="66" ry="24" fill="#fff" />
        <ellipse cx="1138" cy="92" rx="44" ry="18" fill="#fff" />
        <ellipse cx="1030" cy="104" rx="32" ry="14" fill="#fff" />
      </g>
      <path d="M0 340C156 270 304 320 452 280C588 242 725 252 865 298C1027 352 1172 280 1400 316V520H0Z" fill="#bfe37e" />
      <path d="M0 380C174 324 305 380 466 342C633 304 822 320 988 376C1146 426 1265 360 1400 346V520H0Z" fill="#94ca5f" />
      <path d="M555 520L684 210L835 520Z" fill="url(#road)" opacity="0.94" />
      <path d="M690 260L693 310M700 355L704 425" stroke="#fff7d7" strokeWidth="8" strokeLinecap="round" strokeDasharray="30 34" opacity="0.9" />
      <path d="M0 520C125 420 276 380 455 386C322 434 252 480 222 520H0Z" fill="#dcefb2" />
      <path d="M1400 520C1268 420 1118 380 938 386C1074 434 1147 480 1178 520H1400Z" fill="#dcefb2" />
      {[
        [185, 220, 78, 148, "#aacde4"],
        [280, 180, 106, 182, "#c6d8eb"],
        [418, 240, 72, 132, "#efb6bc"],
        [510, 182, 98, 194, "#bdd4e9"],
        [800, 190, 104, 188, "#bfd9ec"],
        [934, 248, 80, 132, "#f0b7bc"],
        [1038, 172, 98, 192, "#a9cce2"],
        [1165, 242, 78, 140, "#c8ddec"],
      ].map(([xR, yR, wR, hR, fill], i) => {
        const x = Number(xR), y = Number(yR), w = Number(wR), h = Number(hR);
        return (
          <g key={i} filter="url(#bldgShadow)">
            <path d={`M${x} ${y + h}L${x + w * 0.12} ${y + 20}L${x + w} ${y}L${x + w * 0.88} ${y + h}Z`} fill={String(fill)} />
            <path d={`M${x + w * 0.75} ${y + 24}C${x + w * 0.96} ${y + 4} ${x + w + 14} ${y + 24} ${x + w * 0.86} ${y + 44}C${x + w + 18} ${y + 40} ${x + w + 24} ${y + 60} ${x + w * 0.79} ${y + 58}Z`} fill="#7fbd53" />
            {Array.from({ length: 4 }).map((_, d) => (
              <circle key={d} cx={x + 20 + d * 16} cy={y + 50 + (d % 2) * 24} r="4" fill="#fff" opacity="0.4" />
            ))}
          </g>
        );
      })}
      {[205, 362, 512, 875, 1066, 1206].map((bx, i) => (
        <path key={bx} className="bird" style={{ animationDelay: `${i * 0.4}s` }} d={`M${bx} ${130 + (i % 2) * 24}q16 12 32 0q16 -12 32 0`} fill="none" stroke="#687989" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
      ))}
    </svg>
  );
}

function DashboardMockup() {
  return (
    <div className="laptop" aria-label="KreatorOS desktop dashboard">
      <div className="laptop-screen">
        <img
          src="/landing_laptop.png"
          alt="KreatorOS desktop dashboard"
          style={{ width: "100%", height: "100%", borderRadius: "10px", objectFit: "cover", display: "block" }}
        />
      </div>
      <div className="laptop-base" />
    </div>
  );
}

function PhoneMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "phone compact" : "phone"} aria-label="KreatorOS mobile preview">
      <div className="phone-rim" />
      <div className="phone-island" />
      <div className="phone-screen" style={{ padding: 0 }}>
        <img
          src="/landing_mobile.png"
          alt="KreatorOS mobile preview"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    </div>
  );
}

function FloatingRevenue() {
  return (
    <div className="float-card revenue-fc">
      <small>Operator saved</small>
      <strong>26h</strong>
      <span>this month</span>
    </div>
  );
}

function FloatingApproval() {
  return (
    <div className="float-card approval-fc">
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
      <Cityscape />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="device-layer">
        <FloatingRevenue />
        <DashboardMockup />
        <div className="phone-float"><PhoneMockup compact /></div>
        <FloatingApproval />
      </div>
    </div>
  );
}

function Modal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 800);
  };
  return (
    <div className="modal-bg" role="dialog" aria-modal="true">
      <div className="modal-card">
        <button className="modal-x" onClick={onClose} type="button" aria-label="Close">×</button>
        {!done ? (
          <>
            <span className="kicker">Private beta</span>
            <h3>Get your creator workspace ready.</h3>
            <p>Enter your business email and we'll reserve a polished KreatorOS setup for your launch.</p>
            <form onSubmit={submit}>
              <label htmlFor="beta-email">Business email</label>
              <input id="beta-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@brand.com" type="email" required />
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Preparing workspace..." : "Request access →"}</button>
            </form>
          </>
        ) : (
          <div className="modal-ok">
            <div>✓</div>
            <h3>Workspace reserved.</h3>
            <p>We logged <strong>{email}</strong> for onboarding. Your setup link will be sent shortly.</p>
            <button className="btn btn-primary" type="button" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function MarketingPage() {
  const [billing, setBilling] = useState<BillingInterval>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const productSec = useInView();
  const workflowSec = useInView();
  const featureSec = useInView();
  const pricingSec = useInView();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const onHeroMove = (e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: +(-y * 7).toFixed(2), ry: +(x * 9).toFixed(2) });
  };

  const heroVars = { "--rx": `${tilt.rx}deg`, "--ry": `${tilt.ry}deg` } as CSSProperties;

  const visiblePlans = useMemo(
    () => plans.map(p => ({ ...p, price: billing === "annual" ? p.annual : p.monthly })),
    [billing],
  );

  return (
    <main className="kreo">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
          --ink: #151519;
          --muted: #6e737c;
          --line: rgba(21,21,25,0.10);
          --paper: #fffefa;
          --cream: #fbf7e9;
          --sky: #d9f3f6;
          --mint: #e8f7cf;
          --grass: #9bd466;
          --blue: #5c7cfa;
          --orange: #f4ba63;
          --pink: #f5b7bb;
          --violet: #8b7cf6;
          --cyan: #2dd4bf;
          --shadow: 0 28px 80px rgba(38,44,63,0.14);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }

        .kreo {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 4%, rgba(217,243,246,0.72), transparent 30%),
            radial-gradient(circle at 90% 8%, rgba(232,247,207,0.9), transparent 30%),
            var(--paper);
          color: var(--ink);
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          line-height: 1.6;
        }

        .kreo h1, .kreo h2, .kreo h3 {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          letter-spacing: -0.06em;
          line-height: 1;
        }

        /* ─── Utility ─── */
        .container { max-width: 1180px; margin: 0 auto; }

        .section {
          padding: 104px 24px;
          position: relative;
        }

        .section::before {
          content: '';
          position: absolute;
          inset: 0 auto auto 50%;
          width: 640px;
          height: 320px;
          translate: -50% 0;
          background: radial-gradient(circle, rgba(92,124,250,0.07), transparent 62%);
          pointer-events: none;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(21,21,25,0.12);
          border-radius: 999px;
          background: rgba(255,255,255,0.68);
          padding: 7px 14px;
          color: #32343a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0 14px 34px rgba(21,21,25,0.05);
          backdrop-filter: blur(14px);
        }

        .kicker::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--grass);
          box-shadow: 0 0 0 5px rgba(155,212,102,0.16);
        }

        /* ─── Header ─── */
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
          border: 1px solid rgba(21,21,25,0.08);
          border-radius: 22px;
          background: rgba(255,254,250,0.78);
          box-shadow: 0 18px 50px rgba(26,31,44,0.10);
          backdrop-filter: blur(20px);
          padding: 0 12px 0 20px;
          transition: background 0.25s ease, box-shadow 0.25s ease;
        }

        .nav-shell.top {
          box-shadow: 0 10px 30px rgba(26,31,44,0.04);
          background: rgba(255,254,250,0.66);
        }

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
          background: #fff;
          border: 1px solid rgba(21,21,25,0.10);
          box-shadow: inset 0 -5px 10px rgba(21,21,25,0.04), 0 10px 18px rgba(21,21,25,0.07);
        }

        .logo-mark span { position: absolute; border-radius: 999px; }
        .logo-mark span:nth-child(1) { width: 17px; height: 17px; left: 7px; top: 8px; background: var(--grass); }
        .logo-mark span:nth-child(2) { width: 15px; height: 15px; right: 6px; bottom: 6px; background: var(--blue); opacity: 0.92; }
        .logo-mark span:nth-child(3) { width: 10px; height: 10px; left: 9px; bottom: 7px; background: var(--orange); }

        .nav-links { display: flex; align-items: center; gap: 6px; }

        .nav-links a {
          color: #454851;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          padding: 12px 13px;
          border-radius: 999px;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .nav-links a:hover { background: rgba(21,21,25,0.05); color: var(--ink); transform: translateY(-1px); }

        .nav-actions { display: flex; align-items: center; gap: 8px; }

        .nav-sign {
          border: 0;
          background: transparent;
          color: #454851;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          padding: 12px 13px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .nav-sign:hover { background: rgba(21,21,25,0.05); color: var(--ink); }

        /* ─── Buttons ─── */
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
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 900;
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
          text-decoration: none;
          white-space: nowrap;
        }

        .btn:hover { transform: translateY(-2px); }
        .btn:active { transform: translateY(0); }

        .btn-primary {
          background: var(--ink);
          color: #fff;
          box-shadow: 0 12px 24px rgba(21,21,25,0.16);
        }

        .btn-primary:hover { background: #000; box-shadow: 0 16px 34px rgba(21,21,25,0.20); }

        .btn-soft {
          background: rgba(255,255,255,0.78);
          color: var(--ink);
          border: 1px solid rgba(21,21,25,0.10);
          box-shadow: 0 12px 28px rgba(21,21,25,0.06);
        }

        .btn-soft:hover { background: #fff; }

        .btn-green {
          background: var(--grass);
          color: #15210e;
          box-shadow: 0 14px 34px rgba(100,164,45,0.18);
        }

        .btn-green:hover { box-shadow: 0 18px 44px rgba(100,164,45,0.24); }

        /* ─── Hero ─── */
        .hero { position: relative; padding: 128px 24px 0; perspective: 1800px; }

        .hero-inner {
          position: relative;
          max-width: 1240px;
          min-height: 1020px;
          margin: 0 auto;
          border-radius: 42px;
          overflow: hidden;
          border: 1px solid rgba(21,21,25,0.08);
          background: linear-gradient(180deg, #d9f3f6 0%, #f5f4d9 55%, #dcefbf 100%);
          box-shadow: 0 36px 110px rgba(68,104,109,0.16);
          transform-style: preserve-3d;
          isolation: isolate;
        }

        .hero-inner::before {
          content: '';
          position: absolute;
          inset: -22%;
          background:
            radial-gradient(circle at 26% 22%, rgba(255,255,255,0.72), transparent 26%),
            radial-gradient(circle at 72% 18%, rgba(255,236,181,0.62), transparent 24%),
            radial-gradient(circle at 50% 80%, rgba(92,124,250,0.18), transparent 28%);
          pointer-events: none;
          animation: aurora 11s ease-in-out infinite alternate;
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
          font-size: clamp(48px, 7vw, 98px);
          line-height: 0.94;
          font-weight: 900;
          letter-spacing: -0.08em;
          max-width: 980px;
          text-wrap: balance;
        }

        .hero-copy h1 em {
          font-style: normal;
          color: #4f6df3;
          text-shadow: 0 18px 40px rgba(92,124,250,0.16);
        }

        .hero-copy > p {
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
          border: 1px solid rgba(21,21,25,0.12);
          background: rgba(255,255,255,0.74);
          border-radius: 999px;
          padding: 0 15px 0 12px;
          color: var(--ink);
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(21,21,25,0.06);
          backdrop-filter: blur(12px);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .store-badge:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 16px 34px rgba(21,21,25,0.10); }

        .store-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--ink);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 13px;
        }

        .store-badge small, .store-badge strong { display: block; text-align: left; line-height: 1.05; }
        .store-badge small { font-size: 10px; color: var(--muted); font-weight: 800; }
        .store-badge strong { font-size: 13px; font-weight: 900; }

        /* ─── Device Stage ─── */
        .device-stage {
          position: absolute;
          inset: auto 0 0;
          height: 590px;
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
          transform-style: preserve-3d;
          transition: transform 0.16s ease-out;
        }

        .cityscape {
          position: absolute;
          inset: auto 0 0;
          width: 100%;
          height: 570px;
          object-fit: cover;
          transform: translateZ(-60px) scale(1.05);
        }

        .cloud { animation: cloudDrift 14s ease-in-out infinite alternate; }
        .cB { animation-duration: 17s; animation-delay: -3s; }
        .sun { animation: sunPulse 5s ease-in-out infinite; transform-origin: center; }
        .bird { animation: birdBob 3.2s ease-in-out infinite; }

        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(0.2px) drop-shadow(0 20px 28px rgba(21,21,25,0.18));
          transform-style: preserve-3d;
        }

        .orb-a {
          width: 66px; height: 66px;
          left: 13%; bottom: 182px;
          background: linear-gradient(135deg, #fff6c9, #f4ba63);
          transform: translateZ(120px);
          animation: floatY 5s ease-in-out infinite;
        }

        .orb-b {
          width: 42px; height: 42px;
          right: 18%; bottom: 260px;
          background: linear-gradient(135deg, #fff, #9bd466);
          transform: translateZ(110px);
          animation: floatY 6.6s ease-in-out infinite reverse;
        }

        .device-layer {
          position: absolute;
          inset: 168px 0 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
          transform-style: preserve-3d;
        }

        /* ─── Laptop ─── */
        .laptop {
          width: min(704px, 62vw);
          position: relative;
          filter: drop-shadow(0 34px 44px rgba(31,41,55,0.24));
          transform: translateZ(130px) rotateX(4deg);
          animation: deviceFloat 6s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .laptop-screen {
          aspect-ratio: 16/10;
          background: linear-gradient(180deg, #21212a, #0f0f15);
          border-radius: 22px 22px 12px 12px;
          padding: 14px;
          border: 2px solid #202027;
          box-shadow: inset 0 2px 0 rgba(255,255,255,0.14);
          position: relative;
        }

        .laptop-screen::before {
          content: '';
          position: absolute;
          inset: 14px;
          border-radius: 13px;
          background: linear-gradient(120deg, rgba(255,255,255,0.16), transparent 28%);
          pointer-events: none;
          z-index: 2;
        }

        .laptop-base {
          height: 28px;
          width: 114%;
          margin-left: -7%;
          border-radius: 0 0 48px 48px;
          background: linear-gradient(180deg, #2b2b36, #09090d);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 18px 24px rgba(0,0,0,0.13);
          position: relative;
        }

        .laptop-base::after {
          content: '';
          position: absolute;
          left: 50%; top: 0;
          translate: -50% 0;
          width: 130px; height: 9px;
          border-radius: 0 0 16px 16px;
          background: rgba(255,255,255,0.16);
        }

        .desk-app {
          height: 100%;
          display: grid;
          grid-template-columns: 134px 1fr;
          background: #f8fbff;
          border-radius: 12px;
          overflow: hidden;
        }

        .desk-app aside {
          background: rgba(255,255,255,0.93);
          padding: 18px 12px;
          border-right: 1px solid rgba(21,21,25,0.08);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .desk-app aside .logo-mark { width: 28px; height: 28px; margin-bottom: 8px; }

        .desk-app aside > span:not(.logo-mark) {
          font-size: 11px;
          color: #747985;
          font-weight: 850;
          padding: 9px 10px;
          border-radius: 9px;
        }

        .desk-app aside > span.active {
          background: #eef3ff;
          color: var(--blue);
          box-shadow: inset 0 0 0 1px rgba(92,124,250,0.08);
        }

        .desk-app main { padding: 18px; display: flex; flex-direction: column; gap: 13px; }

        .desk-top { display: flex; justify-content: space-between; align-items: center; }
        .desk-top small, .bal-card small, .pie-card small { color: #9298a5; font-size: 10px; font-weight: 850; }
        .desk-top strong { display: block; font-size: 15px; }

        .desk-top button {
          border: 0;
          background: var(--ink);
          color: #fff;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 900;
          font-size: 11px;
        }

        .bal-card {
          background: linear-gradient(135deg, #e9f8fb, #fff);
          border: 1px solid rgba(21,21,25,0.07);
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 18px 34px rgba(48,91,116,0.07);
        }

        .bal-card strong { display: block; font-size: 31px; margin: 5px 0 12px; letter-spacing: -0.05em; }

        .blue-bar { height: 11px; border-radius: 999px; background: #e5e7f0; overflow: hidden; }

        .blue-bar span {
          display: block;
          width: 76%;
          height: 100%;
          background: linear-gradient(90deg, var(--blue), #92a8ff);
          border-radius: inherit;
          animation: barPulse 2.8s ease-in-out infinite;
        }

        .dash-grid { display: grid; grid-template-columns: 0.86fr 1.14fr; gap: 13px; flex: 1; }

        .pie-card, .row-card {
          background: #fff;
          border: 1px solid rgba(21,21,25,0.07);
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 14px 26px rgba(21,21,25,0.05);
        }

        .pie-card { display: flex; align-items: center; gap: 12px; }

        .donut {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: conic-gradient(var(--blue) 0 38%, var(--grass) 38% 66%, var(--orange) 66% 83%, var(--pink) 83% 100%);
          position: relative;
          flex-shrink: 0;
          animation: slowSpin 8s linear infinite;
        }

        .donut::after {
          content: '';
          position: absolute;
          inset: 18px;
          background: #fff;
          border-radius: 50%;
        }

        .pie-card strong { display: block; font-size: 13px; margin-bottom: 3px; }

        .row-card { display: flex; flex-direction: column; justify-content: center; gap: 13px; }

        .row-card div {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 5px 8px;
          align-items: center;
          font-size: 11px;
          font-weight: 850;
          color: #626976;
        }

        .row-card strong { color: var(--ink); }

        .row-card em {
          grid-column: 1 / -1;
          height: 7px;
          border-radius: 99px;
          background: #eef0f5;
          overflow: hidden;
        }

        .row-card i { display: block; height: 100%; border-radius: inherit; }

        /* ─── Phone ─── */
        .phone-float {
          position: absolute;
          right: calc(50% - 432px);
          bottom: 32px;
          filter: drop-shadow(0 28px 34px rgba(21,21,25,0.28));
          transform: translateZ(240px) rotateY(-15deg) rotateZ(2deg);
          animation: phoneFloat 6.8s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .phone {
          width: 232px; height: 462px;
          border-radius: 44px;
          padding: 10px;
          background: linear-gradient(145deg, #2b2b34, #09090e 55%, #24242b);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), inset 8px 0 18px rgba(255,255,255,0.04), 0 34px 52px rgba(21,21,25,0.28);
          position: relative;
          transform-style: preserve-3d;
        }

        .phone::after {
          content: '';
          position: absolute;
          inset: 7px;
          border-radius: 38px;
          background: linear-gradient(125deg, rgba(255,255,255,0.16), transparent 32%);
          pointer-events: none;
          z-index: 4;
        }

        .phone-rim {
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.18);
          pointer-events: none;
        }

        .phone.compact { width: 196px; height: 392px; }

        .phone-island {
          position: absolute;
          top: 20px; left: 50%;
          transform: translateX(-50%);
          width: 70px; height: 20px;
          border-radius: 999px;
          background: #07070a;
          z-index: 5;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .phone-screen {
          width: 100%; height: 100%;
          border-radius: 35px;
          background: linear-gradient(180deg, #e9f9f8, #f7f8fc 43%, #fff 100%);
          padding: 42px 15px 15px;
          overflow: hidden;
          position: relative;
        }

        .phone-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 70% 8%, rgba(155,212,102,0.36), transparent 26%);
          pointer-events: none;
        }

        .phone.compact .phone-screen { border-radius: 31px; padding: 38px 13px 13px; }

        .ph-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #333;
          font-weight: 900;
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
        }

        .ph-topbar span, .ph-topbar b {
          width: 31px; height: 31px;
          border-radius: 50%;
          background: rgba(255,255,255,0.78);
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .ph-title { position: relative; z-index: 1; }
        .ph-title small { color: #6d7680; font-size: 9px; font-weight: 900; letter-spacing: 0.11em; }

        .phone h4 {
          margin: 2px 0 0;
          font-size: 20px;
          letter-spacing: -0.05em;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .phone.compact h4 { font-size: 16px; }
        .phone p { margin: 4px 0 14px; font-size: 12px; color: #7b838d; font-weight: 750; }

        .ph-budget {
          position: relative;
          z-index: 1;
          background: #151519;
          color: #fff;
          border-radius: 24px;
          padding: 17px;
          margin-bottom: 12px;
          box-shadow: 0 18px 32px rgba(21,21,25,0.20);
        }

        .phone.compact .ph-budget { padding: 13px; border-radius: 20px; }
        .ph-budget small { color: rgba(255,255,255,0.56); font-size: 10px; font-weight: 850; }

        .ph-budget strong {
          display: block;
          font-size: 28px;
          letter-spacing: -0.06em;
          margin: 4px 0 13px;
        }

        .phone.compact .ph-budget strong { font-size: 23px; }

        .ph-budget > div {
          height: 9px;
          background: rgba(255,255,255,0.16);
          border-radius: 999px;
          overflow: hidden;
        }

        .ph-budget > div span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, var(--grass), #dff3b8);
          border-radius: inherit;
          animation: barPulse 3s ease-in-out infinite;
        }

        .ph-budget footer {
          margin-top: 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: rgba(255,255,255,0.58);
        }

        .ph-budget footer b { color: #fff; font-size: 11px; }

        .ph-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 9px;
          position: relative;
          z-index: 1;
        }

        .ph-tabs span {
          flex: 1;
          text-align: center;
          border-radius: 999px;
          background: rgba(21,21,25,0.06);
          padding: 7px 0;
          font-size: 9px;
          font-weight: 900;
        }

        .ph-tabs span:first-child { background: var(--grass); }

        .ph-list {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 28px 1fr auto;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(21,21,25,0.06);
          border-radius: 16px;
          padding: 10px;
          margin-bottom: 7px;
          box-shadow: 0 9px 20px rgba(21,21,25,0.04);
        }

        .phone.compact .ph-list { grid-template-columns: 24px 1fr auto; padding: 8px; border-radius: 14px; gap: 7px; }
        .ph-list > span { width: 28px; height: 28px; border-radius: 10px; }
        .phone.compact .ph-list > span { width: 24px; height: 24px; border-radius: 9px; }
        .ph-list strong { font-size: 11px; }
        .ph-list b { font-size: 11px; color: #5b6370; }

        /* ─── Float Cards ─── */
        .float-card {
          position: absolute;
          z-index: 3;
          border: 1px solid rgba(21,21,25,0.09);
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(16px);
          border-radius: 22px;
          box-shadow: 0 24px 42px rgba(21,21,25,0.13);
          pointer-events: none;
          transform-style: preserve-3d;
        }

        .revenue-fc {
          left: calc(50% - 520px);
          bottom: 104px;
          padding: 18px 22px;
          transform: translateZ(280px) rotateY(18deg) rotateX(8deg);
          animation: floatY 5.8s ease-in-out infinite;
        }

        .revenue-fc small, .approval-fc small {
          display: block;
          color: #707782;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .revenue-fc strong {
          display: block;
          font-size: 38px;
          letter-spacing: -0.07em;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .revenue-fc span { color: #59616c; font-size: 12px; font-weight: 800; }

        .approval-fc {
          right: calc(50% - 520px);
          bottom: 152px;
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 15px 17px;
          transform: translateZ(300px) rotateY(-20deg) rotateX(7deg);
          animation: floatY 6.4s ease-in-out infinite reverse;
        }

        .approval-fc strong { display: block; font-size: 13px; }

        .pulse-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--grass);
          box-shadow: 0 0 0 0 rgba(155,212,102,0.5);
          animation: pulse 1.8s infinite;
        }

        /* ─── Section Headings ─── */
        .section-head {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.08fr 0.72fr;
          gap: 40px;
          align-items: end;
          margin-bottom: 48px;
        }

        .section-head.center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 780px;
          margin-left: auto;
          margin-right: auto;
        }

        .section-head h2,
        .overview-copy h2,
        .download-copy h2,
        .final-panel h2 {
          margin: 16px 0 0;
          font-size: clamp(36px, 5vw, 66px);
          line-height: 1;
          font-weight: 900;
          text-wrap: balance;
        }

        .section-head p,
        .overview-copy p,
        .download-copy p,
        .final-panel p {
          color: #666d78;
          line-height: 1.75;
          font-size: 16px;
          font-weight: 650;
          margin: 0;
        }

        .section-head.center p { max-width: 660px; }

        /* ─── Feature Grid ─── */
        .feature-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .feature-card {
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(21,21,25,0.08);
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 18px 42px rgba(21,21,25,0.06);
          transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), box-shadow 0.32s ease, border-color 0.32s ease;
        }

        .feature-card:hover {
          transform: translateY(-10px) rotateX(2deg);
          box-shadow: 0 34px 70px rgba(21,21,25,0.12);
          border-color: rgba(21,21,25,0.16);
        }

        .feature-vis {
          height: 240px;
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
        }

        .feature-vis::before {
          content: '';
          position: absolute;
          inset: 12%;
          border-radius: 50%;
          background: rgba(255,255,255,0.36);
          filter: blur(24px);
        }

        .feature-vis svg { position: relative; z-index: 1; color: var(--ink); opacity: 0.7; }

        .feature-body { padding: 24px 24px 28px; }

        .feature-body small {
          color: #737b85;
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.11em;
        }

        .feature-body h3 {
          margin: 10px 0 10px;
          font-size: 22px;
          line-height: 1.08;
          letter-spacing: -0.055em;
        }

        .feature-body p { margin: 0; color: #66707a; line-height: 1.62; font-size: 14px; font-weight: 620; }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .feature-tag {
          border-radius: 999px;
          padding: 5px 12px;
          background: rgba(21,21,25,0.05);
          font-size: 11px;
          font-weight: 700;
          color: #4c5159;
        }

        /* ─── Overview ─── */
        .overview-section { background: linear-gradient(180deg, rgba(251,247,233,0), rgba(232,247,207,0.35)); }

        .overview-layout {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 48px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .overview-copy p { margin-top: 20px; }

        .mini-list { margin-top: 28px; display: grid; gap: 12px; }

        .mini-list div {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 850;
          color: #3d444c;
          font-size: 14px;
        }

        .mini-list span {
          width: 28px; height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--grass);
          box-shadow: 0 12px 22px rgba(105,170,48,0.16);
          color: #15210e;
          font-size: 13px;
          font-weight: 900;
        }

        .dash-card {
          border-radius: 42px;
          padding: 26px;
          background: linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.42));
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: var(--shadow);
          transform: perspective(1000px) rotateY(-7deg) rotateX(3deg);
          transform-style: preserve-3d;
        }

        .mock-panel {
          border-radius: 30px;
          padding: 24px;
          background: #f9fbff;
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
        }

        .mock-panel header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .mock-panel h3 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.06em;
        }

        .mock-panel header span {
          border-radius: 999px;
          background: #e6f5d2;
          color: #406b23;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
        }

        .money-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }

        .money-grid div {
          background: #fff;
          border: 1px solid rgba(21,21,25,0.07);
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 14px 28px rgba(21,21,25,0.05);
        }

        .money-grid small { color: #7b838d; font-weight: 850; }
        .money-grid strong { display: block; margin-top: 8px; font-size: 28px; font-family: 'Plus Jakarta Sans'; letter-spacing: -0.06em; }

        .chart-box {
          height: 250px;
          border-radius: 26px;
          background: linear-gradient(180deg, #eef9fb, #fff);
          border: 1px solid rgba(21,21,25,0.07);
          padding: 22px;
          display: flex;
          align-items: end;
          gap: 12px;
          overflow: hidden;
          position: relative;
        }

        .chart-box::before {
          content: '';
          position: absolute;
          inset: 24px;
          background-image: linear-gradient(rgba(21,21,25,0.05) 1px, transparent 1px);
          background-size: 100% 44px;
        }

        .chart-box span {
          position: relative;
          z-index: 1;
          flex: 1;
          max-width: 46px;
          border-radius: 16px 16px 6px 6px;
          background: linear-gradient(180deg, var(--blue), #b4c1ff);
          box-shadow: 0 14px 24px rgba(92,124,250,0.18);
          animation: growBar 5s ease-in-out infinite;
          transform-origin: bottom;
        }

        .chart-box span:nth-child(2n) { background: linear-gradient(180deg, var(--grass), #dff3b8); animation-delay: -0.8s; }
        .chart-box span:nth-child(3n) { background: linear-gradient(180deg, var(--orange), #ffdf9b); animation-delay: -1.4s; }

        /* ─── Workflow / Steps ─── */
        .workflow-section { background: var(--cream); }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          position: relative;
          z-index: 1;
        }

        .step-card {
          position: relative;
          min-height: 310px;
          padding: 34px;
          overflow: hidden;
          border-radius: 34px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: 0 18px 42px rgba(21,21,25,0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .step-card:hover { transform: translateY(-8px); box-shadow: 0 34px 70px rgba(21,21,25,0.12); }

        .step-card::after {
          content: attr(data-n);
          position: absolute;
          right: 22px; bottom: -18px;
          font-family: 'Plus Jakarta Sans';
          font-size: 140px;
          font-weight: 900;
          letter-spacing: -0.1em;
          color: rgba(21,21,25,0.045);
        }

        .step-card > span {
          width: 54px; height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: var(--ink);
          color: #fff;
          font-weight: 950;
          font-size: 16px;
          box-shadow: 0 18px 30px rgba(21,21,25,0.17);
        }

        .step-card h3 {
          position: relative;
          margin: 24px 0 12px;
          font-size: 26px;
          line-height: 1.08;
          letter-spacing: -0.06em;
          z-index: 1;
        }

        .step-card p {
          position: relative;
          margin: 0;
          color: #68707a;
          line-height: 1.72;
          font-weight: 650;
          z-index: 1;
        }

        /* ─── Download Panel ─── */
        .download-section { padding: 32px 24px 104px; }

        .download-panel {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 36px;
          align-items: center;
          border-radius: 44px;
          padding: 48px;
          background:
            radial-gradient(circle at 15% 20%, rgba(155,212,102,0.28), transparent 30%),
            linear-gradient(135deg, #151519, #2a2f38);
          color: #fff;
          overflow: hidden;
          position: relative;
          box-shadow: 0 36px 90px rgba(21,21,25,0.25);
        }

        .download-panel::after {
          content: '';
          position: absolute;
          right: -120px; top: -120px;
          width: 360px; height: 360px;
          border-radius: 50%;
          background: rgba(92,124,250,0.2);
          filter: blur(10px);
        }

        .qr-card {
          position: relative;
          z-index: 1;
          width: 286px;
          aspect-ratio: 1;
          border-radius: 34px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          display: grid;
          place-items: center;
          align-content: center;
          gap: 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 26px 50px rgba(0,0,0,0.22);
          transform: perspective(800px) rotateY(12deg) rotateX(5deg);
        }

        .qr-grid {
          width: 150px; height: 150px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          padding: 10px;
          border-radius: 22px;
          background: #fff;
        }

        .qr-grid span { border-radius: 5px; background: var(--ink); opacity: 0.12; }
        .qr-grid span:nth-child(2n), .qr-grid span:nth-child(5n), .qr-grid span:nth-child(9n) { opacity: 0.95; }
        .qr-card p { margin: 0; color: rgba(255,255,255,0.72); font-weight: 850; }

        .download-copy { position: relative; z-index: 1; }
        .download-copy h2 { color: #fff; margin-top: 0; max-width: 690px; }
        .download-copy p { color: rgba(255,255,255,0.68); max-width: 680px; margin-top: 20px; }

        .dark-badges { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }

        .dark-badges .store-badge {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-color: rgba(255,255,255,0.14);
        }

        .dark-badges .store-badge small { color: rgba(255,255,255,0.56); }
        .dark-badges .store-icon { background: #fff; color: var(--ink); }

        /* ─── Pricing ─── */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          position: relative;
          z-index: 1;
          align-items: start;
        }

        .billing-toggle {
          display: inline-flex;
          padding: 5px;
          gap: 5px;
          border-radius: 999px;
          background: rgba(21,21,25,0.08);
          margin-top: 24px;
        }

        .billing-toggle button {
          border: 0;
          border-radius: 999px;
          padding: 10px 17px;
          background: transparent;
          color: #5f6670;
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .billing-toggle button.active {
          background: #fff;
          color: var(--ink);
          box-shadow: 0 10px 20px rgba(21,21,25,0.08);
        }

        .plan-card {
          position: relative;
          border-radius: 34px;
          padding: 32px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: 0 18px 42px rgba(21,21,25,0.06);
          display: flex;
          flex-direction: column;
          min-height: 570px;
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .plan-card:hover { transform: translateY(-10px); box-shadow: 0 34px 70px rgba(21,21,25,0.13); }

        .plan-card.featured {
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(232,247,207,0.72));
          border-color: rgba(113,176,54,0.3);
          transform: translateY(-14px);
        }

        .plan-card.featured:hover { transform: translateY(-20px); }

        .badge {
          position: absolute;
          top: 22px; right: 22px;
          background: var(--grass);
          color: #17220f;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .plan-card > small {
          color: #6b727d;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .plan-card h3 {
          margin: 18px 0 10px;
          font-size: 32px;
          letter-spacing: -0.065em;
        }

        .price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 12px; }

        .price strong {
          font-family: 'Plus Jakarta Sans';
          font-size: 52px;
          letter-spacing: -0.075em;
        }

        .price span { color: #6a727b; font-weight: 800; }

        .plan-card p { margin: 0 0 24px; color: #66707a; line-height: 1.6; font-weight: 650; }

        .plan-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: grid;
          gap: 13px;
        }

        .plan-card li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: #414851;
          font-size: 14px;
          font-weight: 750;
        }

        .plan-card li::before {
          content: '✓';
          width: 22px; height: 22px;
          flex: 0 0 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #e6f5d2;
          color: #4f7c2b;
          font-size: 12px;
          font-weight: 950;
        }

        .plan-card .btn { width: 100%; margin-top: auto; }

        /* ─── Security ─── */
        .security-section { background: linear-gradient(180deg, rgba(217,243,246,0.3), rgba(255,254,250,0)); }

        .security-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          position: relative;
          z-index: 1;
        }

        .security-tile {
          border-radius: 34px;
          padding: 32px;
          background: rgba(255,255,255,0.76);
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: 0 18px 42px rgba(21,21,25,0.06);
          min-height: 260px;
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .security-tile:hover { transform: translateY(-8px); box-shadow: 0 34px 70px rgba(21,21,25,0.12); }

        .security-tile > span {
          width: 56px; height: 56px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: var(--ink);
          font-size: 24px;
          box-shadow: 0 18px 30px rgba(21,21,25,0.17);
        }

        .security-tile h3 {
          margin: 24px 0 12px;
          font-size: 25px;
          line-height: 1.1;
          letter-spacing: -0.06em;
        }

        .security-tile p { margin: 0; color: #68707a; line-height: 1.72; font-weight: 650; }

        /* ─── FAQ ─── */
        .faq-list {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          gap: 14px;
          position: relative;
          z-index: 1;
        }

        .faq-item {
          border-radius: 24px;
          background: rgba(255,255,255,0.76);
          border: 1px solid rgba(21,21,25,0.08);
          overflow: hidden;
          box-shadow: 0 14px 30px rgba(21,21,25,0.05);
        }

        .faq-item button {
          width: 100%;
          border: 0;
          background: transparent;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          text-align: left;
          cursor: pointer;
          color: var(--ink);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .faq-toggle {
          width: 34px; height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(21,21,25,0.06);
          font-size: 22px;
          font-weight: 800;
          transition: transform 0.22s ease;
          flex-shrink: 0;
        }

        .faq-item.open .faq-toggle { transform: rotate(45deg); }

        .faq-item p {
          margin: 0;
          padding: 0 24px 24px;
          color: #66707a;
          line-height: 1.7;
          font-weight: 650;
          font-size: 15px;
        }

        /* ─── Final CTA ─── */
        .final-cta { padding: 0 24px 104px; }

        .final-panel {
          max-width: 1180px;
          margin: 0 auto;
          text-align: center;
          border-radius: 48px;
          padding: 82px 28px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #d9f3f6, #e8f7cf);
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: 0 30px 80px rgba(68,104,109,0.14);
        }

        .final-panel::before, .final-panel::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(3px);
        }

        .final-panel::before { width: 220px; height: 220px; background: rgba(92,124,250,0.18); left: -70px; bottom: -80px; }
        .final-panel::after { width: 260px; height: 260px; background: rgba(244,186,99,0.22); right: -80px; top: -100px; }
        .final-panel > * { position: relative; z-index: 1; }
        .final-panel h2 { max-width: 850px; margin-left: auto; margin-right: auto; }
        .final-panel p { max-width: 650px; margin: 20px auto 32px; }

        /* ─── Footer ─── */
        .site-footer {
          padding: 72px 24px 30px;
          background: #151519;
          color: #fff;
        }

        .footer-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr repeat(3, 0.7fr);
          gap: 42px;
        }

        .site-footer .brand { color: #fff; }
        .site-footer p { color: rgba(255,255,255,0.58); line-height: 1.7; max-width: 360px; font-weight: 650; font-size: 14px; }

        .site-footer h4 {
          margin: 4px 0 16px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.46);
        }

        .site-footer a {
          display: block;
          width: fit-content;
          margin: 0 0 12px;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          font-weight: 750;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .site-footer a:hover { color: #fff; }

        .footer-bottom {
          max-width: 1180px;
          margin: 56px auto 0;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.10);
          display: flex;
          justify-content: space-between;
          gap: 16px;
          color: rgba(255,255,255,0.46);
          font-size: 13px;
          font-weight: 700;
        }

        /* ─── Modal ─── */
        .modal-bg {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(11,12,16,0.54);
          backdrop-filter: blur(10px);
          display: grid;
          place-items: center;
          padding: 20px;
          animation: fadeIn 0.22s ease both;
        }

        .modal-card {
          width: min(470px, 100%);
          border-radius: 34px;
          background: var(--paper);
          border: 1px solid rgba(21,21,25,0.08);
          box-shadow: 0 34px 90px rgba(0,0,0,0.24);
          padding: 38px;
          position: relative;
          animation: popIn 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }

        .modal-x {
          position: absolute;
          right: 18px; top: 16px;
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 0;
          background: rgba(21,21,25,0.06);
          cursor: pointer;
          font-size: 22px;
          display: grid;
          place-items: center;
        }

        .modal-card h3 {
          margin: 20px 0 10px;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.07em;
        }

        .modal-card p { margin: 0 0 22px; color: #66707a; line-height: 1.7; font-weight: 650; }

        .modal-card form { display: grid; gap: 12px; }

        .modal-card label { font-size: 13px; font-weight: 900; color: #4c5159; }

        .modal-card input {
          width: 100%;
          border: 1px solid rgba(21,21,25,0.14);
          border-radius: 16px;
          padding: 15px 16px;
          font-family: 'Inter', sans-serif;
          font-weight: 750;
          font-size: 14px;
          outline: none;
          background: #fff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .modal-card input:focus {
          border-color: var(--blue);
          box-shadow: 0 0 0 4px rgba(92,124,250,0.12);
        }

        .modal-card form .btn { width: 100%; margin-top: 4px; }

        .modal-ok { text-align: center; }

        .modal-ok > div {
          width: 70px; height: 70px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 24px;
          background: var(--grass);
          font-weight: 900;
          font-size: 34px;
          color: #15210e;
        }

        /* ─── Animations ─── */
        @keyframes aurora { from { transform: translate3d(-2%,-1%,0) rotate(0deg); } to { transform: translate3d(2%,1%,0) rotate(3deg); } }
        @keyframes cloudDrift { from { transform: translateX(-16px); } to { transform: translateX(22px); } }
        @keyframes sunPulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.04); opacity: 1; } }
        @keyframes birdBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes floatY { 0%,100% { translate: 0 0; } 50% { translate: 0 -16px; } }
        @keyframes deviceFloat { 0%,100% { translate: 0 0; } 50% { translate: 0 -10px; } }
        @keyframes phoneFloat { 0%,100% { translate: 0 0; } 50% { translate: 0 -18px; } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(155,212,102,0.46); } 70% { box-shadow: 0 0 0 14px rgba(155,212,102,0); } 100% { box-shadow: 0 0 0 0 rgba(155,212,102,0); } }
        @keyframes barPulse { 0%,100% { transform: scaleX(0.98); } 50% { transform: scaleX(1.03); } }
        @keyframes slowSpin { to { rotate: 360deg; } }
        @keyframes growBar { 0%,100% { transform: scaleY(0.92); } 50% { transform: scaleY(1.06); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

        /* ─── Responsive ─── */
        @media (max-width: 1120px) {
          .feature-grid, .pricing-grid, .security-grid { grid-template-columns: repeat(2, 1fr); }
          .overview-layout, .download-panel { grid-template-columns: 1fr; }
          .qr-card { width: 100%; max-width: 320px; }
          .footer-inner { grid-template-columns: 1fr 1fr; }
          .phone-float { right: calc(50% - 340px); transform: translateZ(240px) rotateY(-15deg) rotateZ(2deg) scale(0.9); }
          .revenue-fc { left: calc(50% - 430px); }
          .approval-fc { right: calc(50% - 430px); }
        }

        @media (max-width: 860px) {
          .nav-links { display: none; }
          .hero-inner { min-height: 920px; }
          .hero-copy { padding-top: 50px; }
          .device-stage { height: 510px; }
          .device-layer { inset: 160px 0 0; }
          .laptop { width: 82vw; }
          .revenue-fc, .approval-fc { display: none; }
          .phone-float { right: 20px; bottom: 20px; transform: translateZ(240px) rotateY(-13deg) rotateZ(2deg) scale(0.72); transform-origin: bottom right; }
          .steps-grid { grid-template-columns: 1fr; }
          .dash-card { transform: none; }
        }

        @media (max-width: 680px) {
          .site-header { padding: 12px 12px 0; }
          .nav-shell { height: 62px; border-radius: 19px; padding-left: 14px; }
          .brand { font-size: 18px; }
          .nav-sign { display: none; }
          .nav-actions .btn { min-height: 40px; padding: 0 14px; font-size: 12px; }
          .hero { padding: 88px 12px 0; }
          .hero-inner { border-radius: 28px; min-height: 820px; }
          .hero-copy { padding: 42px 18px 0; }
          .hero-copy h1 { font-size: clamp(42px, 14vw, 64px); }
          .hero-copy > p { font-size: 15px; }
          .hero-ctas { flex-direction: column; align-items: stretch; max-width: 310px; margin-left: auto; margin-right: auto; }
          .hero-badges { display: none; }
          .device-stage { height: 430px; }
          .device-layer { inset: 142px 0 0; }
          .laptop { width: 95vw; }
          .phone-float { right: 4px; bottom: 10px; transform: translateZ(240px) rotateY(-12deg) rotateZ(2deg) scale(0.62); }
          .desk-app { grid-template-columns: 82px 1fr; }
          .desk-app aside { padding: 10px 8px; }
          .desk-app aside > span:not(.logo-mark) { font-size: 8px; padding: 7px 5px; }
          .desk-app main { padding: 10px; gap: 8px; }
          .dash-grid { grid-template-columns: 1fr; }
          .pie-card { display: none; }
          .bal-card strong { font-size: 22px; }
          .section { padding: 76px 18px; }
          .section-head { grid-template-columns: 1fr; gap: 18px; margin-bottom: 34px; }
          .feature-grid, .pricing-grid, .security-grid, .money-grid { grid-template-columns: 1fr; }
          .feature-vis { height: 220px; }
          .dash-card { padding: 18px; border-radius: 28px; }
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
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.001ms !important;
          }
          .device-stage { transform: none !important; }
        }
      `}</style>

      {/* ─── Header ─── */}
      <header className="site-header">
        <nav className={scrolled ? "nav-shell" : "nav-shell top"} aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="KreatorOS home">
            <LogoMark /> KreatorOS
          </a>
          <div className="nav-links">
            {navItems.map(item => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </div>
          <div className="nav-actions">
            <button className="nav-sign" type="button" onClick={() => setShowModal(true)}>Sign in</button>
            <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>Get Started</button>
          </div>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section id="top" className="hero" onPointerMove={onHeroMove} onPointerLeave={() => setTilt({ rx: 0, ry: 0 })} style={heroVars}>
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="kicker">Creator business operator</span>
            <h1>Run your creator business on the <em>right track.</em></h1>
            <p>
              A calm operating dashboard for products, bookings, members, and brand deals — with a supervised AI operator that turns messy admin into approved workflows.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>Get Started →</button>
            </div>
          </div>
          <HeroDeviceStack />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="product" className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Product surfaces</span>
              <h2>Everything your creator business needs, inside one soft control room.</h2>
            </div>
            <p>
              A premium app-like system with clear hierarchy, friendly colors, animated mockups, and dashboards that make complex creator workflows feel simple.
            </p>
          </div>
          <div className="feature-grid">
            {surfaces.map(({ icon: Icon, title, text, tags, accent }, i) => (
              <article className="feature-card" key={title} style={{ animationDelay: `${i * 80}ms` } as CSSProperties}>
                <div className="feature-vis" style={{ background: accent }}>
                  <Icon size={48} />
                </div>
                <div className="feature-body">
                  <small>{tags[0]}</small>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <div className="feature-tags">
                    {tags.map(tag => <span className="feature-tag" key={tag}>{tag}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Overview ─── */}
      <section className="section overview-section">
        <div className="container overview-layout">
          <div className="overview-copy">
            <span className="kicker">Financial overview</span>
            <h2>Peace of mind for every product, payout, and campaign.</h2>
            <p>Replace scattered checkout links, untracked deals, and calendar back-and-forth with a single overview that shows what is live, what is earning, and what needs approval.</p>
            <div className="mini-list">
              {["Live revenue and offer tracking", "Campaign rooms with deliverables", "Calendar sessions and paid bookings", "Member storage and access rules"].map(item => (
                <div key={item}><span>✓</span>{item}</div>
              ))}
            </div>
          </div>
          <div className="dash-card">
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
                {[44, 82, 56, 120, 96, 140, 72, 158, 110].map(h => (
                  <span key={h} style={{ height: h }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workflows ─── */}
      <section id="workflows" className="section workflow-section">
        <div className="container">
          <div className="section-head center">
            <span className="kicker">System pipeline</span>
            <h2>From idea to production in three guided steps.</h2>
            <p>Keep the interface light, the automation supervised, and the business logic clear from first connection to approved launch.</p>
          </div>
          <div className="steps-grid">
            {workflowSteps.map(step => (
              <article className="step-card" key={step.n} data-n={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Download Panel ─── */}
      <section className="download-section">
        <div className="download-panel">
          <div className="qr-card">
            <div className="qr-grid" aria-label="Decorative QR code">
              {Array.from({ length: 49 }).map((_, i) => <span key={i} />)}
            </div>
            <p>Scan to join the beta</p>
          </div>
          <div className="download-copy">
            <h2>Join the creator operations revolution today.</h2>
            <p>Launch your mobile creator storefront, open the web dashboard, and keep the AI operator close while you approve high-impact work from anywhere.</p>
            <div style={{ marginTop: "28px" }}>
              <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
                Reserve Workspace →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="kicker">Details that matter</span>
            <h2>Feature-complete enough to run the day, simple enough to scan before coffee.</h2>
          </div>
          <div className="feature-grid">
            {featureGrid.map(([Icon, title, text, accent], i) => (
              <article className="feature-card" key={title} style={{ animationDelay: `${i * 80}ms` } as CSSProperties}>
                <div className="feature-vis" style={{ background: accent }}>
                  <Icon size={44} />
                </div>
                <div className="feature-body">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="section">
        <div className="container">
          <div className="section-head center">
            <span className="kicker">Pricing</span>
            <h2>Plans sized for creator leverage.</h2>
            <div className="billing-toggle" role="group" aria-label="Billing interval">
              <button className={billing === "monthly" ? "active" : ""} type="button" onClick={() => setBilling("monthly")}>Monthly</button>
              <button className={billing === "annual" ? "active" : ""} type="button" onClick={() => setBilling("annual")}>Annual · Save 20%</button>
            </div>
          </div>
          <div className="pricing-grid">
            {visiblePlans.map(plan => (
              <article className={plan.featured ? "plan-card featured" : "plan-card"} key={plan.name}>
                {plan.featured && <span className="badge">Popular</span>}
                <small>{plan.eyebrow}</small>
                <h3>{plan.name}</h3>
                <div className="price">
                  <strong>{plan.price === 0 ? "$0" : `$${plan.price}`}</strong>
                  <span>{plan.price === 0 ? "/ forever" : "/ month"}</span>
                </div>
                <p>{plan.description} {billing === "annual" && plan.price > 0 ? "Annual billing shown as monthly equivalent." : ""}</p>
                <ul>
                  {plan.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <a className={plan.featured ? "btn btn-green" : "btn btn-soft"} href={plan.href}>{plan.cta}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security ─── */}
      <section className="section security-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Maximum control</span>
              <h2>Secure, supervised, and built for serious creator businesses.</h2>
            </div>
            <p>The UI feels soft and approachable while the workflows stay explicit: you see what the operator generated, approve it, and keep ownership of the business surface.</p>
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

      {/* ─── FAQ ─── */}
      <section id="faq" className="section">
        <div className="container">
          <div className="section-head center">
            <span className="kicker">Knowledge base</span>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <article className={openFaq === i ? "faq-item open" : "faq-item"} key={q}>
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{q}</span>
                  <span className="faq-toggle">+</span>
                </button>
                {openFaq === i && <p>{a}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="final-cta">
        <div className="final-panel">
          <span className="kicker">Private onboarding</span>
          <h2>Create the creator business you deserve.</h2>
          <p>Give your audience a clean buying path, give sponsors a professional room, and give yourself one calm place to run the whole operation.</p>
          <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>Reserve Workspace →</button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <a className="brand" href="#top"><LogoMark /> KreatorOS</a>
            <p>Supervised creator business automation with a friendly, app-like interface.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#product">Surfaces</a>
            <a href="#workflows">Workflows</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div>
            <h4>Workspace</h4>
            <a href="/creator">Creator dashboard</a>
            <a href="/portal">Client portal</a>
            <a href="/login">Login</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="mailto:hello@kreatoros.com">Contact</a>
            <a href="#faq">FAQ</a>
            <a href="/api/billing/checkout?plan=free">Start free</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} KreatorOS. All rights reserved.</span>
          <span>Privacy · Terms · AI Policy</span>
        </div>
      </footer>

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </main>
  );
}
