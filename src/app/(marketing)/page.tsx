"use client";

import { useState, useEffect, useRef } from "react";
import { stats as mockStats, creator as mockCreator } from "@/shared/mock/data";

/* ─── SVG Illustrations ─── */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 560 480" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      {/* Soft background glow blobs */}
      <ellipse cx="300" cy="200" rx="220" ry="180" fill="rgba(16, 185, 129, 0.04)" />
      <ellipse cx="420" cy="340" rx="120" ry="100" fill="rgba(99, 102, 241, 0.04)" />

      {/* Main dashboard card */}
      <rect x="60" y="40" width="400" height="320" rx="20" fill="white" stroke="rgba(15, 23, 42, 0.08)" strokeWidth="1"/>

      {/* Top window bar */}
      <rect x="60" y="40" width="400" height="52" rx="20" fill="#0f172a"/>
      <rect x="60" y="72" width="400" height="20" fill="#0f172a"/>
      <circle cx="93" cy="66" r="6" fill="#ef4444"/>
      <circle cx="113" cy="66" r="6" fill="#f59e0b"/>
      <circle cx="133" cy="66" r="6" fill="#10b981"/>
      <rect x="200" y="60" width="160" height="12" rx="6" fill="#ffffff" opacity="0.12"/>

      {/* Sidebar */}
      <rect x="60" y="92" width="88" height="268" fill="#f8fafc" rx="0"/>
      <rect x="60" y="92" width="88" height="268" fill="none" stroke="rgba(15, 23, 42, 0.05)" strokeWidth="1"/>
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <rect x="72" y={112 + i * 36} width="64" height="26" rx="6"
            fill={i === 0 ? "#10b981" : "transparent"}
          />
          <rect x="80" y={120 + i * 36} width="28" height="10" rx="3"
            fill={i === 0 ? "white" : "#cbd5e1"}
            opacity={i === 0 ? 1 : 0.8}
          />
        </g>
      ))}

      {/* Main content area */}
      {/* Stat cards row */}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x={164 + i * 86} y="112" width="76" height="54" rx="10" 
            fill={i === 0 ? "#0f172a" : i === 1 ? "#ecfdf5" : "white"} 
            stroke={i === 1 ? "#a7f3d0" : "rgba(15, 23, 42, 0.08)"} 
            strokeWidth="1"
          />
          <rect x={174 + i * 86} y="122" width="44" height="6" rx="3" fill={i === 0 ? "rgba(255,255,255,0.3)" : "#e2e8f0"}/>
          <rect x={174 + i * 86} y="136" width="32" height="12" rx="4" fill={i === 0 ? "white" : i === 1 ? "#10b981" : "#0f172a"} opacity={i === 0 ? 1 : 0.95}/>
        </g>
      ))}

      {/* Chart area */}
      <rect x="164" y="180" width="258" height="110" rx="10" fill="white" stroke="rgba(15, 23, 42, 0.05)" strokeWidth="1"/>
      {/* Chart bars */}
      {[24, 42, 32, 60, 48, 68, 40, 62, 76, 52].map((h, i) => (
        <rect key={i} x={176 + i * 23} y={276 - h} width="12" height={h} rx="3"
          fill={i === 5 ? "#10b981" : i === 8 ? "#6366f1" : "#e2e8f0"}
        />
      ))}
      {/* Chart line overlay */}
      <polyline
        points="182,260 205,248 228,254 251,230 274,238 297,220 320,235 343,222 366,212 389,228"
        stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Bottom cards */}
      <rect x="164" y="302" width="120" height="46" rx="10" fill="white" stroke="rgba(15, 23, 42, 0.08)" strokeWidth="1"/>
      <rect x="174" y="314" width="48" height="6" rx="3" fill="#cbd5e1"/>
      <rect x="174" y="326" width="36" height="10" rx="4" fill="#0f172a"/>

      <rect x="296" y="302" width="126" height="46" rx="10" fill="#fefce8" stroke="#fef08a" strokeWidth="1"/>
      <rect x="306" y="314" width="40" height="6" rx="3" fill="#fde68a"/>
      <rect x="306" y="326" width="54" height="10" rx="4" fill="#ca8a04"/>

      {/* Floating notification */}
      <rect x="310" y="16" width="200" height="54" rx="14" fill="white" stroke="rgba(15, 23, 42, 0.08)" strokeWidth="1"
        style={{ filter: "drop-shadow(0 10px 25px rgba(15,23,42,0.06))" }}
      />
      <circle cx="334" cy="43" r="12" fill="#d1fae5"/>
      <path d="M330 43l3 3 5-5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="356" y="32" width="90" height="7" rx="3" fill="#0f172a"/>
      <rect x="356" y="45" width="60" height="6" rx="3" fill="#64748b"/>

      {/* Floating pill */}
      <rect x="24" y="250" width="128" height="38" rx="19" fill="#0f172a"
        style={{ filter: "drop-shadow(0 8px 20px rgba(15,23,42,0.12))" }}
      />
      <rect x="38" y="265" width="60" height="8" rx="4" fill="rgba(255,255,255,0.6)"/>
      <circle cx="120" cy="269" r="8" fill="#10b981"/>

      {/* Decorative dots grid */}
      {[0, 1, 2, 3].map(i => [0, 1, 2, 3].map(j => (
        <circle key={`${i}-${j}`} cx={490 + i * 14} cy={70 + j * 14} r="1.5" fill="#cbd5e1"/>
      )))}
    </svg>
  );
}

