import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { T, SP, R, TYPE } from "./theme";
import { REFRESH_DATA, REFRESH_KEY, type RefreshRow } from "./refreshDataSeed";

const REFRESH_ACTIONS = ["SEO Refresh", "Evergreen Refresh", "Generational Refresh", "SEO + GEO Refresh", "Consolidate / Merge"];
const GEO_SEO_ACTIONS = ["Net New — SEO", "Net New — GEO"];

const ACTION_COLOR: Record<string, string> = {
  "SEO Refresh": "#333688",
  "Evergreen Refresh": "#00693e",
  "Generational Refresh": "#dc1f69",
  "SEO + GEO Refresh": "#8a5a12",
  "Consolidate / Merge": "#526482",
  "Net New — SEO": "#00618f",
  "Net New — GEO": "#7b2fa0",
};
const PRIORITY_COLOR: Record<string, string> = { High: "#dc1f69", Medium: "#8a5a12", Low: "#526482" };
const DECLINE_COLOR: Record<string, string> = { Steep: "#dc1f69", Declining: "#8a5a12", "Low base": "#8a99b0", No: "#00693e" };

function badge(text: string, color: string) {
  return <span style={{ ...TYPE.label, color, background: `${color}18`, padding: "3px 8px", borderRadius: R.sm, whiteSpace: "nowrap" }}>{text}</span>;
}

function fmtNum(n?: number) {
  return n == null ? "—" : n.toLocaleString();
}

function stripDomain(url: string) {
  return url.replace(/^https?:\/\/(www\.)?gwi\.com/i, "");
}

