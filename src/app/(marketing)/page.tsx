"use client";

import { useState, useEffect, useRef } from "react";

/* ─── SVG Illustrations ─── */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 560 480" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      {/* Soft background blobs */}
      <ellipse cx="300" cy="200" rx="220" ry="180" fill="#f0fdf4" />
      <ellipse cx="420" cy="340" rx="120" ry="100" fill="#fafafa" />

      {/* Main dashboard card */}
      <rect x="60" y="40" width="400" height="320" rx="20" fill="white" stroke="#e5e7eb" strokeWidth="1"/>

      {/* Top bar */}
      <rect x="60" y="40" width="400" height="52" rx="20" fill="#0a0a0a"/>
      <rect x="60" y="72" width="400" height="20" fill="#0a0a0a"/>
      <circle cx="93" cy="66" r="6" fill="#ff5f57"/>
      <circle cx="113" cy="66" r="6" fill="#febc2e"/>
      <circle cx="133" cy="66" r="6" fill="#28c840"/>
      <rect x="200" y="60" width="140" height="12" rx="6" fill="#ffffff" opacity="0.12"/>

      {/* Sidebar */}
      <rect x="60" y="92" width="88" height="268" fill="#fafafa" rx="0"/>
      <rect x="60" y="92" width="88" height="268" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
      {[0,1,2,3,4,5].map(i => (
        <g key={i}>
          <rect x="76" y={116 + i*38} width="54" height="28" rx="8"
            fill={i === 0 ? "#0a0a0a" : "transparent"}
            stroke={i === 0 ? "none" : "transparent"}
          />
          <rect x="82" y={125 + i*38} width="20" height="10" rx="4"
            fill={i === 0 ? "white" : "#d1d5db"}
            opacity={i === 0 ? 1 : 0.7}
          />
        </g>
      ))}

      {/* Main content area */}
      {/* Stat cards row */}
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x={162 + i*86} y="112" width="74" height="54" rx="10" fill={i===0?"#0a0a0a":i===1?"#f0fdf4":"white"} stroke={i===1?"#bbf7d0":i===2?"#e5e7eb":"none"} strokeWidth="1"/>
          <rect x={170 + i*86} y="122" width="40" height="7" rx="3" fill={i===0?"rgba(255,255,255,0.3)":"#e5e7eb"}/>
          <rect x={170 + i*86} y="135" width="28" height="12" rx="4" fill={i===0?"white":i===1?"#16a34a":"#0a0a0a"} opacity={i===0?1:0.9}/>
        </g>
      ))}

      {/* Chart area */}
      <rect x="162" y="178" width="258" height="110" rx="10" fill="white" stroke="#f0f0f0" strokeWidth="1"/>
      {/* Chart bars */}
      {[28,48,36,64,52,72,44,68,80,56].map((h,i) => (
        <rect key={i} x={172 + i*24} y={278 - h} width="14" height={h} rx="3"
          fill={i===6?"#0a0a0a":i===8?"#0a0a0a":"#e5e7eb"}
          opacity={i===6||i===8?1:0.6}
        />
      ))}
      {/* Chart line overlay */}
      <polyline
        points="179,265 203,250 227,258 251,236 275,244 299,228 323,240 347,230 371,220 395,234"
        stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Bottom cards */}
      <rect x="162" y="300" width="120" height="48" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
      <rect x="172" y="312" width="50" height="7" rx="3" fill="#d1d5db"/>
      <rect x="172" y="325" width="35" height="10" rx="4" fill="#0a0a0a"/>

      <rect x="294" y="300" width="126" height="48" rx="10" fill="#fefce8" stroke="#fef08a" strokeWidth="1"/>
      <rect x="304" y="312" width="44" height="7" rx="3" fill="#fde68a"/>
      <rect x="304" y="325" width="58" height="10" rx="4" fill="#854d0e"/>

      {/* Floating notification */}
      <rect x="320" y="16" width="190" height="52" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"
        style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.08))" }}
      />
      <circle cx="340" cy="42" r="12" fill="#dcfce7"/>
      <text x="340" y="46" textAnchor="middle" fontSize="11" fill="#16a34a">✓</text>
      <rect x="360" y="32" width="80" height="7" rx="3" fill="#e5e7eb"/>
      <rect x="360" y="45" width="55" height="6" rx="3" fill="#f3f4f6"/>

      {/* Floating pill */}
      <rect x="30" y="260" width="120" height="36" rx="18" fill="#0a0a0a"
        style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.15))" }}
      />
      <rect x="44" y="271" width="55" height="7" rx="3" fill="rgba(255,255,255,0.6)"/>
      <circle cx="118" cy="278" r="8" fill="#22c55e"/>

      {/* Decorative dots */}
      {[0,1,2,3].map(i => [0,1,2,3].map(j => (
        <circle key={`${i}-${j}`} cx={490 + i*14} cy={60 + j*14} r="1.5" fill="#e5e7eb"/>
      )))}
    </svg>
  );
}