function WorkflowIllustration() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect x="0" y="0" width="480" height="300" rx="16" fill="#f8fafc" stroke="rgba(15,23,42,0.03)" strokeWidth="1"/>

      {/* Nodes */}
      {[
        { x: 35, y: 130, label: "Audience Opt-in", color: "#0f172a", textColor: "white" },
        { x: 170, y: 65, label: "AI Lead Match", color: "#ecfdf5", textColor: "#047857", border: "#a7f3d0" },
        { x: 170, y: 195, label: "Stripe Invoice", color: "#fffbeb", textColor: "#b45309", border: "#fde68a" },
        { x: 305, y: 65, label: "Auto Booking", color: "#eff6ff", textColor: "#1d4ed8", border: "#bfdbfe" },
        { x: 305, y: 195, label: "WhatsApp Alerts", color: "#faf5ff", textColor: "#6d28d9", border: "#e9d5ff" },
        { x: 410, y: 130, label: "Sync CRM", color: "#10b981", textColor: "white" },
      ].map(({ x, y, label, color, textColor, border }) => (
        <g key={label}>
          <rect x={x} y={y} width="96" height="40" rx="10" fill={color} stroke={border || "none"} strokeWidth="1"
            style={{ filter: "drop-shadow(0 2px 6px rgba(15,23,42,0.03))" }}
          />
          <text x={x + 48} y={y + 24} textAnchor="middle" fontSize="10" fontWeight="600" fill={textColor} fontFamily="'Plus Jakarta Sans', sans-serif">{label}</text>
        </g>
      ))}

      {/* Connectors */}
      {[
        [131, 150, 170, 85],
        [131, 150, 170, 215],
        [266, 85, 305, 85],
        [266, 215, 305, 215],
        [401, 85, 410, 150],
        [401, 215, 410, 150],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3"/>
      ))}

      {/* Animated signal dot */}
      <circle cx="0" cy="0" r="4" fill="#10b981">
        <animateMotion dur="3s" repeatCount="indefinite"
          path="M131,150 L170,85 L266,85 L305,85 L401,85 L410,150" />
      </circle>
    </svg>
  );
}

function MobilePhoneMockup() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
      {/* Outer iPhone bezel */}
      <div style={{
        position: "relative",
        width: "180px",
        height: "280px",
        borderRadius: "28px",
        background: "#090d16",
        padding: "6px",
        boxShadow: "0 15px 30px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.06)",
        overflow: "hidden"
      }}>
        {/* Dynamic Island / Notch */}
        <div style={{
          position: "absolute",
          top: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "48px",
          height: "10px",
          borderRadius: "5px",
          background: "#090d16",
          zIndex: 10
        }} />

        {/* Screen */}
        <div style={{
          width: "100%",
          height: "100%",
          borderRadius: "22px",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          overflowY: "hidden",
          padding: "16px 8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontSize: "9px"
        }}>
          {/* Mock Public Bio Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", padding: "6px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "linear-gradient(135deg, #10b981 0%, #6366f1 100%)" }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontWeight: "800", color: "#0f172a", margin: 0, fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Aarav Patel</p>
              <p style={{ color: "#64748b", margin: 0, fontSize: "7px" }}>@aarav</p>
            </div>
          </div>

          {/* Bio text */}
          <p style={{ color: "#475569", margin: "2px 0", fontSize: "7.5px", lineHeight: "1.2", textAlign: "center", fontWeight: "500" }}>
            Linking products, booking calendars, and brand collaborations.
          </p>

          {/* Links / Blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {[
              { label: "⚡ Book Strategy Session", price: "Paid Call", color: "#ecfdf5", textColor: "#047857", border: "#a7f3d0" },
              { label: "📦 Product: Creator Kit", price: "$29", color: "#ffffff", textColor: "#0f172a", border: "rgba(15,23,42,0.06)" },
              { label: "🔒 Join Launchpad Portal", price: "Included", color: "#ffffff", textColor: "#0f172a", border: "rgba(15,23,42,0.06)" }
            ].map((link, idx) => (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                background: link.color,
                border: `1px solid ${link.border}`,
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(15,23,42,0.02)"
              }}>
                <span style={{ fontWeight: "700", color: link.textColor, fontSize: "7.5px" }}>{link.label}</span>
                <span style={{
                  fontSize: "6.5px",
                  fontWeight: "800",
                  background: link.color === "white" ? "#f1f5f9" : "rgba(16, 185, 129, 0.15)",
                  color: link.textColor,
                  padding: "2px 4px",
                  borderRadius: "4px"
                }}>{link.price}</span>
              </div>
            ))}
          </div>

          {/* Small badge */}
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: "6.5px", color: "#94a3b8", fontWeight: "700", background: "white", padding: "3px 8px", borderRadius: "100px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              ⚡ Powered by KreatorOS
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