type SortKey = "url" | "action" | "status" | "priority" | "sessions" | "conv" | "peec" | "genai" | "volume" | "kd";
const PRIORITY_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export function ContentRefreshPage({ mode }: { mode: "refresh" | "geo-seo" }) {
  const isRefresh = mode === "refresh";
  const scope = isRefresh ? REFRESH_ACTIONS : GEO_SEO_ACTIONS;
  const rows = useMemo(() => REFRESH_DATA.filter((r) => scope.includes(r.action)), [scope]);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(isRefresh ? "sessions" : "volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (channelFilter && r.channel !== channelFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (q && !`${r.url} ${r.keyword || ""} ${r.cluster || ""} ${r.notes || ""}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      switch (sortKey) {
        case "url": av = a.url; bv = b.url; break;
        case "action": av = a.action; bv = b.action; break;
        case "status": av = a.status; bv = b.status; break;
        case "priority": av = PRIORITY_RANK[a.priority] || 0; bv = PRIORITY_RANK[b.priority] || 0; break;
        case "sessions": av = a.sessions || 0; bv = b.sessions || 0; break;
        case "conv": av = a.conv || 0; bv = b.conv || 0; break;
        case "peec": av = a.peec || 0; bv = b.peec || 0; break;
        case "genai": av = a.genai || 0; bv = b.genai || 0; break;
        case "volume": av = a.volume || 0; bv = b.volume || 0; break;
        case "kd": av = a.kd || 0; bv = b.kd || 0; break;
      }
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, search, priorityFilter, channelFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const stats = useMemo(() => {
    if (isRefresh) {
      return [
        { value: rows.length.toLocaleString(), label: "Total assets" },
        { value: rows.filter((r) => r.priority === "High").length.toLocaleString(), label: "High priority" },
        { value: rows.reduce((s, r) => s + (r.sessions || 0), 0).toLocaleString(), label: "Sessions 12mo" },
        { value: rows.reduce((s, r) => s + (r.genai || 0), 0).toLocaleString(), label: "GenAI impr." },
      ];
    }
    const seo = rows.filter((r) => r.action === "Net New — SEO").length;
    const geo = rows.filter((r) => r.action === "Net New — GEO").length;
    return [
      { value: rows.length.toLocaleString(), label: "Net-new topics" },
      { value: rows.filter((r) => r.priority === "High").length.toLocaleString(), label: "High priority" },
      { value: rows.reduce((s, r) => s + (r.volume || 0), 0).toLocaleString(), label: "Total keyword volume" },
      { value: `${seo} / ${geo}`, label: "SEO / GEO split" },
    ];
  }, [rows, isRefresh]);

  const channels = useMemo(() => Array.from(new Set(rows.map((r) => r.channel))).sort(), [rows]);
  const hasFilters = !!(search || priorityFilter || channelFilter || statusFilter);

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      style={{ ...TYPE.label, color: T.grey6, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${T.grey3}`, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {label}
        {sortKey === k && (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </span>
    </th>
  );

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.plan }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.plan }} />
          {isRefresh ? "FY27 · Search & AI visibility" : "FY27 · Content"}
        </div>
        <h1 style={{ ...TYPE.hero, fontSize: "clamp(32px, 4.5vw, 48px)", margin: `${SP.sm}px 0 ${SP.md}px` }}>
          {isRefresh ? "Content Refresh" : "Content GEO/SEO"}
        </h1>
        <p style={{ ...TYPE.lede, color: T.grey7, margin: 0, maxWidth: 640, fontSize: 15 }}>
          {isRefresh
            ? "Every existing URL losing search or AI visibility, with the traffic, conversion and retrieval signals behind each refresh call."
            : "Net-new SEO and GEO topics from the keyword pipeline, mapped to use cases with verified search volume."}
        </p>

        <div style={{ display: "flex", gap: SP.lg, flexWrap: "wrap", marginTop: SP.xl }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.lg, padding: `${SP.md}px ${SP.lg}px`, minWidth: 140 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{s.value}</div>
              <div style={{ ...TYPE.label, color: T.grey6, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <details style={{ marginTop: SP.lg }}>
          <summary style={{ ...TYPE.small, fontWeight: 700, color: T.grey7, cursor: "pointer" }}>What each content action means</summary>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: SP.md, marginTop: SP.md }}>
            {REFRESH_KEY.filter((k) => scope.includes(k[0])).map(([action, meaning]) => (
              <div key={action} style={{ display: "flex", gap: SP.sm, alignItems: "flex-start" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: ACTION_COLOR[action] || T.grey5, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ ...TYPE.small, fontWeight: 700, color: T.ink }}>{action}</div>
                  <div style={{ ...TYPE.small, color: T.grey6 }}>{meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: "flex", gap: SP.sm, marginTop: SP.xl, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={isRefresh ? "Search URL, keyword or notes…" : "Search topic, keyword or notes…"}
            style={{ fontFamily: T.font, fontSize: 13, padding: "9px 14px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, minWidth: 240 }}
          />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
            <option value="">All priorities</option>
            {["High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} style={selectStyle}>
            <option value="">All channels</option>
            {channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            {Array.from(new Set(rows.map((r) => r.status))).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ ...TYPE.small, color: T.grey6 }}>{filtered.length} of {rows.length} rows</span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPriorityFilter(""); setChannelFilter(""); setStatusFilter(""); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", color: T.grey6, cursor: "pointer", fontFamily: T.font, fontSize: 13 }}
            >
              Reset <RotateCcw size={13} />
            </button>
          )}
        </div>

        <div style={{ marginTop: SP.lg, overflowX: "auto", border: `1px solid ${T.grey3}`, borderRadius: R.lg, background: T.white }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font, minWidth: isRefresh ? 1200 : 1100 }}>
            <thead>
              <tr>
                <Th label={isRefresh ? "URL / TOPIC" : "TOPIC"} k="url" />
                <Th label="ACTION" k="action" />
                <th style={thStyle}>TYPE</th>
                <Th label="STATUS" k="status" />
                <Th label="PRIORITY" k="priority" />
                <th style={thStyle}>CHANNEL</th>
                {isRefresh ? (
                  <>
                    <Th label="SESSIONS 12MO" k="sessions" />
                    <Th label="CONV 12MO" k="conv" />
                    <th style={thStyle}>DECLINE</th>
                    <Th label="PEEC" k="peec" />
                    <Th label="GENAI IMPR 3MO" k="genai" />
                  </>
                ) : (
                  <>
                    <th style={thStyle}>USE CASE / CLUSTER</th>
                    <th style={thStyle}>TARGET KEYWORD</th>
                    <Th label="VOLUME" k="volume" />
                    <Th label="KD" k="kd" />
                  </>
                )}
                <th style={thStyle}>NOTES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.grey3}` }}>
                  <td style={{ ...tdStyle, minWidth: 220 }}>
                    {isRefresh && /^https?:\/\//.test(r.url) ? (
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ color: T.ink, fontWeight: 700, textDecoration: "none" }}>
                        {stripDomain(r.url)}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 700 }}>{r.url}</span>
                    )}
                  </td>
                  <td style={tdStyle}>{badge(r.action, ACTION_COLOR[r.action] || T.grey6)}</td>
                  <td style={tdStyle}>{r.type}</td>
                  <td style={tdStyle}>{r.status}</td>
                  <td style={tdStyle}>{badge(r.priority, PRIORITY_COLOR[r.priority] || T.grey6)}</td>
                  <td style={tdStyle}>{r.channel}</td>
                  {isRefresh ? (
                    <>
                      <td style={tdStyle}>{fmtNum(r.sessions)}</td>
                      <td style={tdStyle}>{fmtNum(r.conv)}</td>
                      <td style={tdStyle}>{r.decline ? badge(r.decline, DECLINE_COLOR[r.decline] || T.grey6) : "—"}</td>
                      <td style={tdStyle}>{fmtNum(r.peec)}</td>
                      <td style={tdStyle}>{fmtNum(r.genai)}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...tdStyle, minWidth: 180 }}>{r.cluster || "—"}</td>
                      <td style={tdStyle}>{r.keyword || "—"}</td>
                      <td style={tdStyle}>{fmtNum(r.volume)}</td>
                      <td style={tdStyle}>{r.kd ?? "—"}</td>
                    </>
                  )}
                  <td style={{ ...tdStyle, minWidth: 240, color: T.grey6 }}>{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { ...TYPE.label, color: T.grey6, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${T.grey3}`, whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", fontSize: 13, color: T.ink, verticalAlign: "top" };
const selectStyle: React.CSSProperties = { fontFamily: T.font, fontSize: 13, padding: "9px 10px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink };
