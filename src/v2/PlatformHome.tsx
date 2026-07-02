import { useEffect, useMemo, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { T, SP, R, TYPE, SHADOW, MAXW } from "./theme";

// ── Live stats pulled from local state / storage ──────────────────────────
function useContentHubStats() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    getDocs(collection(getFirestore(), "contentHub"))
      .then((snap) => setCount(snap.size))
      .catch(() => setCount(null));
  }, []);
  return { count };
}

function useQaStats() {
  return useMemo(() => {
    if (typeof window === "undefined") return { audits: 0, flags: 0 };
    try {
      const raw = localStorage.getItem("gwi-ux-qa-walkthroughs/v1");
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return { audits: 0, flags: 0 };
      let flags = 0;
      for (const a of arr) {
        const ans = a?.answers || {};
        for (const k of Object.keys(ans)) if (ans[k]?.status === "fail") flags++;
      }
      return { audits: arr.length, flags };
    } catch { return { audits: 0, flags: 0 }; }
  }, []);
}

type Module = {
  key: string;
  eyebrow: string;
  title: string;
  desc: string;
  accent: string;
  accentBg: string;
  enter: () => void;
  cta: string;
  stats: { value: string; label: string }[];
  icon: React.ReactNode;
};

export function PlatformHome({
  setView,
  reviewerName,
  auditCount,
}: {
  setView: (v: string) => void;
  reviewerName?: string;
  auditCount?: number;
}) {
  const qa = useQaStats();
  const hub = useContentHubStats();
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setReady(true), 20); return () => clearTimeout(id); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (reviewerName || "").split(" ")[0];

  const modules: Module[] = [
    {
      key: "audit",
      eyebrow: "AI-powered",
      title: "UX Audit",
      desc: "Generate structured UX recommendations grounded in personas, lifecycle stages and verticals — then turn findings into wireframes and a tracked roadmap.",
      accent: T.audit,
      accentBg: T.auditBg,
      enter: () => setView("summary"),
      cta: "Open UX Audit",
      stats: [
        { value: auditCount != null ? String(auditCount) : "—", label: "Audits generated" },
        { value: "6", label: "Modules" },
      ],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" />
        </svg>
      ),
    },
    {
      key: "qa",
      eyebrow: "Website delivery",
      title: "QA",
      desc: "Run the 128-point GWI Website Delivery checklist against any staged URL — section by section, with auto-scanned answers and shareable reports.",
      accent: T.qa,
      accentBg: T.qaBg,
      enter: () => setView("qa-walkthrough"),
      cta: "Open QA",
      stats: [
        { value: String(qa.audits), label: "Pages QA'd" },
        { value: String(qa.flags), label: "Open flags" },
      ],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      key: "content-hub",
      eyebrow: "Studio resource",
      title: "Content Hub",
      desc: "Digital design trends, AI-assisted design tools, no-code platforms and agentic web standards — save what's worth sharing with the studio.",
      accent: T.hub,
      accentBg: T.hubBg,
      enter: () => setView("content-hub"),
      cta: "Open Content Hub",
      stats: [
        { value: hub.count != null ? String(hub.count) : "—", label: "Items saved" },
        { value: "4", label: "Topics" },
      ],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      {/* soft brand wash at the top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360, background: `radial-gradient(1200px 360px at 70% -120px, ${T.pinkTint}, transparent 70%)`, pointerEvents: "none" }} aria-hidden />

      <div style={{ position: "relative", maxWidth: MAXW, margin: "0 auto", padding: `${SP.huge}px ${SP.xl}px ${SP.huge}px` }}>

        {/* ── Masthead ──────────────────────────────────── */}
        <header style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(10px)", transition: "opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.pink }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.pink }} />
            GWI · UX Platform
            <span style={{ marginLeft: SP.sm, padding: "3px 8px", borderRadius: R.pill, background: T.ink, color: T.white, fontSize: 9, letterSpacing: "0.1em" }}>V2</span>
          </div>
          <h1 style={{ ...TYPE.hero, margin: `${SP.lg}px 0 ${SP.md}px` }}>
            {firstName ? `${greeting}, ${firstName}.` : "Design with certainty."}
          </h1>
          <p style={{ ...TYPE.lede, color: T.grey7, maxWidth: 600, margin: 0 }}>
            Everything for auditing and shipping a sharper GWI.com — in one place. Pick a module to begin.
          </p>
        </header>

        {/* ── Module grid ───────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: SP.xl, marginTop: SP.xxxl }}>
          {modules.map((m, i) => (
            <ModuleTile key={m.key} m={m} index={i} ready={ready} />
          ))}

          {/* Coming-soon placeholder — signals extensibility */}
          <div style={{
            border: `1.5px dashed ${T.grey4}`, borderRadius: R.xl, padding: SP.xxl,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            textAlign: "center", color: T.grey6, minHeight: 240,
            opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(16px)",
            transition: `opacity .5s ease ${0.12 * modules.length}s, transform .5s cubic-bezier(.16,1,.3,1) ${0.12 * modules.length}s`,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: R.md, background: T.grey2, display: "grid", placeItems: "center", marginBottom: SP.md, fontSize: 20, color: T.grey5 }}>+</div>
            <div style={{ ...TYPE.h3, color: T.grey7 }}>More modules</div>
            <p style={{ ...TYPE.small, color: T.grey6, margin: `${SP.xs}px 0 0`, maxWidth: 220 }}>
              Benchmarks and more — slotting in here as the platform grows.
            </p>
          </div>
        </div>

        <footer style={{ marginTop: SP.huge, paddingTop: SP.xl, borderTop: `1px solid ${T.grey3}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: SP.md }}>
          <span style={{ ...TYPE.small, color: T.grey6 }}>GWI Brand &amp; Creative · UX Platform</span>
          <span style={{ ...TYPE.small, color: T.grey5 }}>v2 · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}

function ModuleTile({ m, index, ready }: { m: Module; index: number; ready: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={m.enter}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: "left", cursor: "pointer", fontFamily: T.font,
        background: T.white, border: `1px solid ${hover ? m.accent : T.grey3}`,
        borderRadius: R.xl, padding: SP.xxl, minHeight: 240,
        display: "flex", flexDirection: "column", gap: SP.lg,
        boxShadow: hover ? SHADOW.hover : SHADOW.none,
        transform: ready ? (hover ? "translateY(-3px)" : "none") : "translateY(16px)",
        opacity: ready ? 1 : 0,
        transition: `opacity .5s ease ${0.12 * index}s, transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .2s`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: SP.md }}>
        <div style={{ width: 46, height: 46, borderRadius: R.md, background: m.accentBg, color: m.accent, display: "grid", placeItems: "center" }}>
          {m.icon}
        </div>
        <span style={{ ...TYPE.eyebrow, color: m.accent, opacity: 0.9 }}>{m.eyebrow}</span>
      </div>

      <div>
        <h2 style={{ ...TYPE.h1, fontSize: 30, margin: 0 }}>{m.title}</h2>
        <p style={{ ...TYPE.body, color: T.grey7, margin: `${SP.sm}px 0 0` }}>{m.desc}</p>
      </div>

      <div style={{ display: "flex", gap: SP.xl, marginTop: "auto", paddingTop: SP.sm }}>
        {m.stats.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.06em", color: T.ink, lineHeight: 1 }}>{s.value}</div>
            <div style={{ ...TYPE.label, color: T.grey6, marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: 7, color: m.accent, fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>
          {m.cta}
          <span style={{ transition: "transform .2s", transform: hover ? "translateX(3px)" : "none" }}>→</span>
        </div>
      </div>
    </button>
  );
}