function BookingIllustration() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = [
    [1, 0, 1, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 0, 0],
    [1, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 1, 0, 0, 0],
  ];
  return (
    <svg viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect width="360" height="280" rx="16" fill="white" stroke="rgba(15, 23, 42, 0.08)" strokeWidth="1"/>
      <rect width="360" height="52" rx="0" fill="#0f172a"/>
      <rect x="0" y="32" width="360" height="20" fill="#0f172a"/>
      <text x="20" y="32" fontSize="13" fontWeight="600" fill="white" fontFamily="'Plus Jakarta Sans', sans-serif">1-on-1 Consultation Slots</text>
      <text x="310" y="32" fontSize="11" fontWeight="500" fill="#10b981" fontFamily="'Plus Jakarta Sans', sans-serif">ACTIVE</text>

      {/* Day headers */}
      {days.map((d, i) => (
        <text key={i} x={30 + i * 46} y={80} fontSize="10" fontWeight="600" fill="#94a3b8" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif">{d}</text>
      ))}

      {/* Slots */}
      {slots.map((row, ri) =>
        row.map((filled, ci) => (
          <g key={`${ri}-${ci}`}>
            <rect x={7 + ci * 46} y={94 + ri * 42} width="38" height="32" rx="8"
              fill={filled ? (ri === 0 && ci === 0 || ri === 1 && ci === 1 || ri === 2 && ci === 4 ? "#0f172a" : "#ecfdf5") : "#f8fafc"}
              stroke={filled && !(ri === 0 && ci === 0 || ri === 1 && ci === 1 || ri === 2 && ci === 4) ? "#a7f3d0" : "none"}
            />
            {filled && (
              <text x={7 + ci * 46 + 19} y={94 + ri * 42 + 20} textAnchor="middle" fontSize="10" fontWeight="700"
                fill={ri === 0 && ci === 0 || ri === 1 && ci === 1 || ri === 2 && ci === 4 ? "white" : "#047857"} fontFamily="'Plus Jakarta Sans', sans-serif">
                {ri === 0 && ci === 0 ? "$150" : ri === 1 && ci === 1 ? "$250" : ri === 2 && ci === 4 ? "$99" : "Book"}
              </text>
            )}
          </g>
        ))
      )}
    </svg>
  );
}

