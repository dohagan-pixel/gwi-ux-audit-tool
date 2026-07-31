import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { T, SP, R, TYPE } from "./theme";
import { OVERLAP_DATA } from "./overlapDataSeed";

const VERDICT_COLOR: Record<string, string> = {
  "Duplicate of my planned piece": "#dc1f69",
  "Cannibalisation risk — consolidate or differentiate": "#8a5a12",
  "Refresh existing instead": "#00693e",
  "Net new (no conflict)": "#333688",
};
const VERDICT_SHORT: Record<string, string> = {
  "Duplicate of my planned piece": "Duplicate",
  "Cannibalisation risk — consolidate or differentiate": "Cannibal risk",
  "Refresh existing instead": "Refresh existing",
  "Net new (no conflict)": "Net new",
};
const VERDICTS = Object.keys(VERDICT_COLOR);
const MONTH_ORDER = [
  "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026",
  "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027", "Apr 2027",
];

export function PlanVsSeoGeoPage() {
  const [verdictFilter, setVerdictFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState("");
  const [variantFilter, setVariantFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of VERDICTS) c[v] = 0;
    for (const r of OVERLAP_DATA) c[r.recommendation] = (c[r.recommendation] || 0) + 1;
    return c;
  }, []);

  const months = useMemo(() => MONTH_ORDER.filter((m) => OVERLAP_DATA.some((r) => r.month === m)), []);
  const variants = useMemo(() => Array.from(new Set(OVERLAP_DATA.map((r) => r.variant))).sort(), []);
  const categories = useMemo(() => Array.from(new Set(OVERLAP_DATA.map((r) => r.category).filter(Boolean))).sort() as string[], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return OVERLAP_DATA.filter((r) => {
      if (verdictFilter && r.recommendation !== verdictFilter) return false;
      if (monthFilter && r.month !== monthFilter) return false;
      if (variantFilter && r.variant !== variantFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (q && !`${r.title} ${r.sharedKeyword || ""} ${r.existingUrl || ""} ${r.myListItem || ""} ${r.note || ""}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
  }, [verdictFilter, monthFilter, variantFilter, categoryFilter, search]);

  const hasFilters = !!(verdictFilter || monthFilter || variantFilter || categoryFilter || search);

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.plan }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.plan }} />
          FY27 · Overlap analysis
        </div>
        <h1 style={{ ...TYPE.hero, fontSize: "clamp(32px, 4.5vw, 48px)", margin: `${SP.sm}px 0 ${SP.md}px` }}>Content plan vs SEO/GEO plan</h1>
        <p style={{ ...TYPE.lede, color: T.grey7, margin: 0, maxWidth: 700, fontSize: 15 }}>
          Every FY27 editorial item checked against what's already published and what the SEO/GEO plan already commits to writing.
          {" "}{OVERLAP_DATA.length} items reviewed; {OVERLAP_DATA.length - counts["Net new (no conflict)"]} of them collide with something.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: SP.md, marginTop: SP.xl }}>
          {VERDICTS.map((v) => (
            <button
              key={v} type="button"
              onClick={() => setVerdictFilter((cur) => (cur === v ? "" : v))}
              style={{
                textAlign: "left", cursor: "pointer", fontFamily: T.font, background: T.white,
                border: `1.5px solid ${verdictFilter === v ? VERDICT_COLOR[v] : T.grey3}`, borderRadius: R.lg, padding: SP.lg,
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: VERDICT_COLOR[v], lineHeight: 1 }}>{counts[v]}</div>
              <div style={{ ...TYPE.small, fontWeight: 700, color: T.ink, marginTop: 6 }}>{v}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: SP.xl, marginTop: SP.xxl, paddingTop: SP.xl, borderTop: `1px solid ${T.grey3}` }}>
          <div>
            <div style={{ ...TYPE.h3, marginBottom: SP.sm }}>Where the two plans collide</div>
            <p style={{ ...TYPE.small, color: T.grey7, margin: 0, lineHeight: 1.6 }}>
              Five clusters account for most of the duplication: <strong>simulated / synthetic data</strong>, <strong>agentic AI</strong>,{" "}
              <strong>human data for AI</strong>, <strong>GWI API + MCP</strong>, and the annual <strong>consumer trends</strong> roundup.
              In each case the editorial plan and the SEO/GEO plan arrived at the same topic from different doors.
            </p>
          </div>
          <div>
            <div style={{ ...TYPE.h3, marginBottom: SP.sm }}>How to merge them</div>
            <p style={{ ...TYPE.small, color: T.grey7, margin: 0, lineHeight: 1.6 }}>
              Give every cluster one canonical URL with a keyword owner from the SEO/GEO plan, then let the editorial angle run as a section,
              a companion POV piece, or the H1 on that same URL. Anything the audit marks "refresh existing" moves out of the editorial
              calendar and into the refresh queue instead of becoming a new page.
            </p>
          </div>
          <div>
            <div style={{ ...TYPE.h3, marginBottom: SP.sm }}>What stays untouched</div>
            <p style={{ ...TYPE.small, color: T.grey7, margin: 0, lineHeight: 1.6 }}>
              Narrative, product-led and first-person pieces carry no search twin — they're the editorial spine of FY27 and should be
              protected from consolidation.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: SP.sm, marginTop: SP.xxl, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, keyword, URL or note…"
            style={{ fontFamily: T.font, fontSize: 13, padding: "9px 14px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, minWidth: 240 }}
          />
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={selectStyle}>
            <option value="">All months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={variantFilter} onChange={(e) => setVariantFilter(e.target.value)} style={selectStyle}>
            <option value="">All variants</option>
            {variants.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ ...TYPE.small, color: T.grey6 }}>{filtered.length} of {OVERLAP_DATA.length} items</span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setMonthFilter(""); setVariantFilter(""); setCategoryFilter(""); setVerdictFilter(""); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", color: T.grey6, cursor: "pointer", fontFamily: T.font, fontSize: 13 }}
            >
              Reset <RotateCcw size={13} />
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: SP.lg, marginTop: SP.lg }}>
          {filtered.map((r, i) => (
            <div
              key={i}
              style={{
                background: T.white, border: `1.5px solid ${T.grey3}`, borderRadius: R.lg, padding: SP.lg,
                transition: "border-color .15s", cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.pink; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.grey3; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ ...TYPE.label, color: T.grey6 }}>{r.month}</span>
                <span style={{ ...TYPE.label, color: T.grey5 }}>·</span>
                <span style={{ ...TYPE.label, color: T.grey6 }}>{r.variant}</span>
                {r.category && <><span style={{ ...TYPE.label, color: T.grey5 }}>·</span><span style={{ ...TYPE.label, color: T.grey6 }}>{r.category}</span></>}
                {r.cannibalRisk && <span style={{ ...TYPE.label, color: "#8a5a12", background: "#8a5a1218", padding: "2px 6px", borderRadius: R.sm, marginLeft: "auto" }}>CANNIBAL RISK</span>}
              </div>
              <div style={{ ...TYPE.body, fontWeight: 700, color: T.ink, marginTop: SP.sm, lineHeight: 1.35 }}>{r.title}</div>
              <div style={{ marginTop: SP.sm }}>
                <span style={{ ...TYPE.label, color: VERDICT_COLOR[r.recommendation], background: `${VERDICT_COLOR[r.recommendation]}18`, padding: "3px 8px", borderRadius: R.sm }}>
                  {VERDICT_SHORT[r.recommendation] || r.recommendation}
                </span>
              </div>
              {(r.sharedKeyword || r.competesWith || r.existingUrl) && (
                <div style={{ marginTop: SP.md, paddingTop: SP.sm, borderTop: `1px solid ${T.grey3}`, fontSize: 12, color: T.grey7, display: "flex", flexDirection: "column", gap: 2 }}>
                  {r.sharedKeyword && <div><strong style={{ color: T.grey6 }}>Shared keyword:</strong> {r.sharedKeyword}</div>}
                  {r.competesWith && <div><strong style={{ color: T.grey6 }}>Competes with:</strong> {r.competesWith}</div>}
                  {r.existingUrl && <div><strong style={{ color: T.grey6 }}>Existing URL:</strong> {r.existingUrl}</div>}
                </div>
              )}
              {r.myListItem && (
                <div style={{ marginTop: SP.sm, fontSize: 12, color: T.grey7 }}>
                  <strong style={{ color: T.grey6 }}>Planned twin:</strong> {r.myListItem.split(" :: ").pop()}
                </div>
              )}
              {r.note && <p style={{ ...TYPE.small, color: T.grey6, margin: `${SP.sm}px 0 0`, lineHeight: 1.5 }}>{r.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = { fontFamily: T.font, fontSize: 13, padding: "9px 10px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink };
