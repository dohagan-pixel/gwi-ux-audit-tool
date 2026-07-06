import { useState } from "react";
import { Camera, Search, Loader2, Download, X, Check, RefreshCw, Globe } from "lucide-react";
import { T, SP, R, TYPE, SHADOW, MAXW } from "./theme";

const HISTORY_KEY = "gwi-ux-audit-tool/screenshots/v1";
const WIDTH_OPTIONS = [
  { key: "desktop", label: "Desktop", width: 1440 },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "mobile", label: "Mobile", width: 390 },
] as const;

type PageEntry = { url: string; label: string; checked: boolean };
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
  const [baseUrl, setBaseUrl] = useState("https://www.gwi.com");
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [manualText, setManualText] = useState("");
  const [selectedWidths, setSelectedWidths] = useState<Set<string>>(new Set(["desktop"]));
  const [capturing, setCapturing] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const discoverPages = async () => {
    setDiscovering(true);
    setDiscoverError(null);
    try {
      const res = await fetch(`/api/discover-pages?url=${encodeURIComponent(baseUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Discovery failed");
      const found: PageEntry[] = (data.pages || []).map((p: any) => ({ url: p.url, label: p.label, checked: true }));
      setPages((prev) => {
        const seen = new Set(prev.map((p) => p.url.replace(/\/$/, "")));
        const merged = prev.slice();
        for (const p of found) if (!seen.has(p.url.replace(/\/$/, ""))) { merged.push(p); seen.add(p.url.replace(/\/$/, "")); }
        return merged;
      });
      if (data.truncated) setDiscoverError(`Showing the first ${data.pages.length} of ${data.totalFound} pages found.`);
    } catch (e: any) {
      setDiscoverError(e?.message || "Couldn't discover pages for this site");
    } finally {
      setDiscovering(false);
    }
  };

  const addManualUrls = () => {
    const lines = manualText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (!lines.length) return;
    setPages((prev) => {
      const seen = new Set(prev.map((p) => p.url.replace(/\/$/, "")));
      const merged = prev.slice();
      for (let raw of lines) {
        if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
        try {
          const u = new URL(raw);
          const key = u.href.replace(/\/$/, "");
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push({ url: u.href, label: u.pathname === "/" ? "Home" : u.pathname, checked: true });
        } catch {}
      }
      return merged;
    });
    setManualText("");
  };

  const togglePage = (url: string) => {
    setPages((prev) => prev.map((p) => (p.url === url ? { ...p, checked: !p.checked } : p)));
  };

  const removePage = (url: string) => {
    setPages((prev) => prev.filter((p) => p.url !== url));
  };

  const toggleWidth = (key: string) => {
    setSelectedWidths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const selectedPages = pages.filter((p) => p.checked);
  const activeWidths = WIDTH_OPTIONS.filter((w) => selectedWidths.has(w.key));
  const jobCount = selectedPages.length * activeWidths.length;

  const runCapture = async () => {
    if (!jobCount || capturing) return;
    const jobs: ResultItem[] = [];
    for (const p of selectedPages) {
      for (const w of activeWidths) {
        jobs.push({ id: `${p.url}__${w.key}`, url: p.url, label: p.label, width: w.width, widthLabel: w.label, status: "queued" });
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
    recordRun(jobs.filter((j) => true).length);
  };

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: MAXW, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <header style={{ paddingBottom: SP.xxl, borderBottom: `1px solid ${T.grey3}` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.shots }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.shots }} />
            Website QA
          </div>
          <h1 style={{ ...TYPE.h1, margin: `${SP.md}px 0 ${SP.sm}px` }}>Page Screenshots</h1>
          <p style={{ ...TYPE.body, color: T.grey7, margin: 0, maxWidth: 640 }}>
            Discover a site's main pages (or paste your own URLs), pick your widths, and capture full-length screenshots for QA and design review.
          </p>
        </header>

        {/* ── Controls ─────────────────────────────────── */}
        <div style={{ marginTop: SP.xxl, background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.xl, padding: SP.xl, display: "flex", flexDirection: "column", gap: SP.xl }}>
          <div>
            <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.sm }}>Site to scan</div>
            <div style={{ display: "flex", gap: SP.sm, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 320px" }}>
                <Globe size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.grey5 }} />
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://www.gwi.com"
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 34px", borderRadius: R.md, border: `1px solid ${T.grey4}`, fontSize: 14, fontFamily: T.font, color: T.ink }}
                />
              </div>
              <button
                onClick={discoverPages}
                disabled={discovering || !baseUrl.trim()}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: R.md, border: "none", fontWeight: 700, fontSize: 13, cursor: discovering ? "wait" : "pointer", background: T.shots, color: T.white, opacity: discovering || !baseUrl.trim() ? 0.6 : 1 }}
              >
                {discovering ? <Loader2 size={14} className="spin" style={{ animation: "spin 0.8s linear infinite" }} /> : <Search size={14} />}
                {discovering ? "Discovering…" : "Discover pages"}
              </button>
            </div>
            {discoverError && <div style={{ ...TYPE.small, color: T.warn, marginTop: SP.sm }}>{discoverError}</div>}
          </div>

          <div>
            <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.sm }}>Or add specific URLs</div>
            <div style={{ display: "flex", gap: SP.sm, alignItems: "flex-start" }}>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={"One URL per line, e.g.\nhttps://www.gwi.com/pricing\nhttps://www.gwi.com/about"}
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

          {pages.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SP.sm }}>
                <div style={{ ...TYPE.label, color: T.grey6 }}>Pages ({selectedPages.length} of {pages.length} selected)</div>
                <div style={{ display: "flex", gap: SP.md }}>
                  <button onClick={() => setPages((prev) => prev.map((p) => ({ ...p, checked: true })))} style={{ background: "none", border: "none", color: T.shots, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>Select all</button>
                  <button onClick={() => setPages((prev) => prev.map((p) => ({ ...p, checked: false })))} style={{ background: "none", border: "none", color: T.grey6, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>Clear</button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: SP.sm, maxHeight: 220, overflow: "auto", padding: SP.sm, background: T.grey1, borderRadius: R.md }}>
                {pages.map((p) => (
                  <div key={p.url} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 6px 6px 10px", borderRadius: R.pill, background: p.checked ? T.shotsBg : T.white, border: `1px solid ${p.checked ? T.shots : T.grey4}`, fontSize: 12.5 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={p.checked} onChange={() => togglePage(p.url)} style={{ margin: 0 }} />
                      <span style={{ color: p.checked ? T.shots : T.grey7, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.url}>{p.label}</span>
                    </label>
                    <button onClick={() => removePage(p.url)} title="Remove" style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: T.grey5, padding: 2 }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