function WorkflowIllustration() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect x="0" y="0" width="480" height="300" rx="16" fill="#fafafa"/>

      {/* Nodes */}
      {[
        { x: 40, y: 120, label: "Trigger", color: "#0a0a0a", textColor: "white" },
        { x: 160, y: 60, label: "AI Agent", color: "#f0fdf4", textColor: "#166534", border: "#bbf7d0" },
        { x: 160, y: 180, label: "Payment", color: "#fefce8", textColor: "#854d0e", border: "#fef08a" },
        { x: 300, y: 60, label: "Calendar", color: "#eff6ff", textColor: "#1e40af", border: "#bfdbfe" },
        { x: 300, y: 180, label: "Notify", color: "#fdf4ff", textColor: "#7e22ce", border: "#e9d5ff" },
        { x: 400, y: 120, label: "Done ✓", color: "#0a0a0a", textColor: "white" },
      ].map(({ x, y, label, color, textColor, border }) => (
        <g key={label}>
          <rect x={x} y={y} width="80" height="36" rx="8" fill={color} stroke={border || "none"} strokeWidth="1"/>
          <text x={x + 40} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="500" fill={textColor} fontFamily="DM Sans, sans-serif">{label}</text>
        </g>
      ))}

      {/* Connectors */}
      {[
        [120, 138, 160, 80],
        [120, 138, 160, 198],
        [240, 80, 300, 80],
        [240, 198, 300, 198],
        [380, 80, 400, 130],
        [380, 198, 400, 148],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"/>
      ))}

      {/* Animated dot on line */}
      <circle cx="0" cy="0" r="3" fill="#0a0a0a">
        <animateMotion dur="2.5s" repeatCount="indefinite"
          path="M120,138 L160,80 L240,80 L300,80 L380,80 L400,130" />
      </circle>
    </svg>
  );
}

function BookingIllustration() {
  const days = ["M","T","W","T","F","S","S"];
  const slots = [
    [1,0,1,0,1,0,0],
    [0,1,0,1,0,0,0],
    [1,1,0,0,1,0,0],
    [0,0,1,1,0,0,0],
  ];
  return (
    <svg viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect width="360" height="280" rx="16" fill="white" stroke="#f0f0f0" strokeWidth="1"/>
      <rect width="360" height="48" rx="0" fill="#0a0a0a"/>
      <rect x="0" y="32" width="360" height="16" fill="#0a0a0a"/>
      <text x="24" y="30" fontSize="13" fontWeight="500" fill="white" fontFamily="DM Sans, sans-serif">Booking Calendar</text>
      <text x="310" y="30" fontSize="11" fill="rgba(255,255,255,0.5)" fontFamily="DM Sans, sans-serif">Jun</text>

      {/* Day headers */}
      {days.map((d,i) => (
        <text key={i} x={28 + i*46} y={78} fontSize="11" fill="#9ca3af" textAnchor="middle" fontFamily="DM Sans, sans-serif">{d}</text>
      ))}

      {/* Slots */}
      {slots.map((row, ri) =>
        row.map((filled, ci) => (
          <g key={`${ri}-${ci}`}>
            <rect x={5 + ci*46} y={90 + ri*44} width="36" height="32" rx="8"
              fill={filled ? (ri===0&&ci===0||ri===1&&ci===1||ri===2&&ci===4 ? "#0a0a0a" : "#f0fdf4") : "#f9fafb"}
              stroke={filled&&!(ri===0&&ci===0||ri===1&&ci===1||ri===2&&ci===4) ? "#bbf7d0" : "none"}
            />
            {filled && <text x={5+ci*46+18} y={90+ri*44+20} textAnchor="middle" fontSize="10" fontWeight="500"
              fill={ri===0&&ci===0||ri===1&&ci===1||ri===2&&ci===4 ? "white":"#166534"} fontFamily="DM Sans, sans-serif">
              {ri===0&&ci===0?"$49":ri===1&&ci===1?"$99":ri===2&&ci===4?"$29":"Free"}
            </text>}
          </g>
        ))
      )}

      {/* AI badge */}
      <rect x="12" y="270" width="336" height="0" rx="0"/>
      <rect x="100" y="262" width="160" height="0" rx="0"/>
    </svg>
  );
}

