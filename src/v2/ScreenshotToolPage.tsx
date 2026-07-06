import { useState } from "react";
import { Camera, Loader2, Download, Check, RefreshCw } from "lucide-react";
import { T, SP, R, TYPE, SHADOW, MAXW } from "./theme";

const HISTORY_KEY = "gwi-ux-audit-tool/screenshots/v1";
const WIDTH_OPTIONS = [
  { key: "desktop", label: "Desktop", width: 1440 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "mobile", label: "Mobile", width: 390 },
] as const;

type Item = { label: string; url: string };
type Group = { title: string; items: Item[] };

// gwi.com's actual main-nav structure, verified against the live site (2026-07-06).
// Kept as a fixed list rather than a live crawl — gwi.com's nav is client-rendered,
// so a plain HTTP fetch can't reliably discover it, and slug guesses 404 easily
// (e.g. teams/strategy, /agent-spark, /about all looked plausible but don't exist).
const NAV_GROUPS: Group[] = [
  { title: "Products", items: [
    { label: "Agent Spark", url: "https://www.gwi.com/platform/spark" },
    { label: "Platform", url: "https://www.gwi.com/platform" },
    { label: "Integrations", url: "https://www.gwi.com/integrations" },
    { label: "GWI data", url: "https://www.gwi.com/data" },
  ]},
  { title: "Services", items: [
    { label: "Services (main)", url: "https://www.gwi.com/services" },
    { label: "Brand tracking", url: "https://www.gwi.com/services/brand-tracking" },
    { label: "Segmentation", url: "https://www.gwi.com/services/market-segmentation" },
    { label: "Audience profiling", url: "https://www.gwi.com/services/audience-profiling" },
    { label: "Analyst hours", url: "https://www.gwi.com/services/analysis-and-reporting-services" },
    { label: "Ad effectiveness", url: "https://www.gwi.com/services/ad-effectivenes" },
    { label: "Concept testing", url: "https://www.gwi.com/services/concept-testing" },
  ]},
  { title: "Solutions — Teams", items: [
    { label: "Teams (main)", url: "https://www.gwi.com/teams" },
    { label: "Marketing", url: "https://www.gwi.com/teams/marketing" },
    { label: "Sales", url: "https://www.gwi.com/teams/sales" },
    { label: "Product", url: "https://www.gwi.com/teams/product-development" },
    { label: "Research", url: "https://www.gwi.com/teams/research" },
  ]},
  { title: "Solutions — Use cases", items: [
    { label: "Use cases (main)", url: "https://www.gwi.com/use-cases" },
    { label: "Pitching", url: "https://www.gwi.com/use-cases/agency-pitching" },
    { label: "Media planning", url: "https://www.gwi.com/use-cases/media-planning-data" },
    { label: "Content marketing", url: "https://www.gwi.com/use-cases/content-strategy" },
    { label: "Partnerships", url: "https://www.gwi.com/use-cases/sponsorship-partnership" },
    { label: "Retail media", url: "https://www.gwi.com/retail-media" },
    { label: "Synthetic audiences", url: "https://www.gwi.com/use-cases/synthetic-audiences" },
  ]},
  { title: "Solutions — Industries", items: [
    { label: "Industries (main)", url: "https://www.gwi.com/industries" },
    { label: "Agencies", url: "https://www.gwi.com/industries/agencies" },
    { label: "Media", url: "https://www.gwi.com/industries/media" },
    { label: "Sports", url: "https://www.gwi.com/industries/sports" },
    { label: "Gaming", url: "https://www.gwi.com/industries/gaming" },
    { label: "Finance", url: "https://www.gwi.com/industries/finance" },
  ]},
  { title: "Resources", items: [
    { label: "Blog", url: "https://www.gwi.com/blog" },
    { label: "Reports", url: "https://www.gwi.com/reports" },
    { label: "Case studies", url: "https://www.gwi.com/case-studies" },
    { label: "Newsletter: On the dot", url: "https://www.gwi.com/on-the-dot-subscribe" },
    { label: "Webinar & events", url: "https://www.gwi.com/webinars" },
  ]},
  { title: "CTAs", items: [
    { label: "Pricing", url: "https://www.gwi.com/pricing" },
    { label: "Sign in", url: "https://signin.globalwebindex.com/" },
    { label: "Book a demo", url: "https://www.gwi.com/book-demo" },
  ]},
];