function ResearchIllustration() {
  return (
    <svg viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect width="360" height="260" rx="16" fill="#f8fafc" stroke="rgba(15,23,42,0.03)" strokeWidth="1"/>

      {/* Chat bubbles */}
      <rect x="20" y="20" width="230" height="42" rx="12" fill="white" stroke="rgba(15, 23, 42, 0.06)" strokeWidth="1"/>
      <text x="35" y="37" fontSize="11" fill="#334155" fontWeight="500" fontFamily="'Plus Jakarta Sans', sans-serif">What is your biggest blocker to signing?</text>
      <text x="35" y="52" fontSize="9" fill="#94a3b8" fontFamily="'Plus Jakarta Sans', sans-serif">AI Operator · Brand Outreach Room</text>

      <rect x="110" y="78" width="230" height="42" rx="12" fill="#0f172a"/>
      <text x="125" y="95" fontSize="11" fill="white" fontWeight="400" fontFamily="'Plus Jakarta Sans', sans-serif">Need net-30 terms and custom usage rights.</text>
      <text x="125" y="110" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="'Plus Jakarta Sans', sans-serif">Sponsor Partner · Acme Corp</text>

      <rect x="20" y="136" width="230" height="42" rx="12" fill="white" stroke="rgba(15, 23, 42, 0.06)" strokeWidth="1"/>
      <text x="35" y="153" fontSize="11" fill="#334155" fontWeight="500" fontFamily="'Plus Jakarta Sans', sans-serif">Drafted contract addendum. Press approve to send.</text>
      <text x="35" y="168" fontSize="9" fill="#10b981" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif">Action Drafted · Awaiting Creator</text>

      {/* Theme tags */}
      {["Net-30", "Ad-Rights", "Deliverables", "Sign-Off"].map((tag, i) => (
        <g key={tag}>
          <rect x={20 + i * 82} y="198" width="74" height="24" rx="12"
            fill={i === 0 ? "#0f172a" : i === 1 ? "#ecfdf5" : i === 2 ? "#eff6ff" : "#faf5ff"}
            stroke={i === 1 ? "#a7f3d0" : i === 2 ? "#bfdbfe" : i === 3 ? "#e9d5ff" : "none"}
            strokeWidth="1"
          />
          <text x={20 + i * 82 + 37} y="214" fontSize="10" fontWeight="600" textAnchor="middle"
            fill={i === 0 ? "white" : i === 1 ? "#047857" : i === 2 ? "#1d4ed8" : "#6d28d9"} fontFamily="'Plus Jakarta Sans', sans-serif">{tag}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── Agent Terminal Card ─── */
const agentSteps = [
  { label: "Validating incoming brand deal email request", status: "done" },
  { label: "Drafting media kit metrics & package options", status: "done" },
  { label: "Generating formal Stripe Invoice & proposal document", status: "active" },
  { label: "Syncing campaign milestones in Supabase database", status: "pending" },
  { label: "Awaiting your dashboard authorization key", status: "pending" },
];

function AgentTerminal() {
  const [progress, setProgress] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= agentSteps.length ? 0 : p + 1), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "#090d16",
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: "0 30px 70px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
    }}>
      {/* Terminal bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ef4444", "#f59e0b", "#10b981"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginLeft: 8 }}>kreator-os ~ supervised-operator</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "glow 2s ease-in-out infinite" }} />
          <span style={{ color: "#10b981", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5, fontWeight: "600" }}>ACTIVE</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: "24px 24px 8px" }}>
        {agentSteps.map((step, i) => {
          const done = i < progress;
          const active = i === progress;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 16px",
              marginBottom: 8,
              borderRadius: 12,
              background: done ? "rgba(16,185,129,0.04)" : active ? "rgba(255,255,255,0.03)" : "transparent",
              border: `1px solid ${done ? "rgba(16,185,129,0.12)" : active ? "rgba(255,255,255,0.06)" : "transparent"}`,
              transition: "all 0.4s cubic-bezier(.16,1,.3,1)",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: done ? "#10b981" : active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: done ? "#fff" : "rgba(255,255,255,0.3)",
                flexShrink: 0, transition: "all 0.4s ease",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace",
                color: done ? "#a7f3d0" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                transition: "color 0.4s ease", letterSpacing: -0.1,
              }}>
                {active && <span style={{ color: "#10b981", marginRight: 6 }}>▶</span>}{step.label}
                {active && <span style={{ animation: "blink 1s step-end infinite", color: "#10b981" }}>_</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Operator Suggestion box */}
      <div style={{ margin: "12px 24px 24px", padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#f59e0b" }}>✦</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Recommended Action</span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0, fontFamily: "'Inter', sans-serif" }}>
          Incorporate the $450/month recurring brand campaign terms, trigger automated delivery tracking, and auto-sync to your Google Calendar.
        </p>
      </div>
    </div>
  );
}

/* ─── DATA ─── */
const pillars = [
  { tag: "01", title: "Supervised AI Operator", text: "A secure agent mapped to your business accounts. It drafts contract responses, designs booking paths, and creates upsell models — waiting for your approval to publish.", img: <WorkflowIllustration /> },
  { tag: "02", title: "Automated Bio & Commerce", text: "Turn audience traffic into revenue. Secure single-page checkouts for courses, downloadable assets, recurring member rooms, and live consultations without routing limits.", img: <MobilePhoneMockup /> },
  { tag: "03", title: "Active Campaign CRM", text: "Auto-generate brand media packages, organize active agreements inside dedicated rooms, track net terms payouts, and let your operator coordinate follow-ups.", img: <ResearchIllustration /> },
];

// stats are imported from "@/shared/mock/data" as mockStats

const steps = [
  { n: "01", title: "Synchronize Your Scope", text: "Securely link your brand parameters, audience metrics, calendar channels, and connected Stripe account under a unified Supabase core database." },
  { n: "02", title: "State Your Business Objective", text: "Describe a business goal to your operator in plain text (e.g. 'Launch a monthly membership at $19 and email warm leads'). The agent generates the flow." },
  { n: "03", title: "Approve Actions Securely", text: "Review exact drafted actions, checkout parameters, and outreach copies inside your control room. Approve once to set automations live 24/7." },
];

const testimonials = [
  {
    quote: "KreatorOS saved me 25 hours a week in booking coordination and automated $8,200 in async audit sales in my first month.",
    author: "Sarah Chen",
    role: "Technical Educator",
    audience: "420k Audience"
  },
  {
    quote: "The AI operator manages my sponsor inbound, structures packages, and handles custom invoicing. It feels like having a full-time assistant.",
    author: "Marcus Vance",
    role: "Creative Director",
    audience: "180k Subscribers"
  },
  {
    quote: "Migrating our cohort portal took 3 hours. The Supabase storage speed is phenomenal and row-level security handles members perfectly.",
    author: "Elena Rostova",
    role: "Community Founder",
    audience: "5k Paying Members"
  }
];

const faqs = [
  {
    q: "How does the AI Operator execute actions?",
    a: "The operator works on a 'supervised agency' framework. It automatically drafts responses, configures checkouts, or maps campaign pipelines, but it will never charge, mail, or sync contracts without your explicit click-to-approve command in the control panel."
  },
  {
    q: "Can I connect my own domain and Stripe account?",
    a: "Absolutely. All public stores, booking calendars, and client portals can be mapped to your custom domains (e.g., store.yourdomain.com). Payments are securely routed to your connected Stripe account directly, with no middleman holds."
  },
  {
    q: "What database foundation does the SaaS use?",
    a: "We deploy standard, enterprise-ready Supabase PostgreSQL databases for every workspace. This ensures robust row-level security (RLS), instant read/write transactions, and direct control over your own customer accounts and persistent data."
  },
  {
    q: "Are there transaction fees on creator sales?",
    a: "The Creator Pro tier incurs a flat 1% transaction fee to support system operations. Tiers on the Enterprise Suite feature a 0% transaction fee so you retain the entire revenue from payments directly on Stripe."
  }
];

/* ─── MAIN ─── */
export default function KreatorOSV2() {
  const [scrolled, setScrolled] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes("@")) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const openBetaModal = () => {
    setShowModal(true);
    setSubmitted(false);
    setWaitlistEmail("");
  };

  const closeBetaModal = () => {
    setShowModal(false);
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', sans-serif", 
      background: "#ffffff", 
      color: "#0f172a", 
      minHeight: "100vh", 
      overflowX: "hidden",
      WebkitFontSmoothing: "antialiased" 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #0f172a; color: #ffffff; }
        
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes glow { 0%, 100% { opacity: 1; box-shadow: 0 0 8px #10b981 } 50% { opacity: 0.6; box-shadow: 0 0 2px #10b981 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes overlayShow { from { opacity: 0 } to { opacity: 1 } }
        @keyframes contentShow { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }

        .fade-up { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-1 { animation: fadeUp 0.8s 0.08s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-2 { animation: fadeUp 0.8s 0.16s cubic-bezier(.16,1,.3,1) both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.28s cubic-bezier(.16,1,.3,1) both; }
        
        .float { animation: float 6s ease-in-out infinite; }
        
        .display-font {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .nav-a {
          font-size: 14.5px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: color .2s;
        }
        .nav-a:hover { color: #0f172a; }
        
        .btn-dark {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #ffffff;
          padding: 12px 26px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all .25s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 4px 12px rgba(15,23,42,0.08);
        }
        .btn-dark:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(15,23,42,0.14);
        }
        
        .btn-light {
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #0f172a;
          padding: 12px 26px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all .25s cubic-bezier(.16,1,.3,1);
        }
        .btn-light:hover {
          border-color: #94a3b8;
          background: #f8fafc;
          transform: translateY(-1px);
        }
        
        .feature-card {
          background: #ffffff;
          border: 1px solid rgba(15,23,42,0.06);
          border-radius: 24px;
          overflow: hidden;
          transition: all .3s cubic-bezier(.16,1,.3,1);
        }
        .feature-card:hover {
          border-color: #0f172a;
          box-shadow: 0 20px 40px rgba(15,23,42,0.05);
          transform: translateY(-3px);
        }
        
        .pricing-card {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 24px;
          padding: 36px;
          position: relative;
          transition: all .3s cubic-bezier(.16,1,.3,1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .pricing-card.premium {
          border-color: #10b981;
          box-shadow: 0 16px 36px rgba(16,185,129,0.06);
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.07);
        }
        .pricing-card.premium:hover {
          box-shadow: 0 24px 48px rgba(16,185,129,0.12);
        }

        .tag-pill {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .modal-container {
          background: #ffffff;
          width: 90%;
          max-width: 460px;
          border-radius: 28px;
          border: 1px solid rgba(15,23,42,0.08);
          padding: 40px;
          box-shadow: 0 30px 60px rgba(9,13,22,0.18);
          position: relative;
          animation: contentShow 0.3s cubic-bezier(.16,1,.3,1);
        }
        .header-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0 !important;
        }
        @media (max-width: 900px) {
          .header-buttons .nav-a {
            display: none !important;
          }
        }

        .hero-buttons, .cta-buttons {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .hero-buttons, .cta-buttons {
            flex-direction: column !important;
            width: 100% !important;
            max-width: 320px !important;
            margin: 0 auto !important;
            gap: 12px !important;
          }
        }

        @media (max-width: 480px) {
          .modal-container {
            padding: 24px 20px !important;
            border-radius: 20px !important;
          }
          .modal-container h3 {
            font-size: 20px !important;
          }
          .modal-container p {
            font-size: 13px !important;
            margin-bottom: 20px !important;
          }
          .btn-dark, .btn-light {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 14px 24px !important;
            display: inline-flex !important;
            white-space: nowrap !important;
          }
          footer > div {
            flex-direction: column !important;
            gap: 20px !important;
            text-align: center !important;
          }
          footer div[style*="flex"] {
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
        }

        /* ─── RESPONSIVE MOBILE CORE GRIDS ─── */
        .nav-links {
          display: flex;
          gap: 36px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }
        }
        
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 991px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 48px;
            padding: 60px 24px;
            text-align: center;
          }
          .hero-container .fade-up {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-container h1 {
            font-size: 42px !important;
            line-height: 1.15 !important;
            letter-spacing: -1.5px !important;
          }
          .hero-container p {
            margin-left: auto;
            margin-right: auto;
          }
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 991px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 991px) {
          .features-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        
        .features-wide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .features-wide-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        
        .how-it-works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 991px) {
          .how-it-works-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 991px) {
          .testimonials-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 991px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          h2.display-font {
            font-size: 30px !important;
            line-height: 1.25 !important;
            letter-spacing: -1px !important;
          }
          section {
            padding: 60px 20px !important;
          }
          header nav {
            padding: 0 12px !important;
          }
          .header-buttons .btn-dark {
            padding: 8px 14px !important;
            font-size: 12px !important;
            flex-shrink: 0 !important;
          }
          .stats-grid > div {
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0;
            padding: 32px 16px !important;
          }
          .stats-grid > div:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.85)" : "#ffffff",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(15, 23, 42, 0.06)" : "1px solid transparent",
        transition: "all .3s ease",
      }}>
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(15,23,42,0.08)" }}>
              <img src="/logo.png" alt="KreatorOS Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span className="display-font" style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>KreatorOS</span>
          </a>
          
          <div className="nav-links">
            <a href="#features" className="nav-a">Features</a>
            <a href="#how-it-works" className="nav-a">How it Works</a>
            <a href="#testimonials" className="nav-a">Testimonials</a>
            <a href="#pricing" className="nav-a">Pricing</a>
          </div>

          <div className="header-buttons">
            <button onClick={openBetaModal} className="nav-a" style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 16px" }}>Sign In</button>
            <button onClick={openBetaModal} className="btn-dark" style={{ padding: "10px 22px", fontSize: 13 }}>Join Waitlist →</button>
          </div>
        </nav>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-container">
        <div className="fade-up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 100, padding: "6px 14px", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span className="tag-pill" style={{ fontSize: 10, color: "#475569" }}>v1 Launch this Sunday</span>
          </div>

          <h1 className="display-font" style={{ fontSize: 62, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2.5, marginBottom: 24, color: "#0f172a" }}>
            Automate your<br/>
            creator business<br/>
            <span style={{ color: "#10b981" }}>on autpilot.</span>
          </h1>

          <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.7, maxWidth: 480, marginBottom: 38, fontWeight: 400 }}>
            KreatorOS links your audience store, custom Calendar sessions, paid members rooms, and brand outreach campaigns under a unified, secure AI operator.
          </p>

          <div className="hero-buttons" style={{ marginBottom: 44 }}>
            <button onClick={openBetaModal} className="btn-dark">Access Private Beta →</button>
            <a href="#how-it-works" className="btn-light">See How it Works</a>
          </div>

          {/* Hero Volume Badging elements removed successfully */}
        </div>

        <div className="float fade-up-1">
          <AgentTerminal />
        </div>
      </section>

      {/* ── TRUSTED STATS SECTION REMOVED ── */}

      {/* ── FEATURE PILLARS ── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 60 }}>
          <div style={{ maxWidth: 600 }}>
            <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 14 }}>Core Operator Core</span>
            <h2 className="display-font" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5 }}>
              Engineered for absolute autonomy.<br/>
              <span style={{ color: "#475569" }}>Monetize standard flows 24/7.</span>
            </h2>
          </div>
          <p style={{ maxWidth: 320, fontSize: 14.5, color: "#64748b", lineHeight: 1.65, fontWeight: 400, textAlign: "right" }}>
            Unify calendar reservations, member storage permissions, and automated brand campaigns under a secure supervised model.
          </p>
        </div>

        <div className="features-grid">
          {pillars.map(p => (
            <div key={p.tag} className="feature-card">
              <div style={{ padding: "24px 24px 0", background: "#f8fafc" }}>
                {p.img}
              </div>
              <div style={{ padding: "28px 32px 32px" }}>
                <div className="tag-pill" style={{ color: "#10b981", marginBottom: 12 }}>{p.tag}</div>
                <h3 className="display-font" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 10, color: "#0f172a" }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.65, fontWeight: 400 }}>{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Double Wide Feature Box */}
        <div className="features-wide-grid">
          {[
            { tag: "04", title: "Enterprise Database Persistence", text: "Every user slot maps to a private Supabase instance, storing active payment tokens, media files, and client transaction parameters behind Row-Level Security." },
            { tag: "05", title: "Direct Payouts & Sync", text: "Connect your Stripe account within seconds. Your operator runs bookings, generates campaign addendums, and issues payouts without middleman escrow holds." },
          ].map(p => (
            <div key={p.tag} className="feature-card" style={{ padding: "36px 40px" }}>
              <div className="tag-pill" style={{ color: "#10b981", marginBottom: 14 }}>{p.tag}</div>
              <h3 className="display-font" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.65, fontWeight: 400 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 14 }}>System Pipeline</span>
            <h2 className="display-font" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5 }}>
              From objective to production<br/>
              <span style={{ color: "#475569" }}>in three streamlined steps.</span>
            </h2>
          </div>
          
          <div className="how-it-works-grid">
            {steps.map(s => (
              <div key={s.n} style={{ background: "white", border: "1px solid rgba(15, 23, 42, 0.06)", borderRadius: 24, padding: "40px 36px", position: "relative", overflow: "hidden" }}>
                <div className="display-font" style={{ fontSize: 84, fontWeight: 900, color: "#f1f5f9", position: "absolute", top: -14, right: 18, zIndex: 1, userSelect: "none" }}>{s.n}</div>
                <div style={{ position: "relative", zIndex: 2 }}>
                  <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 16 }}>Step {s.n}</span>
                  <h3 className="display-font" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12, color: "#0f172a" }}>{s.title}</h3>
                  <p style={{ fontSize: 14.5, color: "#475569", lineHeight: 1.7, fontWeight: 400 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS & SOCIAL PROOF ── */}
      <section id="testimonials" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 14 }}>Active Results</span>
          <h2 className="display-font" style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5, color: "#0f172a" }}>
            Real operators. Real growth.
          </h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} style={{ padding: "36px", borderRadius: 24, background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7, fontStyle: "italic", marginBottom: 28 }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontWeight: 700, fontSize: 13 }}>
                  {t.author[0]}
                </div>
                <div>
                  <h4 className="display-font" style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>{t.author}</h4>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{t.role} · <strong style={{ color: "#10b981" }}>{t.audience}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc", padding: "100px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: 54 }}>
            <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 14 }}>Flexible Tier Matrices</span>
            <h2 className="display-font" style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5, color: "#0f172a", marginBottom: 28 }}>
              Sized for creator leverage.
            </h2>

            {/* Toggle Billing Switcher */}
            <div style={{ display: "inline-flex", background: "#e2e8f0", padding: 4, borderRadius: 100, gap: 4 }}>
              <button 
                onClick={() => setBillingInterval("monthly")}
                className="display-font"
                style={{
                  border: "none",
                  background: billingInterval === "monthly" ? "white" : "transparent",
                  color: billingInterval === "monthly" ? "#0f172a" : "#475569",
                  padding: "8px 20px",
                  borderRadius: 100,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  boxShadow: billingInterval === "monthly" ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
                }}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingInterval("annual")}
                className="display-font"
                style={{
                  border: "none",
                  background: billingInterval === "annual" ? "white" : "transparent",
                  color: billingInterval === "annual" ? "#0f172a" : "#475569",
                  padding: "8px 20px",
                  borderRadius: 100,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  boxShadow: billingInterval === "annual" ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
                }}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            
            {/* TIER 1 */}
            <div className="pricing-card">
              <div>
                <span className="tag-pill" style={{ color: "#64748b" }}>OPERATOR STARTER</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "20px 0 10px" }}>
                  <span className="display-font" style={{ fontSize: 44, fontWeight: 800, color: "#0f172a" }}>$0</span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>/forever</span>
                </div>
                <p style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28 }}>Evaluate operator automation maps with no platform cost.</p>
                <div style={{ height: 1, background: "#f1f5f9", marginBottom: 28 }} />
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {["1 Active AI Automation Map", "10 Assisted Operator Executions/mo", "Secure Public Bio link", "Standard Booking Calendar slots", "Basic Stripe Checkout setup"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155" }}>
                      <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={openBetaModal} className="btn-light" style={{ width: "100%", justifyContent: "center", marginTop: 32 }}>Start Free Trial</button>
            </div>

            {/* TIER 2 */}
            <div className="pricing-card premium">
              <div style={{ position: "absolute", top: -14, right: 36, background: "#10b981", color: "white", padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>POPULAR</div>
              <div>
                <span className="tag-pill" style={{ color: "#10b981" }}>CREATOR PRO</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "20px 0 10px" }}>
                  <span className="display-font" style={{ fontSize: 44, fontWeight: 800, color: "#0f172a" }}>
                    {billingInterval === "monthly" ? "$39" : "$31"}
                  </span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>/month</span>
                </div>
                <p style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28 }}>
                  Scale operations. {billingInterval === "annual" && "Billed $372 annually."}
                </p>
                <div style={{ height: 1, background: "#f1f5f9", marginBottom: 28 }} />
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {["Unlimited AI Automation Maps", "500 Assisted Executions/mo", "Custom Domain Routing Sync", "Multi-Seat Brand CRM pipelines", "Row-Level Secured Member spaces", "1% flat transaction fees"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155" }}>
                      <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={openBetaModal} className="btn-dark" style={{ width: "100%", justifyContent: "center", marginTop: 32, background: "#10b981", boxShadow: "0 4px 12px rgba(16,185,129,0.2)" }}>Launch Creator Pro</button>
            </div>

            {/* TIER 3 */}
            <div className="pricing-card">
              <div>
                <span className="tag-pill" style={{ color: "#6366f1" }}>ENTERPRISE SUITE</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "20px 0 10px" }}>
                  <span className="display-font" style={{ fontSize: 44, fontWeight: 800, color: "#0f172a" }}>
                    {billingInterval === "monthly" ? "$149" : "$119"}
                  </span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>/month</span>
                </div>
                <p style={{ fontSize: 13.5, color: "#64748b", marginBottom: 28 }}>
                  Complete agency/brand control. {billingInterval === "annual" && "Billed $1,428 annually."}
                </p>
                <div style={{ height: 1, background: "#f1f5f9", marginBottom: 28 }} />
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                  {["Dedicated Operator Training", "Unlimited Assisted Executions", "Multi-brand Portal management", "Custom white-labeled domains", "Private database instances", "0% platform transaction fees"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155" }}>
                      <span style={{ color: "#6366f1", fontWeight: "bold" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={openBetaModal} className="btn-light" style={{ width: "100%", justifyContent: "center", marginTop: 32 }}>Contact Business Rep</button>
            </div>

          </div>

        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "100px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 14 }}>Knowledge Base</span>
          <h2 className="display-font" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, color: "#0f172a" }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {faqs.map((faq, i) => {
            const isActive = openFaq === i;
            return (
              <div 
                key={i} 
                style={{ 
                  background: "#ffffff", 
                  border: "1px solid rgba(15,23,42,0.06)", 
                  borderRadius: 18, 
                  overflow: "hidden", 
                  transition: "all .25s ease" 
                }}
              >
                <button
                  onClick={() => setOpenFaq(isActive ? null : i)}
                  className="display-font"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "24px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 20, color: "#94a3b8", transition: "transform .2s", transform: isActive ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                
                {isActive && (
                  <div style={{ 
                    padding: "0 24px 24px", 
                    fontSize: 14.5, 
                    color: "#475569", 
                    lineHeight: 1.65,
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: 16
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CALL TO ACTION ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 100px" }}>
        <div style={{
          background: "#090d16",
          borderRadius: 32,
          padding: "80px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)"
        }}>
          {/* Subtle Accent Glows */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />

          <div style={{ position: "relative", zIndex: 10 }}>
            <span className="tag-pill" style={{ color: "#10b981", display: "inline-block", marginBottom: 20 }}>Secure Private Onboarding</span>
            <h2 className="display-font" style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, color: "#ffffff", lineHeight: 1.1, marginBottom: 24 }}>
              Execute workflows on autonomy.<br/>
              <span style={{ color: "#94a3b8" }}>Reclaim your business focus.</span>
            </h2>
            <p style={{ fontSize: 16, color: "#94a3b8", maxWidth: 500, margin: "0 auto 40px", fontWeight: 400 }}>
              Synchronize booking scopes, connect custom client checkouts, and let your AI operator scale payouts securely.
            </p>

            <div className="cta-buttons" style={{ justifyContent: "center" }}>
              <button onClick={openBetaModal} className="btn-dark" style={{ background: "#ffffff", color: "#090d16" }}>Get Beta Invite</button>
              <a href="#features" className="btn-light" style={{ background: "transparent", color: "#ffffff", borderColor: "rgba(255,255,255,0.15)" }}>Explore Ecosystem</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(15,23,42,0.08)" }}>
              <img src="/logo.png" alt="KreatorOS Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span className="display-font" style={{ fontSize: 17, fontWeight: 700 }}>KreatorOS</span>
          </div>
          <span style={{ fontSize: 12.5, color: "#94a3b8" }}>© {new Date().getFullYear()} KreatorOS Inc. All rights reserved.</span>
          <div style={{ display: "flex", gap: 28 }}>
            {["Developer API", "Terms of Service", "Privacy Statement"].map(l => (
              <a key={l} href="#" onClick={(e) => { e.preventDefault(); openBetaModal(); }} style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── INTERACTIVE GLASSMORPHIC WAITLIST MODAL ── */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(9, 13, 22, 0.45)",
          backdropFilter: "blur(12px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "overlayShow 0.3s cubic-bezier(.16,1,.3,1)"
        }}>
          <div className="modal-container">
            
            <button 
              onClick={closeBetaModal}
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#f1f5f9",
                border: "none",
                fontSize: 16,
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f1f5f9")}
            >
              ✕
            </button>

            {!submitted ? (
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 100, padding: "5px 12px", marginBottom: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  <span className="tag-pill" style={{ fontSize: 9.5, color: "#047857" }}>Private Beta Enrollment</span>
                </div>

                <h3 className="display-font" style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: -0.5 }}>
                  Claim your workspace
                </h3>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 28 }}>
                  KreatorOS is in a closed beta environment. Enter your business email to request access.
                </p>

                <form onSubmit={handleWaitlistSubmit}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    <label className="tag-pill" style={{ fontSize: 10, color: "#475569", fontWeight: 700 }}>BUSINESS EMAIL</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. name@brand.com"
                      value={waitlistEmail}
                      onChange={e => setWaitlistEmail(e.target.value)}
                      style={{
                        padding: "14px 18px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        fontSize: 14.5,
                        fontFamily: "inherit",
                        color: "#0f172a",
                        outline: "none",
                        transition: "border-color .2s"
                      }}
                      onFocus={e => (e.target.style.borderColor = "#10b981")}
                      onBlur={e => (e.target.style.borderColor = "#cbd5e1")}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-dark"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#10b981",
                      border: "none",
                      color: "white",
                      fontSize: 14.5,
                      fontWeight: 700,
                      boxShadow: "0 4px 12px rgba(16,185,129,0.2)"
                    }}
                  >
                    {isSubmitting ? "Routing Setup Parameters..." : "Request Workspace Setup →"}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: "50%", 
                  background: "#ecfdf5", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#10b981", 
                  fontSize: 26, 
                  marginBottom: 20 
                }}>
                  ✓
                </div>
                <h3 className="display-font" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                  Workspace Initialized!
                </h3>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 24 }}>
                  We've successfully logged your credentials for **{waitlistEmail}**. The operator has reserved your Supabase partition. A setup link will be delivered shortly.
                </p>
                <button 
                  onClick={closeBetaModal}
                  className="btn-dark"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Return to Ecosystem
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}