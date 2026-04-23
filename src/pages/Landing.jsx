import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/storage";

// ─────────────────────────────────────────────────────────────────────────────
//  HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useCounter(target, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf, start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─────────────────────────────────────────────────────────────────────────────
//  INJECTED CSS  (keyframes + class-based hover/responsive rules)
// ─────────────────────────────────────────────────────────────────────────────

const INJECTED_CSS = `
  @keyframes ne-fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ne-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes ne-floatB {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-8px) rotate(1deg); }
  }
  @keyframes ne-pulse {
    0%   { box-shadow: 0 0 0 0   hsla(142,70%,45%,0.55); }
    70%  { box-shadow: 0 0 0 10px hsla(142,70%,45%,0);   }
    100% { box-shadow: 0 0 0 0   hsla(142,70%,45%,0);   }
  }
  @keyframes ne-scan {
    0%   { top: -1px; opacity: 0.7; }
    85%  { opacity: 0.25; }
    100% { top: 100%;  opacity: 0;  }
  }
  @keyframes ne-ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes ne-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes ne-bar {
    from { width: 0; }
  }
  @keyframes ne-blink {
    0%, 100% { opacity: 1;   }
    50%       { opacity: 0.2; }
  }
  @keyframes ne-scoreIn {
    from { opacity: 0; transform: scale(0.88) translateY(20px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  @keyframes ne-ringDraw {
    from { stroke-dashoffset: 327; }
    to   { stroke-dashoffset: 0;   }
  }

  /* Entry helpers */
  .ne-hl  { animation: ne-fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both; }
  .ne-hl:nth-child(1) { animation-delay: 0.05s; }
  .ne-hl:nth-child(2) { animation-delay: 0.16s; }
  .ne-hl:nth-child(3) { animation-delay: 0.27s; }
  .ne-hl:nth-child(4) { animation-delay: 0.42s; }
  .ne-hl:nth-child(5) { animation-delay: 0.56s; }
  .ne-hl:nth-child(6) { animation-delay: 0.70s; }

  /* Continuous */
  .ne-float       { animation: ne-float  8s ease-in-out infinite; }
  .ne-floatB      { animation: ne-floatB 11s ease-in-out infinite; animation-delay: -4s; }
  .ne-pulse-dot   { animation: ne-pulse  2s  ease-out    infinite; border-radius: 50%; }
  .ne-blink       { animation: ne-blink  1.6s ease-in-out infinite; }
  .ne-ticker-run  { animation: ne-ticker 38s linear      infinite; }
  .ne-score-in    { animation: ne-scoreIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }

  /* Scan line */
  .ne-scan-line {
    position: absolute; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, hsl(142,70%,45%), transparent);
    animation: ne-scan 4.5s ease-in-out infinite;
    pointer-events: none; z-index: 10;
  }

  /* Shimmer gradient text */
  .ne-shimmer {
    background: linear-gradient(90deg,
      hsl(142,70%,52%) 0%,
      hsl(45,100%,58%) 45%,
      hsl(142,70%,52%) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ne-shimmer 4s linear infinite;
  }

  /* Bar fill */
  .ne-bar { animation: ne-bar 1.3s cubic-bezier(0.16,1,0.3,1) both; }

  /* Hover cards */
  .ne-card-hover {
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1),
                border-color 0.3s ease,
                background 0.3s ease,
                box-shadow 0.3s ease;
  }
  .ne-card-hover:hover {
    transform: translateY(-5px) !important;
    border-color: hsla(142,70%,45%,0.35) !important;
    box-shadow: 0 20px 50px hsla(0,0%,0%,0.4) !important;
  }
  .ne-gold-hover:hover {
    border-color: hsla(45,100%,50%,0.35) !important;
    background: hsla(45,100%,50%,0.04) !important;
  }
  .ne-btn-primary {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .ne-btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 14px 40px hsla(142,70%,45%,0.45) !important;
  }
  .ne-btn-ghost {
    transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
  }
  .ne-btn-ghost:hover {
    background: hsla(0,0%,100%,0.06) !important;
    border-color: hsla(0,0%,100%,0.28) !important;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .ne-hero-grid   { grid-template-columns: 1fr !important; }
    .ne-steps-row   { flex-direction: column !important; }
    .ne-steps-line  { display: none !important; }
    .ne-feat-grid   { grid-template-columns: 1fr 1fr !important; }
    .ne-stat-grid   { grid-template-columns: 1fr !important; gap: 48px !important; }
    .ne-prob-grid   { grid-template-columns: 1fr !important; }
    .ne-persona-grid{ grid-template-columns: 1fr !important; }
    .ne-section-pad { padding: 64px 28px !important; }
    .ne-hero-pad    { padding: 120px 28px 60px !important; }
    .ne-nav-pad     { padding: 16px 24px !important; }
    .ne-footer-row  { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
  }
  @media (max-width: 600px) {
    .ne-feat-grid   { grid-template-columns: 1fr !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const G    = "hsl(142,70%,45%)";
const GOLD = "hsl(45,100%,55%)";
const RED  = "hsl(0,62%,55%)";

const TICKER_ITEMS = [
  "₦ / USD  1,621  ↑",
  "₦ / GBP  2,104  →",
  "₦ / CAD  1,184  ↑",
  "₦ / EUR  1,811  ↑",
  "₦ / AUD  1,063  →",
  "Bayse Signal  BEARISH  ●",
  "Political Risk  ELEVATED  ●",
  "Japa Index  67 / 100",
  "3.9M+ Nigerians emigrated  ●",
  "FX 7-day trend  WEAKENING  ↓",
];

const SIGNALS = [
  { label: "Savings Readiness", display: "78%",   pct: 78,  color: G,    delay: 500 },
  { label: "Savings Velocity",  display: "+16%",  pct: 60,  color: G,    delay: 650 },
  { label: "FX Trend Signal",   display: "−2.1%", pct: 28,  color: RED,  delay: 800 },
  { label: "Bayse Sentiment",   display: "42%",   pct: 42,  color: GOLD, delay: 950 },
];

const STEPS = [
  { n: "01", title: "Onboard",              desc: "Name, country, savings, monthly rate. Two minutes flat." },
  { n: "02", title: "Bayse Pulls Signals",  desc: "Live political odds + crypto sentiment from Nigerian markets." },
  { n: "03", title: "FX Engine Scans",      desc: "Live ₦ rates + full 7-day movement trend." },
  { n: "04", title: "Score Calculated",     desc: "4-signal weighted algorithm → one number." },
  { n: "05", title: "Action Plan Delivered",desc: "5 personalized steps. Exact. Specific. Ready to execute." },
];

const FEATURES = [
  { icon: "◉", title: "Live Japa Score",     desc: "0–100. Four live signals. Recalculates on every visit so you're never working off stale data.", hi: G    },
  { icon: "◈", title: "Bayse Intelligence",  desc: "Nigerian prediction markets drive every signal. 2027 election odds, instability alerts, crypto timing.", hi: GOLD },
  { icon: "⟲", title: "FX Timing Engine",    desc: "7-day ₦ movement tracked daily. Get told when to convert — before the rate crashes.", hi: G    },
  { icon: "◆", title: "AI Action Plan",      desc: "GPT-4o generates 5 steps built from your exact savings, destination cost, FX rate, and Bayse signal.", hi: GOLD },
  { icon: "⌖", title: "Japa Runway",         desc: "See the exact months until you're ready at your current savings velocity.", hi: G    },
  { icon: "◎", title: "Naija AI Chatbot",    desc: "Context-aware. Knows your score, rate, country. Answer to 'Should I convert now?' — instant.", hi: GOLD },
];

const PERSONAS = [
  { emoji: "💰", label: "The Saver",     desc: "Saving for 1–2 years but has no idea if the amount is enough or when the right time to leave actually is.", need: "Japa Score + Runway"         },
  { emoji: "💱", label: "The Converter", desc: "Ready to move money to USD but paralysed by fear of converting at exactly the wrong moment.",                need: "FX Trend + Bayse Signal"    },
  { emoji: "🗺️", label: "The Planner",   desc: "Has a target country but no honest breakdown of what it really costs to survive the first three months.",    need: "Relocation Cost Tracker"    },
  { emoji: "📰", label: "The Anxious",   desc: "Refreshes political news daily. Terrified the ₦ will crash before they're ready to leave.",                  need: "Political Risk Alert"       },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SignalBar({ label, display, pct, color, delay, active }) {
  return (
    <div style={{ marginBottom: "11px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "11px", color: "hsl(240,4%,55%)", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontSize: "11px", fontWeight: "700", color }}>{display}</span>
      </div>
      <div style={{ height: "3px", background: "hsla(0,0%,100%,0.07)", borderRadius: "2px", overflow: "hidden" }}>
        <div
          className={active ? "ne-bar" : ""}
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "2px",
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function StatCounter({ target, suffix = "", label, sub, active, duration = 1800 }) {
  const val = useCounter(target, duration, active);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: "clamp(48px, 6vw, 72px)", fontWeight: "700",
        fontFamily: "var(--font-heading)", letterSpacing: "-0.03em",
        lineHeight: 1, color: G,
      }}>
        {val}{suffix}
      </div>
      <div style={{ fontSize: "15px", fontWeight: "600", color: "hsl(0,0%,88%)", marginTop: "10px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "hsl(240,4%,50%)", marginTop: "5px", lineHeight: "1.5" }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const user     = getUser();

  const [heroReady,    setHeroReady]    = useState(false);
  const [statsRef,     statsInView]     = useInView(0.3);
  const [stepsRef,     stepsInView]     = useInView(0.1);
  const [featRef,      featInView]      = useInView(0.1);
  const [personaRef,   personaInView]   = useInView(0.1);
  const [probRef,      probInView]      = useInView(0.1);

  useEffect(() => {
    const id = "ne-landing-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = INJECTED_CSS;
      document.head.appendChild(el);
    }
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => {
      clearTimeout(t);
      document.getElementById(id)?.remove();
    };
  }, []);

  const tickerStr = [...TICKER_ITEMS, ...TICKER_ITEMS].join("   ·   ");

  // ── Shared style objects ──────────────────────────────────────────────────
  const glass = {
    background: "hsla(240,5%,8%,0.92)",
    border: "1px solid hsla(0,0%,100%,0.09)",
    borderRadius: "18px",
    backdropFilter: "blur(20px)",
  };

  const tagStyle = (col) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: `hsla(${col === G ? "142,70%,45%" : "45,100%,50%"},0.1)`,
    border: `1px solid hsla(${col === G ? "142,70%,45%" : "45,100%,50%"},0.22)`,
    borderRadius: "100px", padding: "5px 13px",
    fontSize: "11px", fontWeight: "700", color: col,
    letterSpacing: "0.07em", textTransform: "uppercase",
  });

  const sectionHead = (label, title, sub, labelColor = G) => (
    <div style={{ textAlign: "center", marginBottom: "64px" }}>
      <p style={{ fontSize: "11px", color: labelColor, letterSpacing: "0.12em", fontWeight: "700", textTransform: "uppercase", marginBottom: "18px" }}>{label}</p>
      <h2 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: "700", fontFamily: "var(--font-heading)", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
        {title}<br />
        <span style={{ color: "hsl(240,4%,48%)", fontWeight: "400" }}>{sub}</span>
      </h2>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "hsl(0,0%,2%)", color: "hsl(0,0%,97%)", overflowX: "hidden" }}>

      {/* ── GLOBAL BACKGROUND ──────────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 65% 55% at 10% 50%, hsla(142,70%,45%,0.065) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 88% 20%, hsla(45,100%,50%,0.04)  0%, transparent 50%)
        `,
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.28,
        backgroundImage: `
          linear-gradient(hsla(0,0%,100%,0.025) 1px, transparent 1px),
          linear-gradient(90deg, hsla(0,0%,100%,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "52px 52px",
      }} />

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "hsla(0,0%,2%,0.82)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid hsla(0,0%,100%,0.06)",
      }}
        className="ne-nav-pad"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="ne-pulse-dot" style={{ width: "10px", height: "10px", background: G }} />
          <span style={{ fontSize: "17px", fontWeight: "700", fontFamily: "var(--font-heading)", letterSpacing: "-0.015em" }}>
            Naija Exit
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user && (
            <button className="ne-btn-ghost" onClick={() => navigate("/dashboard")} style={{
              background: "transparent", color: "hsl(0,0%,65%)",
              border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "8px",
              padding: "8px 18px", fontSize: "13px", cursor: "pointer",
            }}>Dashboard</button>
          )}
          <button className="ne-btn-primary" onClick={() => navigate("/onboarding")} style={{
            background: G, color: "#fff", border: "none", borderRadius: "8px",
            padding: "9px 22px", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "-0.01em",
          }}>Get Japa Score →</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        className="ne-hero-pad ne-hero-grid"
        style={{
          minHeight: "100vh",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "56px", alignItems: "center",
          maxWidth: "1280px", margin: "0 auto",
          position: "relative", zIndex: 1,
        }}
      >
        {/* ── Left copy ── */}
        <div>
          <div className="ne-hl" style={{ marginBottom: "28px" }}>
            <span style={tagStyle(G)}>
              <span className="ne-blink" style={{ width: "6px", height: "6px", borderRadius: "50%", background: G, display: "inline-block" }} />
              OAU · Bayse Hackathon 2026 · Team Oracle
            </span>
          </div>

          <h1 className="ne-hl" style={{
            fontSize: "clamp(40px,5.5vw,68px)", fontWeight: "700",
            fontFamily: "var(--font-heading)", letterSpacing: "-0.03em", lineHeight: 1.08,
            marginBottom: "0px",
          }}>
            Know exactly
          </h1>
          <h1 className="ne-hl" style={{
            fontSize: "clamp(40px,5.5vw,68px)", fontWeight: "700",
            fontFamily: "var(--font-heading)", letterSpacing: "-0.03em", lineHeight: 1.08,
            marginBottom: "28px",
          }}>
            <span className="ne-shimmer">when to Japa.</span>
          </h1>

          <p className="ne-hl" style={{
            fontSize: "17px", color: "hsl(240,4%,62%)", lineHeight: "1.78",
            maxWidth: "440px", marginBottom: "40px",
          }}>
            Your personalized Japa Score — powered by live FX rates, Bayse market
            signals, and AI — tells you if you're ready to relocate and exactly when
            to convert your Naira.
          </p>

          <div className="ne-hl" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="ne-btn-primary" onClick={() => navigate("/onboarding")} style={{
              background: G, color: "#fff", border: "none", borderRadius: "10px",
              padding: "15px 36px", fontSize: "16px", fontWeight: "700", cursor: "pointer", letterSpacing: "-0.01em",
            }}>
              Get my Japa Score →
            </button>
            {user && (
              <button className="ne-btn-ghost" onClick={() => navigate("/dashboard")} style={{
                background: "transparent", color: "hsl(0,0%,70%)",
                border: "1px solid hsla(0,0%,100%,0.11)", borderRadius: "10px",
                padding: "15px 30px", fontSize: "16px", cursor: "pointer",
              }}>
                Back to dashboard
              </button>
            )}
          </div>

          <div className="ne-hl" style={{ display: "flex", gap: "32px", marginTop: "44px" }}>
            {[
              ["3.9M+", "Nigerians emigrated"],
              ["70%+",  "Naira lost in value"],
              ["1 in 3","face financial crisis"],
            ].map(([n, l]) => (
              <div key={n}>
                <div style={{ fontSize: "21px", fontWeight: "700", fontFamily: "var(--font-heading)", color: G }}>{n}</div>
                <div style={{ fontSize: "12px", color: "hsl(240,4%,50%)", marginTop: "3px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Score card ── */}
        <div className="ne-score-in ne-float" style={{
          ...glass,
          padding: "32px",
          boxShadow: "0 40px 90px hsla(0,0%,0%,0.55), 0 0 0 1px hsla(142,70%,45%,0.08)",
          position: "relative", overflow: "hidden",
        }}>
          <div className="ne-scan-line" />

          {/* Card top */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="ne-pulse-dot" style={{ width: "8px", height: "8px", background: G }} />
              <span style={{ fontSize: "14px", fontWeight: "700" }}>Naija Exit</span>
            </div>
            <span style={{
              fontSize: "12px", color: "hsl(240,4%,55%)",
              background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)",
              borderRadius: "6px", padding: "4px 10px",
            }}>🇨🇦 Canada · Adaeze</span>
          </div>

          {/* Score ring + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "26px" }}>
            <svg width="114" height="114" viewBox="0 0 114 114" style={{ flexShrink: 0 }}>
              <circle cx="57" cy="57" r="48" fill="none" stroke="hsla(0,0%,100%,0.06)" strokeWidth="8" />
              <circle
                cx="57" cy="57" r="48" fill="none"
                stroke={G} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(67 / 100) * 301.6} 301.6`}
                transform="rotate(-90 57 57)"
              />
              <text x="57" y="51" textAnchor="middle" fill="hsl(0,0%,97%)" fontSize="26" fontWeight="700" fontFamily="Outfit,sans-serif">67</text>
              <text x="57" y="67" textAnchor="middle" fill="hsl(240,4%,52%)" fontSize="11" fontFamily="Inter,sans-serif">/100</text>
            </svg>
            <div>
              <span style={{
                display: "inline-block",
                background: "hsla(142,70%,45%,0.14)", color: G,
                border: "1px solid hsla(142,70%,45%,0.28)",
                borderRadius: "6px", padding: "4px 11px",
                fontSize: "11px", fontWeight: "800", letterSpacing: "0.06em",
                marginBottom: "10px",
              }}>ALMOST READY</span>
              <p style={{ fontSize: "12px", color: "hsl(240,4%,58%)", lineHeight: "1.65", maxWidth: "165px" }}>
                Hold conversion. Bayse political risk elevated. FX trending weak this week.
              </p>
            </div>
          </div>

          {/* Signal bars */}
          <div style={{ marginBottom: "20px" }}>
            {SIGNALS.map((s) => (
              <SignalBar key={s.label} {...s} active={heroReady} />
            ))}
          </div>

          {/* AI Action Plan */}
          <div style={{
            background: "hsla(142,70%,45%,0.06)",
            border: "1px solid hsla(142,70%,45%,0.14)",
            borderRadius: "10px", padding: "13px 16px", marginBottom: "16px",
          }}>
            <div style={{ fontSize: "10px", color: G, letterSpacing: "0.1em", fontWeight: "800", marginBottom: "7px" }}>● AI ACTION PLAN</div>
            <p style={{ fontSize: "12px", color: "hsl(240,4%,65%)", lineHeight: "1.7" }}>
              Hold conversion. Increase monthly savings by ₦50K. Prioritize visa budget — only ₦120K short. Watch Bayse weekly.
            </p>
          </div>

          {/* Bottom stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "JAPA RUNWAY",    value: "~8 months", valueColor: G    },
              { label: "LIVE ₦/USD",     value: "1,621",     valueColor: "hsl(0,0%,88%)" },
            ].map(({ label, value, valueColor }) => (
              <div key={label} style={{
                background: "hsla(0,0%,100%,0.03)",
                border: "1px solid hsla(0,0%,100%,0.07)",
                borderRadius: "9px", padding: "11px 14px",
              }}>
                <div style={{ fontSize: "10px", color: "hsl(240,4%,48%)", letterSpacing: "0.07em", marginBottom: "5px" }}>{label}</div>
                <div style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-heading)", color: valueColor }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FX TICKER ──────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid hsla(0,0%,100%,0.06)",
        borderBottom: "1px solid hsla(0,0%,100%,0.06)",
        background: "hsla(240,5%,5%,0.85)", overflow: "hidden",
        padding: "12px 0", position: "relative", zIndex: 1,
      }}>
        <div className="ne-ticker-run" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: "12px", color: "hsl(240,4%,50%)", letterSpacing: "0.05em", paddingRight: "80px" }}>
            {tickerStr}
          </span>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="ne-section-pad ne-stat-grid"
        style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: "48px", maxWidth: "1100px", margin: "0 auto",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 80% at 50% 50%, hsla(142,70%,45%,0.045), transparent)" }} />
        <StatCounter target={39}  suffix="M+" label="Nigerians emigrated"          sub="2017 — 2023"                            active={statsInView} duration={2000} />
        <StatCounter target={70}  suffix="%+" label="Naira lost in value"           sub="Since the 2022 currency float"           active={statsInView} duration={1500} />
        <StatCounter target={67}  suffix="%"  label="First-year migrants"           sub="face financial hardship abroad"          active={statsInView} duration={1800} />
      </section>

      {/* ── PROBLEM ────────────────────────────────────────────────── */}
      <section
        ref={probRef}
        className="ne-section-pad"
        style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}
      >
        {sectionHead("The Reality", "The Blind Journey.", "And why it fails most Nigerians.")}
        <div className="ne-prob-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px" }}>
          {[
            { n: "01", title: "Convert Naira blindly",     desc: "They convert savings to USD at whatever rate is available — often the worst possible moment." },
            { n: "02", title: "Underestimate the real cost",desc: "Visa fees, flights, housing deposit, first month rent — the actual number is 3× what they budgeted." },
            { n: "03", title: "Ignore political signals",   desc: "₦ weakens fastest during instability. Nobody warns them to convert before the crash comes." },
            { n: "04", title: "Arrive completely unprepared",desc: "First 3 months abroad are the hardest. No income yet. Savings run out. The crisis begins quietly." },
          ].map((item, i) => (
            <div
              key={item.n}
              className="ne-card-hover"
              style={{
                ...glass, padding: "28px 32px",
                opacity: probInView ? 1 : 0,
                transform: probInView ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.55s ease ${i * 0.1}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s, border-color 0.3s ease, box-shadow 0.3s ease`,
              }}
            >
              <div style={{ fontSize: "11px", color: G, letterSpacing: "0.1em", fontWeight: "800", marginBottom: "13px" }}>{item.n}</div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", fontFamily: "var(--font-heading)", marginBottom: "10px" }}>{item.title}</h3>
              <p style={{ fontSize: "14px", color: "hsl(240,4%,58%)", lineHeight: "1.72" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section
        ref={stepsRef}
        className="ne-section-pad"
        style={{
          background: "hsla(240,5%,4%,0.6)",
          borderTop: "1px solid hsla(0,0%,100%,0.05)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {sectionHead("The System", "Entirely AI-governed.", "From signal to action plan.")}
          <div className="ne-steps-row" style={{ display: "flex", position: "relative" }}>
            {/* connector */}
            <div className="ne-steps-line" style={{
              position: "absolute", top: "20px",
              left: "calc(100% / 10)", right: "calc(100% / 10)",
              height: "1px",
              background: `linear-gradient(90deg, transparent, hsla(142,70%,45%,0.35), transparent)`,
            }} />
            {STEPS.map((s, i) => (
              <div key={s.n} className="ne-card-hover" style={{
                flex: 1, margin: "0 8px",
                ...glass, padding: "24px 18px",
                opacity: stepsInView ? 1 : 0,
                transform: stepsInView ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.55s ease ${i * 0.11}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.11}s, border-color 0.3s ease, box-shadow 0.3s ease`,
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "hsla(142,70%,45%,0.11)",
                  border: "1px solid hsla(142,70%,45%,0.24)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: "800", color: G, marginBottom: "16px",
                }}>{s.n}</div>
                <h3 style={{ fontSize: "14px", fontWeight: "700", fontFamily: "var(--font-heading)", marginBottom: "9px" }}>{s.title}</h3>
                <p style={{ fontSize: "12px", color: "hsl(240,4%,55%)", lineHeight: "1.68" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section
        ref={featRef}
        className="ne-section-pad"
        style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}
      >
        {sectionHead("What You Get", "Built on real intelligence.", "Not vibes. Not guesses.")}
        <div className="ne-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="ne-card-hover" style={{
              ...glass, padding: "28px",
              opacity: featInView ? 1 : 0,
              transform: featInView ? "translateY(0)" : "translateY(24px)",
              transition: `opacity 0.55s ease ${i * 0.08}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s, border-color 0.3s ease, box-shadow 0.3s ease`,
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: `hsla(${f.hi === G ? "142,70%,45%" : "45,100%,50%"},0.1)`,
                border: `1px solid hsla(${f.hi === G ? "142,70%,45%" : "45,100%,50%"},0.2)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", color: f.hi, marginBottom: "18px",
              }}>{f.icon}</div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-heading)", marginBottom: "10px" }}>{f.title}</h3>
              <p style={{ fontSize: "13px", color: "hsl(240,4%,55%)", lineHeight: "1.75" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT SAVES ───────────────────────────────────────────── */}
      <section
        ref={personaRef}
        className="ne-section-pad"
        style={{
          background: "hsla(240,5%,4%,0.6)",
          borderTop: "1px solid hsla(0,0%,100%,0.05)",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {sectionHead("Who This Saves", "Every Nigerian planning to Japa", "deserves to do it with eyes wide open.", GOLD)}
          <div className="ne-persona-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px" }}>
            {PERSONAS.map((p, i) => (
              <div key={p.label} className="ne-card-hover ne-gold-hover" style={{
                ...glass, padding: "28px 32px",
                display: "flex", gap: "20px", alignItems: "flex-start",
                opacity: personaInView ? 1 : 0,
                transform: personaInView ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s, border-color 0.3s ease, box-shadow 0.3s ease`,
              }}>
                <div style={{ fontSize: "34px", lineHeight: 1, flexShrink: 0 }}>{p.emoji}</div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-heading)", marginBottom: "8px" }}>{p.label}</h3>
                  <p style={{ fontSize: "13px", color: "hsl(240,4%,58%)", lineHeight: "1.72", marginBottom: "14px" }}>{p.desc}</p>
                  <span style={{
                    display: "inline-block", fontSize: "11px", fontWeight: "700", color: GOLD,
                    background: "hsla(45,100%,50%,0.08)",
                    border: "1px solid hsla(45,100%,50%,0.2)",
                    borderRadius: "6px", padding: "4px 11px", letterSpacing: "0.03em",
                  }}>Needs: {p.need}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="ne-section-pad" style={{ textAlign: "center", position: "relative", overflow: "hidden", zIndex: 1 }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 75% 55% at 50% 50%, hsla(142,70%,45%,0.08) 0%, transparent 65%)",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: "14px", color: "hsl(240,4%,45%)", marginBottom: "36px", letterSpacing: "0.02em" }}>
            Chidi didn't have Naija Exit. The next million Nigerians will.
          </p>
          <h2 style={{
            fontSize: "clamp(38px,5.5vw,72px)", fontWeight: "700",
            fontFamily: "var(--font-heading)", letterSpacing: "-0.03em", lineHeight: 1.08,
            marginBottom: "8px",
          }}>Find out your</h2>
          <h2 style={{
            fontSize: "clamp(38px,5.5vw,72px)", fontWeight: "700",
            fontFamily: "var(--font-heading)", letterSpacing: "-0.03em", lineHeight: 1.08,
            marginBottom: "52px",
          }}>
            <span className="ne-shimmer">Japa Score today.</span>
          </h2>
          <button className="ne-btn-primary" onClick={() => navigate("/onboarding")} style={{
            background: G, color: "#fff", border: "none", borderRadius: "12px",
            padding: "18px 52px", fontSize: "18px", fontWeight: "700",
            cursor: "pointer", letterSpacing: "-0.01em",
          }}>
            Get my Japa Score →
          </button>
          <p style={{ marginTop: "22px", fontSize: "13px", color: "hsl(240,4%,42%)" }}>
            Free · 2 minutes · Powered by Bayse + OpenAI
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer
        className="ne-footer-row"
        style={{
          borderTop: "1px solid hsla(0,0%,100%,0.06)",
          padding: "28px 64px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "7px", height: "7px", background: G, borderRadius: "50%" }} />
          <span style={{ fontSize: "14px", fontWeight: "700" }}>Naija Exit</span>
          <span style={{ fontSize: "13px", color: "hsl(240,4%,42%)", marginLeft: "6px" }}>· Team Oracle · OAU Bayse Hackathon 2026</span>
        </div>
        <span style={{ fontSize: "12px", color: "hsl(240,4%,38%)" }}>
          Powered by Bayse · OpenAI · ExchangeRate API
        </span>
      </footer>

    </div>
  );
}