function ResearchIllustration() {
  return (
    <svg viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect width="360" height="260" rx="16" fill="#fafafa"/>

      {/* Chat bubbles */}
      <rect x="20" y="20" width="200" height="40" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="35" y="35" fontSize="11" fill="#374151" fontFamily="DM Sans, sans-serif">What's your biggest challenge?</text>
      <text x="35" y="51" fontSize="10" fill="#9ca3af" fontFamily="DM Sans, sans-serif">AI Interviewer · just now</text>

      <rect x="100" y="76" width="220" height="40" rx="12" fill="#0a0a0a"/>
      <text x="115" y="91" fontSize="11" fill="white" fontFamily="DM Sans, sans-serif">Scheduling takes too long…</text>
      <text x="115" y="107" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="DM Sans, sans-serif">Respondent #47</text>

      <rect x="20" y="130" width="220" height="40" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
      <text x="35" y="145" fontSize="11" fill="#374151" fontFamily="DM Sans, sans-serif">Tell me more about that.</text>
      <text x="35" y="161" fontSize="10" fill="#9ca3af" fontFamily="DM Sans, sans-serif">AI Interviewer · following up</text>

      {/* Theme tags */}
      {["Scheduling", "Pricing", "Discovery", "Follow-ups"].map((tag, i) => (
        <g key={tag}>
          <rect x={20 + (i%2)*170} y={186 + Math.floor(i/2)*30} width={tag.length*7+16} height="22" rx="11"
            fill={i===0?"#0a0a0a":i===1?"#f0fdf4":i===2?"#eff6ff":"#fdf4ff"}
            stroke={i===1?"#bbf7d0":i===2?"#bfdbfe":i===3?"#e9d5ff":"none"}
          />
          <text x={28+(i%2)*170} y={202+Math.floor(i/2)*30} fontSize="10" fontWeight="500"
            fill={i===0?"white":i===1?"#166534":i===2?"#1e40af":"#7e22ce"} fontFamily="DM Sans, sans-serif">{tag}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── Agent Terminal Card ─── */
const agentSteps = [
  { label: "Reading creator business graph", status: "done" },
  { label: "Generating offer structure", status: "done" },
  { label: "Setting booking + payment rules", status: "active" },
  { label: "Drafting outreach sequences", status: "pending" },
  { label: "Awaiting your approval", status: "pending" },
];

function AgentTerminal() {
  const [progress, setProgress] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= agentSteps.length ? 0 : p + 1), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "#0d0d0d",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)",
    }}>
      {/* Terminal bar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.85 }} />
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'DM Mono', monospace", marginLeft: 6 }}>kreator ~ agent run</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "glow 2s ease-in-out infinite" }} />
          <span style={{ color: "#22c55e", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>LIVE</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: "20px 20px 4px" }}>
        {agentSteps.map((step, i) => {
          const done = i < progress;
          const active = i === progress;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px",
              marginBottom: 6,
              borderRadius: 10,
              background: done ? "rgba(34,197,94,0.06)" : active ? "rgba(255,255,255,0.04)" : "transparent",
              border: `1px solid ${done ? "rgba(34,197,94,0.15)" : active ? "rgba(255,255,255,0.08)" : "transparent"}`,
              transition: "all 0.5s ease",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                background: done ? "#22c55e" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: done ? "#fff" : "rgba(255,255,255,0.3)",
                flexShrink: 0, transition: "all 0.4s ease",
                fontFamily: "'DM Mono', monospace",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontFamily: "'DM Mono', monospace",
                color: done ? "#86efac" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
                transition: "color 0.4s ease", letterSpacing: 0.2,
              }}>
                {active && <span style={{ color: "#86efac", marginRight: 4 }}>▶</span>}{step.label}
                {active && <span style={{ animation: "blink 1s step-end infinite", color: "rgba(255,255,255,0.5)" }}>_</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Rec box */}
      <div style={{ margin: "12px 20px 20px", padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#fbbf24" }}>◆</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5, textTransform: "uppercase" }}>Recommendation</span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Add a $19 async audit, route brands to a free discovery call, and auto-interview non-buyers.
        </p>
      </div>
    </div>
  );
}

/* ─── DATA ─── */
const pillars = [
  { tag: "01", title: "Custom AI Operator", text: "A supervised agent that knows every product, booking, customer, workflow, and brand deal — acts only after your approval.", img: <WorkflowIllustration /> },
  { tag: "02", title: "Dynamic Bio + Store", text: "Not static links. Every block can sell, route, gate, schedule, upsell, and trigger automations.", img: <BookingIllustration /> },
  { tag: "03", title: "Research Autopilot", text: "Customer interviews, outreach, scheduling, AI moderation, transcript themes, and prioritized insights.", img: <ResearchIllustration /> },
];

const stats = [
  { value: "$18.4k", label: "Avg monthly revenue" },
  { value: "148×", label: "Bookings automated" },
  { value: "1,280", label: "Customers reached" },
  { value: "12 min", label: "To launch a funnel" },
];

const steps = [
  { n: "01", title: "Connect your workspace", text: "Bring your audience, offers, and calendar. The operator reads your full business graph." },
  { n: "02", title: "Describe the outcome", text: "Tell the agent a goal in plain language. It returns a sequenced, approvable action plan." },
  { n: "03", title: "Approve and automate", text: "Review, approve once, and let workflows run bookings, payments, and follow-ups 24/7." },
];

/* ─── MAIN ─── */
export default function KreatorOSV2() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#0a0a0a", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#0a0a0a;color:#fff;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{opacity:1;box-shadow:0 0 6px #22c55e}50%{opacity:0.6;box-shadow:0 0 2px #22c55e}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .fade-up{animation:fadeUp 0.8s cubic-bezier(.16,1,.3,1) both;}
        .fade-up-1{animation:fadeUp 0.8s 0.1s cubic-bezier(.16,1,.3,1) both;}
        .fade-up-2{animation:fadeUp 0.8s 0.22s cubic-bezier(.16,1,.3,1) both;}
        .fade-up-3{animation:fadeUp 0.8s 0.36s cubic-bezier(.16,1,.3,1) both;}
        .float{animation:float 5s ease-in-out infinite;}
        .nav-a{font-size:14px;font-weight:400;color:#6b7280;text-decoration:none;transition:color .2s;letter-spacing:-0.1px;}
        .nav-a:hover{color:#0a0a0a;}
        .btn-dark{display:inline-flex;align-items:center;gap:8px;background:#0a0a0a;color:#fff;padding:13px 28px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;text-decoration:none;border:none;cursor:pointer;transition:all .25s;letter-spacing:-0.2px;}
        .btn-dark:hover{background:#1a1a1a;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.15);}
        .btn-light{display:inline-flex;align-items:center;gap:8px;background:transparent;color:#0a0a0a;padding:13px 28px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:400;text-decoration:none;border:1px solid #e5e7eb;cursor:pointer;transition:all .25s;}
        .btn-light:hover{border-color:#0a0a0a;transform:translateY(-1px);}
        .feature-card{background:#fff;border:1px solid #f0f0f0;border-radius:20px;overflow:hidden;transition:all .3s;}
        .feature-card:hover{border-color:#0a0a0a;box-shadow:0 16px 48px rgba(0,0,0,0.07);transform:translateY(-3px);}
        .step-num{font-family:'Playfair Display',Georgia,serif;font-size:80px;font-weight:400;color:#f3f4f6;line-height:1;letter-spacing:-3px;position:absolute;top:-12px;right:16px;user-select:none;}
        .tag{font-family:'DM Mono',monospace;font-size:11px;font-weight:400;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;}
        .display-serif{font-family:'Playfair Display',Georgia,serif;font-weight:400;letter-spacing:-1px;}
        .italic-serif{font-style:italic;}
        hr.divider{border:none;border-top:1px solid #f0f0f0;}
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: scrolled ? "rgba(255,255,255,0.88)" : "#fff",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: "1px solid #f0f0f0",
        transition: "all .3s",
      }}>
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, background: "#0a0a0a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 15, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>K</span>
            </div>
            <span className="display-serif" style={{ fontSize: 19, color: "#0a0a0a" }}>KreatorOS</span>
          </a>
          <div style={{ display: "flex", gap: 36 }}>
            {["Features","How it works","Pricing"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} className="nav-a">{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="#" className="nav-a" style={{ padding: "8px 16px" }}>Log in</a>
            <a href="#" className="btn-dark" style={{ padding: "10px 22px", fontSize: 13 }}>Get started →</a>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px 60px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 72, alignItems: "center" }}>
        <div>
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 100, padding: "6px 16px", marginBottom: 32 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#374151", letterSpacing: 1 }}>CREATOR MONETIZATION AUTOPILOT</span>
          </div>

          <h1 className="display-serif fade-up-1" style={{ fontSize: 74, lineHeight: 1.0, letterSpacing: -3, marginBottom: 28, color: "#0a0a0a" }}>
            The AI <em className="italic-serif" style={{ color: "#6b7280" }}>operating</em><br/>
            system for<br/>
            creator <em className="italic-serif">businesses.</em>
          </h1>

          <p className="fade-up-2" style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.7, maxWidth: 430, marginBottom: 40, fontWeight: 300 }}>
            KreatorOS turns a bio link into a living business graph — store, paid calls, memberships, courses, brand deals, and AI-run workflows.
          </p>

          <div className="fade-up-3" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
            <a href="#" className="btn-dark">Launch your workspace →</a>
            <a href="#" className="btn-light">Try the AI chat</a>
          </div>

          <div className="fade-up-3" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex" }}>
              {["#dbeafe","#fce7f3","#dcfce7","#fef9c3"].map((c,i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: "2.5px solid white", marginLeft: i?-10:0 }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 300 }}>
              Trusted by <span style={{ color: "#0a0a0a", fontWeight: 500 }}>2,000+</span> creators worldwide
            </span>
          </div>
        </div>

        <div className="float fade-up-2">
          <AgentTerminal />
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", overflow: "hidden", padding: "14px 0", background: "#0a0a0a" }}>
        <div style={{
          display: "flex", gap: 56, whiteSpace: "nowrap",
          animation: "marquee 22s linear infinite",
        }}>
          {[...Array(3)].map((_,set) =>
            ["Bio Links", "Paid Bookings", "AI Workflows", "Brand Deals", "Research Interviews", "Memberships", "Courses", "Payments", "Email Sequences", "Analytics"].map((t,i) => (
              <span key={`${set}-${i}`} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", flexShrink: 0 }}>
                {t} <span style={{ color: "rgba(255,255,255,0.15)", margin: "0 8px" }}>·</span>
              </span>
            ))
          )}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}`}</style>
      </div>

      {/* ── STATS ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid #f0f0f0" }}>
          {stats.map((s,i) => (
            <div key={i} style={{ padding: "44px 28px", textAlign: "center", borderRight: i<3?"1px solid #f0f0f0":"none" }}>
              <div className="display-serif" style={{ fontSize: 52, letterSpacing: -2.5, color: "#0a0a0a", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9ca3af", marginTop: 10, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 60 }}>
          <div style={{ maxWidth: 560 }}>
            <div className="tag" style={{ marginBottom: 16 }}>Everything in one operator</div>
            <h2 className="display-serif" style={{ fontSize: 52, lineHeight: 1.05, letterSpacing: -2 }}>
              One workspace.<br/>
              <em className="italic-serif" style={{ color: "#6b7280" }}>Infinite leverage.</em>
            </h2>
          </div>
          <p style={{ maxWidth: 300, fontSize: 15, color: "#9ca3af", lineHeight: 1.65, fontWeight: 300, textAlign: "right" }}>
            Stop stitching six tools together. KreatorOS unifies everything under a supervised AI operator.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 20 }}>
          {pillars.map(p => (
            <div key={p.tag} className="feature-card">
              <div style={{ padding: "20px 20px 0", background: "#f9fafb" }}>
                {p.img}
              </div>
              <div style={{ padding: "24px 28px 28px" }}>
                <div className="tag" style={{ marginBottom: 12 }}>{p.tag}</div>
                <h3 className="display-serif" style={{ fontSize: 24, letterSpacing: -0.5, marginBottom: 10 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, fontWeight: 300 }}>{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Wide feature row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { tag: "04", title: "Workflow Canvas", text: "Node-based trigger/action editor for AI agents, payments, messages, calendar, CRM, and research loops." },
            { tag: "05–06", title: "Booking Intelligence + Brand Deals", text: "Cal.com-style routing, paid meetings, recurring sessions. Plus brand workspaces, discovery, proposals, deliverables." },
          ].map(p => (
            <div key={p.tag} className="feature-card" style={{ padding: "32px 36px" }}>
              <div className="tag" style={{ marginBottom: 14 }}>{p.tag}</div>
              <h3 className="display-serif" style={{ fontSize: 28, letterSpacing: -0.8, marginBottom: 12 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, fontWeight: 300, maxWidth: 380 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="tag" style={{ marginBottom: 16 }}>How it works</div>
            <h2 className="display-serif" style={{ fontSize: 52, lineHeight: 1.05, letterSpacing: -2 }}>
              From goal to automation<br/>
              <em className="italic-serif" style={{ color: "#6b7280" }}>in three steps.</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {steps.map(s => (
              <div key={s.n} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 20, padding: "36px 32px", position: "relative", overflow: "hidden", transition: "all .3s" }}>
                <div className="step-num">{s.n}</div>
                <div style={{ position: "relative" }}>
                  <div className="tag" style={{ marginBottom: 16 }}>{s.n}</div>
                  <h3 className="display-serif" style={{ fontSize: 26, letterSpacing: -0.5, marginBottom: 14 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, fontWeight: 300 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div style={{
          background: "#0a0a0a",
          borderRadius: 28,
          padding: "88px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Grid overlay */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }} preserveAspectRatio="none">
            <defs>
              <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          {/* Accent circles */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)" }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "6px 16px", marginBottom: 36 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5 }}>START FREE TODAY</span>
            </div>

            <h2 className="display-serif" style={{ fontSize: 64, fontWeight: 400, letterSpacing: -3, color: "#fff", lineHeight: 1.02, marginBottom: 24, maxWidth: 640, margin: "0 auto 24px" }}>
              Run your creator<br/>
              business <em className="italic-serif" style={{ color: "rgba(255,255,255,0.45)" }}>on autopilot.</em>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginBottom: 44, fontWeight: 300 }}>
              Connect your audience, describe a goal, and watch the operator build it.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 40 }}>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0a0a0a", padding: "14px 32px", borderRadius: 100, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none", letterSpacing: -0.2, transition: "all .25s" }}>
                Get started free →
              </a>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "#fff", padding: "14px 32px", borderRadius: 100, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 400, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)", letterSpacing: -0.2 }}>
                View live demo
              </a>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
              {["No credit card", "Cancel anytime", "Human-in-the-loop approvals"].map(f => (
                <span key={f} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 6, letterSpacing: 0.5 }}>
                  <span style={{ color: "#22c55e" }}>✓</span>{f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#0a0a0a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 12, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>K</span>
            </div>
            <span className="display-serif" style={{ fontSize: 17 }}>KreatorOS</span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9ca3af", letterSpacing: 0.5 }}>© {new Date().getFullYear()} KreatorOS. All rights reserved.</span>
          <div style={{ display: "flex", gap: 28 }}>
            {["Privacy","Terms","Contact"].map(l => (
              <a key={l} href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9ca3af", textDecoration: "none", fontWeight: 300, transition: "color .2s" }}
                onMouseEnter={e => e.currentTarget.style.color="#0a0a0a"}
                onMouseLeave={e => e.currentTarget.style.color="#9ca3af"}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}