// gwi.com's footer, verified against the live site (2026-07-06).
const FOOTER_GROUPS: Group[] = [
  { title: "Products", items: [
    { label: "Human insights platform", url: "https://www.gwi.com/platform" },
    { label: "Agent Spark: Human insights analyst", url: "https://www.gwi.com/platform/spark" },
    { label: "Learn about our data", url: "https://www.gwi.com/data" },
    { label: "Pricing", url: "https://www.gwi.com/pricing" },
  ]},
  { title: "Solutions & Integrations", items: [
    { label: "RLD", url: "https://www.gwi.com/respondent-level-data" },
    { label: "Audience activation", url: "https://www.gwi.com/audience-activation" },
    { label: "Data partnerships", url: "https://www.gwi.com/fusions" },
    { label: "Become a GWI partner", url: "https://www.gwi.com/partners" },
  ]},
  { title: "Resources", items: [
    { label: "Blog", url: "https://www.gwi.com/blog" },
    { label: "Reports", url: "https://www.gwi.com/reports" },
    { label: "Help center", url: "https://help.globalwebindex.com/" },
  ]},
  { title: "Company", items: [
    { label: "Our story", url: "https://www.gwi.com/about-us" },
    { label: "Careers", url: "https://www.gwi.com/careers" },
    { label: "Press", url: "https://www.gwi.com/press-center" },
    { label: "Contact", url: "https://www.gwi.com/contact" },
    { label: "Trust center", url: "https://trust.gwi.com/" },
  ]},
  { title: "Legal stuff", items: [
    { label: "Website terms and conditions", url: "https://www.gwi.com/terms" },
    { label: "Website privacy policy", url: "https://www.gwi.com/legal/privacy-policy" },
    { label: "Website cookie policy", url: "https://www.gwi.com/cookie-policy" },
    { label: "Modern slavery statement", url: "https://www.gwi.com/legal/modern-slavery-statement" },
  ]},
];

type ResultItem = {
  id: string;
  url: string;
  label: string;
  width: number;
  widthLabel: string;
  status: "queued" | "capturing" | "done" | "error";
  image?: string;
  height?: number;
  error?: string;
};

function allItems(): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const g of [...NAV_GROUPS, ...FOOTER_GROUPS]) {
    for (const it of g.items) {
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      out.push(it);
    }
  }
  return out;
}

function recordRun(count: number) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = (Array.isArray(arr) ? arr : []).concat([{ count, at: Date.now() }]).slice(-100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}

function filenameFor(url: string, widthLabel: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "").replace(/^\//, "") || "home";
    return `${u.hostname}-${path.replace(/\//g, "_")}-${widthLabel.toLowerCase()}.jpg`;
  } catch {
    return `screenshot-${widthLabel.toLowerCase()}.jpg`;
  }
}

export function ScreenshotToolPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const it of allItems()) init[it.url] = true;
    return init;
  });
  const [customItems, setCustomItems] = useState<Item[]>([]);
  const [manualText, setManualText] = useState("");
  const [selectedWidths, setSelectedWidths] = useState<Set<string>>(new Set(["desktop"]));
  const [capturing, setCapturing] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const toggle = (url: string) => setSelected((prev) => ({ ...prev, [url]: !prev[url] }));

  const addManualUrls = () => {
    const lines = manualText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (!lines.length) return;
    const added: Item[] = [];
    for (let raw of lines) {
      if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
      try {
        const u = new URL(raw);
        added.push({ url: u.href, label: u.pathname === "/" ? "Home" : u.pathname });
      } catch {}
    }
    if (added.length) {
      setCustomItems((prev) => [...prev, ...added]);
      setSelected((prev) => {
        const next = { ...prev };
        for (const it of added) next[it.url] = true;
        return next;
      });
    }
    setManualText("");
  };

  const removeCustom = (url: string) => {
    setCustomItems((prev) => prev.filter((it) => it.url !== url));
    setSelected((prev) => { const next = { ...prev }; delete next[url]; return next; });
  };

  const setAll = (value: boolean) => {
    setSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const url of Object.keys(prev)) next[url] = value;
      return next;
    });
  };

  const toggleWidth = (key: string) => {
    setSelectedWidths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const combinedGroups = [...NAV_GROUPS, ...FOOTER_GROUPS.map((g) => ({ title: `Footer — ${g.title}`, items: g.items }))];
  const selectedUrls = Object.keys(selected).filter((u) => selected[u]);
  const totalCount = Object.keys(selected).length;
  const activeWidths = WIDTH_OPTIONS.filter((w) => selectedWidths.has(w.key));
  const jobCount = selectedUrls.length * activeWidths.length;

  const labelFor = (url: string): string => {
    for (const it of allItems()) if (it.url === url) return it.label;
    for (const it of customItems) if (it.url === url) return it.label;
    return url;
  };

  const runCapture = async () => {
    if (!jobCount || capturing) return;
    const jobs: ResultItem[] = [];
    for (const url of selectedUrls) {
      for (const w of activeWidths) {
        jobs.push({ id: `${url}__${w.key}`, url, label: labelFor(url), width: w.width, widthLabel: w.label, status: "queued" });
      }
    }
    setResults(jobs);
    setCapturing(true);
    setProgress({ done: 0, total: jobs.length });

    let doneCount = 0;
    for (const job of jobs) {
      setResults((prev) => prev.map((r) => (r.id === job.id ? { ...r, status: "capturing" } : r)));
      try {
        const res = await fetch(`/api/screenshot?url=${encodeURIComponent(job.url)}&width=${job.width}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Capture failed");
        setResults((prev) => prev.map((r) => (r.id === job.id ? { ...r, status: "done", image: data.image, height: data.height } : r)));
      } catch (e: any) {
        setResults((prev) => prev.map((r) => (r.id === job.id ? { ...r, status: "error", error: e?.message || "Failed" } : r)));
      }
      doneCount++;
      setProgress({ done: doneCount, total: jobs.length });
    }
    setCapturing(false);
    recordRun(jobs.length);
  };

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: MAXW, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <header style={{ paddingBottom: SP.xxl, borderBottom: `1px solid ${T.grey3}` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.shots }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.shots }} />
            Website QA · gwi.com
          </div>
          <h1 style={{ ...TYPE.h1, margin: `${SP.md}px 0 ${SP.sm}px` }}>Page Screenshots</h1>
          <p style={{ ...TYPE.body, color: T.grey7, margin: 0, maxWidth: 640 }}>
            Every page in gwi.com's main navigation and footer, grouped the same way they appear on the live site. Pick your widths and capture full-length screenshots for QA and design review.
          </p>
        </header>

        {/* ── Controls ─────────────────────────────────── */}
        <div style={{ marginTop: SP.xxl, background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.xl, padding: SP.xl, display: "flex", flexDirection: "column", gap: SP.xl }}>
          <div>
            <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.sm }}>Add a specific URL (not in the nav or footer)</div>
            <div style={{ display: "flex", gap: SP.sm, alignItems: "flex-start" }}>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={"One URL per line, e.g.\nhttps://www.gwi.com/reports/some-report"}
                rows={2}
                style={{ flex: 1, boxSizing: "border-box", padding: "10px 12px", borderRadius: R.md, border: `1px solid ${T.grey4}`, fontSize: 13, fontFamily: T.font, color: T.ink, resize: "vertical" }}
              />
              <button
                onClick={addManualUrls}
                disabled={!manualText.trim()}
                style={{ padding: "10px 16px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: manualText.trim() ? 1 : 0.5, flexShrink: 0 }}
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SP.md }}>
              <div style={{ ...TYPE.label, color: T.grey6 }}>Pages ({selectedUrls.length} of {totalCount} selected)</div>
              <div style={{ display: "flex", gap: SP.md }}>
                <button onClick={() => setAll(true)} style={{ background: "none", border: "none", color: T.shots, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>Select all</button>
                <button onClick={() => setAll(false)} style={{ background: "none", border: "none", color: T.grey6, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>Clear</button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: SP.lg, maxHeight: 420, overflow: "auto", padding: SP.md, background: T.grey1, borderRadius: R.md }}>
              {combinedGroups.map((g) => (
                <div key={g.title}>
                  <div style={{ ...TYPE.small, fontWeight: 700, color: T.grey7, marginBottom: SP.xs }}>{g.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: SP.sm }}>
                    {g.items.map((it) => {
                      const on = !!selected[it.url];
                      return (
                        <label key={it.url} title={it.url} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: R.pill, background: on ? T.shotsBg : T.white, border: `1px solid ${on ? T.shots : T.grey4}`, fontSize: 12.5, cursor: "pointer" }}>
                          <input type="checkbox" checked={on} onChange={() => toggle(it.url)} style={{ margin: 0 }} />
                          <span style={{ color: on ? T.shots : T.grey7, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {customItems.length > 0 && (
                <div>
                  <div style={{ ...TYPE.small, fontWeight: 700, color: T.grey7, marginBottom: SP.xs }}>Custom URLs</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: SP.sm }}>
                    {customItems.map((it) => {
                      const on = !!selected[it.url];
                      return (
                        <div key={it.url} title={it.url} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 6px 6px 10px", borderRadius: R.pill, background: on ? T.shotsBg : T.white, border: `1px solid ${on ? T.shots : T.grey4}`, fontSize: 12.5 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input type="checkbox" checked={on} onChange={() => toggle(it.url)} style={{ margin: 0 }} />
                            <span style={{ color: on ? T.shots : T.grey7, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                          </label>
                          <button onClick={() => removeCustom(it.url)} title="Remove" style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: T.grey5, padding: 2, fontSize: 13 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.sm }}>Widths</div>
            <div style={{ display: "flex", gap: SP.sm }}>
              {WIDTH_OPTIONS.map((w) => {
                const on = selectedWidths.has(w.key);
                return (
                  <button
                    key={w.key}
                    onClick={() => toggleWidth(w.key)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.pill, border: `1.5px solid ${on ? T.shots : T.grey4}`, background: on ? T.shotsBg : T.white, color: on ? T.shots : T.grey7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    {on && <Check size={13} />}
                    {w.label} <span style={{ color: T.grey5, fontWeight: 500 }}>{w.width}px</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: SP.lg, paddingTop: SP.sm, borderTop: `1px solid ${T.grey3}` }}>
            <button
              onClick={runCapture}
              disabled={!jobCount || capturing}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: R.md, border: "none", fontWeight: 700, fontSize: 14, cursor: !jobCount || capturing ? "not-allowed" : "pointer", background: T.shots, color: T.white, opacity: !jobCount || capturing ? 0.5 : 1 }}
            >
              {capturing ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Camera size={15} />}
              {capturing ? `Capturing ${progress.done}/${progress.total}…` : `Capture ${jobCount || ""} screenshot${jobCount === 1 ? "" : "s"}`}
            </button>
            {capturing && <span style={{ ...TYPE.small, color: T.grey6 }}>This can take a while for full-length pages — please keep this tab open.</span>}
          </div>
        </div>

        {/* ── Results ──────────────────────────────────── */}
        {results.length > 0 && (
          <div style={{ marginTop: SP.xxl }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SP.lg }}>
              <div style={{ ...TYPE.h3 }}>Results</div>
              {!capturing && <button onClick={runCapture} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.shots, fontWeight: 700, fontSize: 13, cursor: "pointer" }}><RefreshCw size={13} /> Re-run</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: SP.lg }}>
              {results.map((r) => (
                <div key={r.id} style={{ background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.lg, overflow: "hidden", boxShadow: SHADOW.none }}>
                  <div style={{ height: 160, background: T.grey2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {r.status === "done" && r.image && (
                      <img src={r.image} alt={r.label} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    )}
                    {r.status === "capturing" && <Loader2 size={22} color={T.grey5} style={{ animation: "spin 0.8s linear infinite" }} />}
                    {r.status === "queued" && <span style={{ ...TYPE.small, color: T.grey5 }}>Queued…</span>}
                    {r.status === "error" && <span style={{ ...TYPE.small, color: T.flag, padding: SP.md, textAlign: "center" }}>{r.error}</span>}
                  </div>
                  <div style={{ padding: SP.md }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.url}>{r.label}</div>
                    <div style={{ ...TYPE.small, color: T.grey6, marginTop: 2 }}>{r.widthLabel} · {r.width}px{r.height ? ` × ${r.height}px` : ""}</div>
                    {r.status === "done" && r.image && (
                      <a
                        href={r.image}
                        download={filenameFor(r.url, r.widthLabel)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: SP.sm, fontSize: 12.5, fontWeight: 700, color: T.shots, textDecoration: "none" }}
                      >
                        <Download size={13} /> Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
