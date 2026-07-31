import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  Plus, Cog, Trash2, X, Upload, Download, ChevronDown, ChevronRight, Undo2, Copy, Link2,
  Megaphone, FileText, Calendar, Video, Mic, Layers, Code2, Scale, Radio, EyeOff, CheckCircle2,
  Star, List, Bot, Users,
} from "lucide-react";
import { T, SP, R, TYPE, SHADOW, MAXW } from "./theme";
import { CONTENT_PLAN_SEED } from "./contentPlanSeed";

// Fiscal year runs May → Apr — sort chronologically on that axis rather than calendar order.
const MONTH_ORDER = [
  "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026",
  "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027", "Apr 2027",
];
const LANES = [
  "Campaigns", "Series", "Events", "Content", "Video / TDM", "Podcast",
  "Developer & technician", "Comparisons & proof", "Live demos & earned PR",
];
const STATUSES = ["Planned", "Live"];

const LANE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  "Campaigns": Megaphone,
  "Content": FileText,
  "Events": Calendar,
  "Video / TDM": Video,
  "Podcast": Mic,
  "Series": Layers,
  "Developer & technician": Code2,
  "Comparisons & proof": Scale,
  "Live demos & earned PR": Radio,
};

const LANE_COLOR: Record<string, { fg: string; bg: string; bar: string }> = {
  "Campaigns": { fg: "#C20063", bg: "#FFE3EF", bar: T.pink },
  "Content": { fg: T.shots, bg: T.shotsBg, bar: T.shots },
  "Events": { fg: "#8A5A00", bg: "#FBEED2", bar: "#C98A12" },
  "Video / TDM": { fg: T.hub, bg: T.hubBg, bar: T.hub },
  "Podcast": { fg: T.plan, bg: T.planBg, bar: T.plan },
  "Series": { fg: "#8A1230", bg: "#F7DCE3", bar: "#8A1230" },
  "Developer & technician": { fg: T.audit, bg: T.auditBg, bar: T.audit },
  "Comparisons & proof": { fg: T.inkSoft, bg: T.grey2, bar: T.grey6 },
  "Live demos & earned PR": { fg: "#6B4E00", bg: "#F5EFD6", bar: "#8A6D1D" },
};

// FY27 messaging pillars — the meaning behind the C1/C2/C3 tag codes used on items.
const PILLARS: Record<string, string> = {
  C1: "What the data says",
  C2: "Less artificial. More intelligence.",
  C3: "Build on something real",
};

// Exact per-variant palette from the source Design canvas — cards keep their own
// variant colour even where several variants share a lane (e.g. hero-full vs campaign).
const VARIANT_COLOR: Record<string, { fg: string; bg: string; bar: string }> = {
  "hero-full": { fg: "#fff", bg: "#ff0077", bar: "#ff0077" },
  "campaign": { fg: "#b84800", bg: "#ffe0cc", bar: "#b84800" },
  "event": { fg: "#8a6400", bg: "#fff4c2", bar: "#8a6400" },
  "customer-event": { fg: "#2b3aa0", bg: "#dfe4ff", bar: "#2b3aa0" },
  "series": { fg: "#b80010", bg: "#ffe0e0", bar: "#b80010" },
  "blog": { fg: "#004499", bg: "#ddeeff", bar: "#004499" },
  "listicle": { fg: "#00693e", bg: "#d9f5e8", bar: "#00693e" },
  "llm": { fg: "#5000cc", bg: "#e8e0ff", bar: "#5000cc" },
  "video": { fg: "#006474", bg: "#d9f5f5", bar: "#006474" },
  "podcast": { fg: "#8800b8", bg: "#f5d9ff", bar: "#8800b8" },
};

// Container variants — the only kind of card a content item (blog/listicle/llm/video/podcast) may link up to.
const CONTAINER_VARIANTS = new Set(["hero-full", "campaign", "series", "event", "customer-event"]);
const CONTENT_VARIANTS = ["blog", "listicle", "llm", "video", "podcast"];
const SERIES_EVENT_VARIANTS = ["series", "event"];
const HERO_CAMPAIGN_VARIANTS = ["hero-full", "campaign"];

const HIDDEN_LANES_KEY = "gwi-content-plan/hidden-lanes/v1";

// ── Ported from CardComposer/AssetTypeDropdown in ContentPlan.tsx ──
const VARIANT_OPTIONS: { value: string; label: string; defaultType: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "hero-full", label: "Hero", defaultType: "HERO", icon: Star },
  { value: "campaign", label: "Campaign", defaultType: "CAMPAIGN", icon: Megaphone },
  { value: "event", label: "Event", defaultType: "EVENT", icon: Calendar },
  { value: "customer-event", label: "Customer event", defaultType: "CUSTOMER EVENT", icon: Users },
  { value: "series", label: "Series", defaultType: "SERIES", icon: Layers },
  { value: "blog", label: "Blog", defaultType: "BLOG", icon: FileText },
  { value: "listicle", label: "Listicle", defaultType: "LISTICLE", icon: List },
  { value: "llm", label: "LLM", defaultType: "LLM", icon: Bot },
  { value: "video", label: "Video", defaultType: "VIDEO", icon: Video },
  { value: "podcast", label: "Podcast", defaultType: "PODCAST", icon: Mic },
];
const ASSET_TYPE_GROUPS = [
  { label: "Containers", items: ["hero-full", "campaign", "series", "event", "customer-event"] },
  { label: "Content", items: ["blog", "listicle", "llm", "video", "podcast"] },
];
// The variant a given asset type usually lands in — used only to suggest a lane when it's unambiguous.
const VARIANT_DEFAULT_LANE: Record<string, string> = {
  "hero-full": "Campaigns", "campaign": "Campaigns", "series": "Series",
  "event": "Events", "customer-event": "Events", "video": "Video / TDM", "podcast": "Podcast",
};
const ESSENCE = [
  { id: "C1", label: "What the data actually says" },
  { id: "C2", label: "Less artificial. More intelligence." },
  { id: "C3", label: "Build on something real" },
];
const TAG_CFG: Record<string, { bg: string; color: string }> = {
  C1: { bg: "#eeedfe", color: "#333688" },
  C2: { bg: "#ffe8ee", color: "#dc1f69" },
  C3: { bg: "#e1f5ee", color: "#008291" },
};
const CATEGORY_GROUPS: { group: string; description: string; color: string; items: string[] }[] = [
  { group: "Brand", description: "", color: "#004499", items: ["Reports", "Always On"] },
  { group: "Products", description: "Is this specific to a product?", color: "#00693e", items: ["Simulated Data", "Agentic AI", "Custom", "AI-enabled use cases"] },
  { group: "Enterprise", description: "Does this enable any of the below?", color: "#8800b8", items: ["Comparison & proof", "Developer & technical", "Community & Peer validation", "Dev experience"] },
];
// Parent-picker groups for "Made for" / "Part of" — keyed by the container variant(s) each holds.
const PARENT_GROUP_DEFS = [
  { key: "hero", label: "Hero campaigns", variants: ["hero-full"] },
  { key: "campaign", label: "Campaigns", variants: ["campaign"] },
  { key: "series", label: "Series", variants: ["series"] },
  { key: "event", label: "Events", variants: ["event", "customer-event"] },
];

// The "gather" flourish — hovering a container's Explore spine flies every linked
// descendant (not just direct children) into a floating, columns-by-type panel.
const GATHER_ORDER = ["hero-full", "campaign", "event", "customer-event", "series", "blog", "listicle", "llm", "video", "podcast"];

type GatherItem = { item: ContentPlanItem; dx: number; dy: number };
type Gathered = { x: number; y: number; items: GatherItem[] };

function computeGather(anchor: HTMLElement | null, item: ContentPlanItem, allItems: ContentPlanItem[]): Gathered | null {
  if (!anchor) return null;
  // Everything under this parent, not just direct children — a campaign owns series
  // and events, and those own assets of their own; exploring a parent shows it all.
  const byParent = new Map<string, ContentPlanItem[]>();
  for (const c of allItems) if (c.parentId) {
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  const kids: ContentPlanItem[] = [];
  const seen = new Set([item.id]);
  const walk = (id: string) => {
    for (const c of byParent.get(id) ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      kids.push(c);
      walk(c.id);
    }
  };
  walk(item.id);
  if (kids.length === 0) return null;
  const r = anchor.getBoundingClientRect();
  const cols = Math.min(kids.length, 3);
  const w = cols * 148 + (cols - 1) * 8;
  const x = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
  const y = Math.min(r.bottom + 8, Math.max(72, window.innerHeight - 220));
  const items = kids.map((c) => {
    const el = document.querySelector(`[data-card-id="${c.id}"]`) as HTMLElement | null;
    const cr = el ? el.getBoundingClientRect() : null;
    return { item: c, dx: cr ? Math.round(cr.left - x) : 0, dy: cr ? Math.round(cr.top - y) : -60 };
  });
  return { x, y, items };
}

function useGather(item: ContentPlanItem, allItems: ContentPlanItem[], anchorRef: React.RefObject<HTMLElement>) {
  const [gathered, setGathered] = useState<Gathered | null>(null);
  const [settled, setSettled] = useState(false);
  const dwellRef = useRef<number | undefined>(undefined);
  const revealRef = useRef<number | undefined>(undefined);
  const unmountRef = useRef<number | undefined>(undefined);
  const clearTimers = () => {
    if (revealRef.current) window.clearTimeout(revealRef.current);
    if (unmountRef.current) window.clearTimeout(unmountRef.current);
    revealRef.current = undefined; unmountRef.current = undefined;
  };
  const clearDwell = () => { if (dwellRef.current) window.clearTimeout(dwellRef.current); dwellRef.current = undefined; };

  const gather = () => {
    const g = computeGather(anchorRef.current, item, allItems);
    if (!g) return;
    clearTimers();
    setSettled(false);
    setGathered(g);
    revealRef.current = window.setTimeout(() => setSettled(true), 40);
  };
  const scatter = () => {
    clearTimers();
    setSettled(false);
    unmountRef.current = window.setTimeout(() => setGathered(null), 820);
  };

  const graceRef = useRef<number | undefined>(undefined);
  const cancelAutoClose = () => { if (graceRef.current) window.clearTimeout(graceRef.current); graceRef.current = undefined; };
  const armAutoClose = (ms = 260) => { cancelAutoClose(); graceRef.current = window.setTimeout(scatter, ms); };

  useEffect(() => {
    if (!gathered) return;
    const bail = () => { clearTimers(); setSettled(false); setGathered(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") bail(); };
    window.addEventListener("scroll", bail, true);
    window.addEventListener("resize", bail);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", bail, true);
      window.removeEventListener("resize", bail);
      window.removeEventListener("keydown", onKey);
    };
  }, [gathered]);

  const dwellProps = {
    onMouseEnter: () => { clearDwell(); dwellRef.current = window.setTimeout(gather, 500); },
    onMouseLeave: clearDwell,
  };
  useEffect(() => () => { clearDwell(); cancelAutoClose(); clearTimers(); }, []);
  const panelHoverProps = { onMouseEnter: cancelAutoClose, onMouseLeave: () => armAutoClose(160) };

  return { gathered, settled, gather, scatter, dwellProps, panelHoverProps };
}

function GatherPanel({ item, accent, gathered, settled, onClose, panelHoverProps }: {
  item: ContentPlanItem; accent: string; gathered: Gathered; settled: boolean; onClose: () => void;
  panelHoverProps: { onMouseEnter: () => void; onMouseLeave: () => void };
}) {
  const [lifted, setLifted] = useState<string | null>(null);
  const TILE_W = 152, GAP = 12, CARD_H = 74, REVEAL = 52, HEADER_H = 35;

  const columns = GATHER_ORDER
    .map((v) => ({ variant: v, items: gathered.items.filter((it) => it.item.variant === v) }))
    .filter((c) => c.items.length > 0);
  const rawWidth = columns.length * TILE_W + (columns.length - 1) * GAP + 24;
  const width = Math.min(rawWidth, window.innerWidth - 24);
  const left = Math.max(12, Math.min(gathered.x - 12, window.innerWidth - width - 12));
  const top = Math.max(12, Math.min(gathered.y, window.innerHeight - 160));
  const bodyMaxH = Math.max(120, window.innerHeight - top - 24 - HEADER_H - 2);
  let seq = 0;

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 205, cursor: "zoom-out",
        backgroundColor: settled ? "rgba(16,23,32,0.12)" : "rgba(16,23,32,0)",
        transition: "background-color 420ms ease",
        pointerEvents: settled ? "auto" : "none",
      }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={panelHoverProps.onMouseEnter}
        onMouseLeave={() => { setLifted(null); panelHoverProps.onMouseLeave(); }}
        style={{
          position: "absolute", left, top, width, maxHeight: bodyMaxH + HEADER_H + 2,
          background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.lg,
          display: "flex", flexDirection: "column", textAlign: "left",
          opacity: settled ? 1 : 0, transition: "opacity 260ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "8px 12px", borderBottom: `1px solid ${T.grey3}`, height: HEADER_H, boxSizing: "border-box", flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          <span style={{ ...TYPE.small, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
          <span style={{ ...TYPE.label, color: T.grey5, marginLeft: "auto", flexShrink: 0 }}>{gathered.items.length} linked</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: GAP, padding: "8px 12px 12px", overflow: "auto", maxHeight: bodyMaxH }}>
          {columns.map((col) => (
            <div key={col.variant} style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, width: TILE_W }}>
              <span style={{ ...TYPE.label, fontSize: 8, color: T.grey5, padding: "0 2px" }}>
                {VARIANT_OPTIONS.find((v) => v.value === col.variant)?.label ?? col.variant}
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {col.items.map((it, j) => {
                  const cfg = VARIANT_COLOR[it.item.variant] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };
                  const i = seq++;
                  const isLifted = lifted === it.item.id;
                  const isLast = j === col.items.length - 1;
                  return (
                    <div
                      key={it.item.id}
                      onMouseEnter={() => setLifted(it.item.id)}
                      style={{
                        background: cfg.bg, color: cfg.fg, height: CARD_H,
                        marginTop: j === 0 ? 0 : -(CARD_H - REVEAL),
                        zIndex: isLifted ? 50 : j + 1, position: "relative",
                        borderRadius: R.sm, padding: "8px 10px", overflow: "hidden",
                        willChange: "transform, opacity",
                        transform: settled
                          ? `translate3d(0,${isLifted && !isLast ? -6 : 0}px,0) scale(${isLifted ? 1.02 : 1})`
                          : `translate3d(${it.dx}px,${it.dy}px,0) scale(0.42)`,
                        opacity: settled ? 1 : 0,
                        transition: `transform 720ms cubic-bezier(.16,.86,.36,1) ${i * 40}ms, opacity 300ms cubic-bezier(.4,0,.2,1) ${i * 40}ms`,
                        boxShadow: it.item.proposed
                          ? `inset 0 0 0 1.5px ${T.pink}, 0 -1px 0 rgba(255,255,255,0.9), 0 6px 16px -8px rgba(16,23,32,0.4)`
                          : "0 -1px 0 rgba(255,255,255,0.9), 0 6px 16px -8px rgba(16,23,32,0.4)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {it.item.proposed && <span style={{ background: T.pink, color: T.white, padding: "0 3px", borderRadius: 2, fontSize: 7, fontWeight: 800 }}>NEW</span>}
                        <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", opacity: 0.75, overflow: "hidden", whiteSpace: "nowrap" }}>{it.item.contentType}</span>
                        <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", opacity: 0.5, marginLeft: "auto", flexShrink: 0 }}>{it.item.month.slice(0, 3)}</span>
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.3, margin: "3px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{it.item.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Ported verbatim from ContentPlan.tsx's AUTO_PARENTS — regex-matched against a card's
// title+subtitle+category+tags to guess which container it belongs to.
const AUTO_PARENTS: { key: string; match: RegExp; title: string; variant: string; category?: string }[] = [
  { key: "agentic", match: /agentic/i, title: "Agentic AI", variant: "campaign", category: "Agentic AI" },
  { key: "simulated", match: /synthetic|simulat/i, title: "Simulated Data", variant: "campaign", category: "Simulated Data" },
  { key: "brand", match: /brand track/i, title: "Brand Tracking", variant: "campaign", category: "Custom" },
  { key: "genz", match: /gen z|gen-z|generation z|gen alpha|millennial|boomer|gen x|generational/i, title: "Does Gen Z Really Exist?", variant: "hero-full" },
  { key: "lami", match: /less artificial/i, title: "Less Artificial. More Intelligence.", variant: "hero-full" },
];
// Everything else in a 2027 month hangs off this hero, same as the source.
const AUTO_LINK_FALLBACK = { title: "Connecting the Dots", variant: "hero-full" };

const AUTO_CATEGORIES: { match: RegExp; category: string }[] = [
  { match: /dotcast|dotcom/i, category: "Always On" },
  { match: /gemini|\bmcp\b|ad-sell|ad sell|connector|workflow/i, category: "AI-enabled use cases" },
  { match: /sandbox|\bapi\b|\bsdk\b|rate limit|reference architecture|engineer|developer|technical guide|github/i, category: "Developer & technical" },
  { match: /head-to-head|versus| vs |benchmark|comparison|compare|proof|accuracy/i, category: "Comparison & proof" },
  { match: /\bg2\b|gartner|peer insight|review drive|testimonial|community|supper club|\bcab\b/i, category: "Community & Peer validation" },
  { match: /\breports?\b|whitepaper|\bstudy\b/i, category: "Reports" },
];

// Proposes {id, parentId, category} updates for items missing a link — never overwrites an
// existing parentId, a manually-unlinked item, or an anchor/container card itself.
function computeAutoLinks(items: ContentPlanItem[]): { id: string; parentId?: string; category?: string }[] {
  const findContainer = (title: string, variant: string) =>
    items.find((it) => it.variant === variant && it.title.trim().toLowerCase() === title.trim().toLowerCase())?.id;
  const parentIdByKey: Record<string, string | undefined> = {};
  for (const rule of AUTO_PARENTS) parentIdByKey[rule.key] = findContainer(rule.title, rule.variant);
  const fallbackId = findContainer(AUTO_LINK_FALLBACK.title, AUTO_LINK_FALLBACK.variant);
  const anchorIds = new Set([...Object.values(parentIdByKey), fallbackId].filter(Boolean) as string[]);

  const updates: { id: string; parentId?: string; category?: string }[] = [];
  for (const item of items) {
    if (anchorIds.has(item.id) || CONTAINER_VARIANTS.has(item.variant) || item.unlinkedParent) continue;
    const text = [item.title, item.subtitle, item.category, ...item.tags].filter(Boolean).join(" ");
    const rule = AUTO_PARENTS.find((r) => r.match.test(text));
    const parentId = rule ? parentIdByKey[rule.key] : (item.month.endsWith("2027") ? fallbackId : undefined);
    const category = rule?.category ?? AUTO_CATEGORIES.find((r) => r.match.test(text))?.category ?? "Always On";
    const patch: { id: string; parentId?: string; category?: string } = { id: item.id };
    let changed = false;
    if (!item.parentId && parentId && parentId !== item.id) { patch.parentId = parentId; changed = true; }
    if (!item.category) { patch.category = category; changed = true; }
    if (changed) updates.push(patch);
  }
  return updates;
}

export type ContentPlanItem = {
  id: string;
  order: number;
  month: string;
  lane: string;
  contentType: string;
  variant: string;
  title: string;
  subtitle?: string;
  tags: string[];
  category?: string;
  proposed: boolean;
  status: string;
  parentId?: string;
  unlinkedParent?: boolean;
  addedBy?: string;
  addedByEmail?: string;
  createdAt: number;
};

type LastAction =
  | { type: "move"; id: string; prevMonth: string; prevLane: string }
  | { type: "delete"; item: ContentPlanItem }
  | { type: "add"; id: string };

function db() { return getFirestore(); }

// Firestore rejects fields explicitly set to `undefined` — strip them before any write.
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function currentMonthLabel(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Excel (xlsx) import/export — same column layout as the source plan ──
const SHEET_HEADERS = ["Month", "Row", "Content Type", "Variant", "Title", "Subtitle", "Tags", "Category", "Proposed", "Status", "Parent"];

function itemsToRows(items: ContentPlanItem[]) {
  const titleById = new Map(items.map((it) => [it.id, it.title]));
  return items.slice().sort((a, b) => a.order - b.order).map((it) => ({
    Month: it.month, Row: it.lane, "Content Type": it.contentType, Variant: it.variant,
    Title: it.title, Subtitle: it.subtitle || "", Tags: it.tags.join(", "),
    Category: it.category || "", Proposed: it.proposed ? "Yes" : "No", Status: it.status,
    Parent: (it.parentId && titleById.get(it.parentId)) || "",
  }));
}

// Parent is resolved by title after every row has an id — see handleImportFile.
function sheetRowsToItems(rows: Record<string, any>[]): (Omit<ContentPlanItem, "id" | "createdAt" | "parentId"> & { parentTitle?: string })[] {
  return rows.filter((r) => String(r["Title"] ?? "").trim()).map((r, i) => ({
    order: i,
    month: String(r["Month"] ?? "").trim(),
    lane: String(r["Row"] ?? "").trim(),
    contentType: String(r["Content Type"] ?? "").trim(),
    variant: String(r["Variant"] ?? "").trim(),
    title: String(r["Title"] ?? "").trim(),
    subtitle: String(r["Subtitle"] ?? "").trim() || undefined,
    tags: String(r["Tags"] ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    category: String(r["Category"] ?? "").trim() || undefined,
    proposed: /^y/i.test(String(r["Proposed"] ?? "")),
    status: String(r["Status"] ?? "").trim() || "Planned",
    parentTitle: String(r["Parent"] ?? "").trim() || undefined,
  }));
}

export function ComingSoonPage({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) {
  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: MAXW, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.plan }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.plan }} />
          {eyebrow}
        </div>
        <h1 style={{ ...TYPE.hero, fontSize: "clamp(32px, 4.5vw, 48px)", margin: `${SP.sm}px 0 ${SP.md}px` }}>{title}</h1>
        <p style={{ ...TYPE.lede, color: T.grey7, margin: 0, maxWidth: 580, fontSize: 15 }}>{description}</p>
        <div style={{
          marginTop: SP.xxxl, border: `1.5px dashed ${T.grey4}`, borderRadius: R.xl, padding: SP.xxxl,
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: T.grey6, minHeight: 200, justifyContent: "center",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: R.md, background: T.grey2, display: "grid", placeItems: "center", marginBottom: SP.md, fontSize: 20, color: T.grey5 }}>+</div>
          <div style={{ ...TYPE.h3, color: T.grey7 }}>Coming soon</div>
          <p style={{ ...TYPE.small, color: T.grey6, margin: `${SP.xs}px 0 0`, maxWidth: 320 }}>This section is being built next — check back soon.</p>
        </div>
      </div>
    </div>
  );
}

export function useContentPlanStats() {
  const [stats, setStats] = useState<{ total: number; live: number } | null>(null);
  useEffect(() => {
    getDocs(collection(db(), "contentPlan"))
      .then((snap) => {
        let live = 0;
        snap.forEach((d) => { if ((d.data() as any).status === "Live") live++; });
        setStats({ total: snap.size, live });
      })
      .catch(() => setStats(null));
  }, []);
  return stats;
}

export function ContentPlannerPage({ user }: { user?: { displayName?: string | null; email?: string | null } | null }) {
  const canEdit = !!user?.email;
  const nowMonth = useMemo(currentMonthLabel, []);

  const [items, setItems] = useState<ContentPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState<{ editItem?: ContentPlanItem; defaultMonth?: string; defaultLane?: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItemIdRef = useRef<string | null>(null);

  const [laneFilter, setLaneFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [proposedOnly, setProposedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const seedIfEmpty = async () => {
    const batch = writeBatch(db());
    const now = Date.now();
    CONTENT_PLAN_SEED.forEach((it, i) => {
      const id = `cp-seed-${i}`;
      batch.set(doc(db(), "contentPlan", id), stripUndefined({ ...it, id, addedBy: "Seed import", addedByEmail: "", createdAt: now }));
    });
    await batch.commit();
  };

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const snap = await getDocs(query(collection(db(), "contentPlan"), orderBy("order", "asc")));
      if (snap.empty && canEdit) {
        await seedIfEmpty();
        const reseeded = await getDocs(query(collection(db(), "contentPlan"), orderBy("order", "asc")));
        setItems(reseeded.docs.map((d) => d.data() as ContentPlanItem));
      } else {
        setItems(snap.docs.map((d) => d.data() as ContentPlanItem));
      }
    } catch (e: any) {
      setItems([]);
      setLoadError(e?.message || "Couldn't load the content plan — check Firestore rules/connection.");
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [canEdit]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (laneFilter.length && !laneFilter.includes(it.lane)) return false;
      if (statusFilter.length && !statusFilter.includes(it.status)) return false;
      if (proposedOnly && !it.proposed) return false;
      if (q && !`${it.title} ${it.subtitle || ""} ${it.category || ""} ${it.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, laneFilter, statusFilter, proposedOnly, search]);

  const board = useMemo(() => {
    const map: Record<string, Record<string, ContentPlanItem[]>> = {};
    for (const lane of LANES) {
      map[lane] = {};
      for (const month of MONTH_ORDER) map[lane][month] = [];
    }
    for (const it of visible) {
      if (!map[it.lane]) { map[it.lane] = {}; for (const month of MONTH_ORDER) map[it.lane][month] = []; }
      if (!map[it.lane][it.month]) map[it.lane][it.month] = [];
      map[it.lane][it.month].push(it);
    }
    for (const lane of Object.keys(map)) for (const month of Object.keys(map[lane])) map[lane][month].sort((a, b) => a.order - b.order);
    return map;
  }, [visible]);

  const itemsById = useMemo(() => new Map(items.map((it) => [it.id, it])), [items]);

  const requireAuth = () => alert("Sign in with your @gwi.com account to edit the content plan.");

  const openModal = (m: { editItem?: ContentPlanItem; defaultMonth?: string; defaultLane?: string }) => {
    if (!canEdit) { requireAuth(); return; }
    setModal(m);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) { requireAuth(); return; }
    if (!window.confirm("Remove this item from the content plan?")) return;
    const item = items.find((i) => i.id === id);
    try {
      await deleteDoc(doc(db(), "contentPlan", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (item) setLastAction({ type: "delete", item });
    } catch (e: any) {
      alert(`Couldn't delete this item: ${e?.message || "unknown error"}`);
    }
  };

  const handleMove = async (id: string, newMonth: string, newLane: string) => {
    if (!canEdit) { requireAuth(); return; }
    const item = items.find((i) => i.id === id);
    if (!item || (item.month === newMonth && item.lane === newLane)) return;
    const prevMonth = item.month, prevLane = item.lane;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, month: newMonth, lane: newLane } : i)));
    setLastAction({ type: "move", id, prevMonth, prevLane });
    try {
      await setDoc(doc(db(), "contentPlan", id), { month: newMonth, lane: newLane }, { merge: true });
    } catch (e: any) {
      alert(`Couldn't move this item: ${e?.message || "unknown error"}`);
      load();
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!canEdit) { requireAuth(); return; }
    const source = items.find((i) => i.id === id);
    if (!source) return;
    const copy: ContentPlanItem = {
      ...source,
      id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${source.title} (copy)`,
      addedBy: user?.displayName || "",
      addedByEmail: user?.email || "",
      createdAt: Date.now(),
    };
    try {
      await setDoc(doc(db(), "contentPlan", copy.id), stripUndefined(copy));
      setItems((prev) => [...prev, copy]);
      setLastAction({ type: "add", id: copy.id });
    } catch (e: any) {
      alert(`Couldn't duplicate this item: ${e?.message || "unknown error"}`);
    }
  };

  const handleUnlinkParent = async (id: string) => {
    if (!canEdit) { requireAuth(); return; }
    // Flagged so Auto-link never re-attaches a link the user deliberately removed.
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, parentId: undefined, unlinkedParent: true } : i)));
    try {
      await setDoc(doc(db(), "contentPlan", id), { parentId: null, unlinkedParent: true }, { merge: true });
    } catch (e: any) {
      alert(`Couldn't unlink: ${e?.message || "unknown error"}`);
      load();
    }
  };

  const [hiddenLanes, setHiddenLanes] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_LANES_KEY) || "[]")); } catch { return new Set(); }
  });
  useEffect(() => {
    try { localStorage.setItem(HIDDEN_LANES_KEY, JSON.stringify([...hiddenLanes])); } catch { /* ignore */ }
  }, [hiddenLanes]);
  const toggleLaneHidden = (lane: string) => setHiddenLanes((prev) => {
    const next = new Set(prev);
    if (next.has(lane)) next.delete(lane); else next.add(lane);
    return next;
  });

  // ── Drag-to-connect: pull a line from one card's edge dot to another to set parentId ──
  const [connecting, setConnecting] = useState<{ fromId: string; fromVariant: string; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const connectingRef = useRef(connecting);
  useEffect(() => { connectingRef.current = connecting; }, [connecting]);

  const handleConnect = async (fromId: string, fromVariant: string, toId: string) => {
    if (!canEdit || fromId === toId) return;
    const toItem = items.find((i) => i.id === toId);
    if (!toItem) return;
    const toVariant = toItem.variant;
    let childId: string | undefined, parentId: string | undefined;
    if (CONTENT_VARIANTS.includes(fromVariant) && CONTAINER_VARIANTS.has(toVariant)) { childId = fromId; parentId = toId; }
    else if (SERIES_EVENT_VARIANTS.includes(fromVariant) && HERO_CAMPAIGN_VARIANTS.includes(toVariant)) { childId = fromId; parentId = toId; }
    else if (HERO_CAMPAIGN_VARIANTS.includes(fromVariant) && (SERIES_EVENT_VARIANTS.includes(toVariant) || CONTENT_VARIANTS.includes(toVariant))) { childId = toId; parentId = fromId; }
    if (!childId || !parentId) return;
    setItems((prev) => prev.map((it) => (it.id === childId ? { ...it, parentId, unlinkedParent: false } : it)));
    try {
      await setDoc(doc(db(), "contentPlan", childId), { parentId, unlinkedParent: false }, { merge: true });
    } catch (e: any) {
      alert(`Couldn't connect: ${e?.message || "unknown error"}`);
      load();
    }
  };
  // The pointerup listener below is registered once — read the latest handleConnect via a ref so it never closes over stale items/canEdit.
  const handleConnectRef = useRef(handleConnect);
  useEffect(() => { handleConnectRef.current = handleConnect; }, [handleConnect]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (connectingRef.current) setConnecting((c) => (c ? { ...c, x2: e.clientX, y2: e.clientY } : null));
    };
    const onUp = (e: PointerEvent) => {
      const c = connectingRef.current;
      if (!c) return;
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      let targetId: string | undefined;
      for (const el of els) {
        const found = (el as HTMLElement).dataset?.cardId ?? (el as HTMLElement).closest?.("[data-card-id]")?.getAttribute("data-card-id") ?? undefined;
        if (found) { targetId = found; break; }
      }
      setConnecting(null);
      if (targetId && targetId !== c.fromId) handleConnectRef.current(c.fromId, c.fromVariant, targetId);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handleConnectionStart = (cardId: string, variant: string, x: number, y: number) => {
    setConnecting({ fromId: cardId, fromVariant: variant, x1: x, y1: y, x2: x, y2: y });
  };

  const [autoLinking, setAutoLinking] = useState(false);
  const handleAutoLink = async () => {
    if (!canEdit) { requireAuth(); return; }
    const updates = computeAutoLinks(items);
    if (!updates.length) { alert("No new links found — everything that matches a known pattern is already linked."); return; }
    if (!window.confirm(`Auto-link will add a parent and/or category to ${updates.length} item${updates.length === 1 ? "" : "s"} based on title/tag matches. Continue?`)) return;
    setAutoLinking(true);
    try {
      const batch = writeBatch(db());
      for (const u of updates) batch.set(doc(db(), "contentPlan", u.id), stripUndefined({ parentId: u.parentId, category: u.category }), { merge: true });
      await batch.commit();
      setItems((prev) => prev.map((it) => {
        const u = updates.find((x) => x.id === it.id);
        return u ? { ...it, ...(u.parentId ? { parentId: u.parentId } : {}), ...(u.category ? { category: u.category } : {}) } : it;
      }));
    } catch (e: any) {
      alert(`Auto-link failed: ${e?.message || "unknown error"}`);
    } finally {
      setAutoLinking(false);
    }
  };

  const handleUndo = async () => {
    if (!lastAction) return;
    try {
      if (lastAction.type === "move") {
        const { id, prevMonth, prevLane } = lastAction;
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, month: prevMonth, lane: prevLane } : i)));
        await setDoc(doc(db(), "contentPlan", id), { month: prevMonth, lane: prevLane }, { merge: true });
      } else if (lastAction.type === "delete") {
        const { item } = lastAction;
        await setDoc(doc(db(), "contentPlan", item.id), stripUndefined(item));
        setItems((prev) => [...prev, item]);
      } else if (lastAction.type === "add") {
        await deleteDoc(doc(db(), "contentPlan", lastAction.id));
        setItems((prev) => prev.filter((i) => i.id !== lastAction.id));
      }
    } catch (e: any) {
      alert(`Couldn't undo: ${e?.message || "unknown error"}`);
    }
    setLastAction(null);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(itemsToRows(items), { header: SHEET_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Content Plan");
    XLSX.writeFile(wb, `gwi-content-plan-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      const parsedItems = sheetRowsToItems(rows);
      if (!parsedItems.length) { alert("Couldn't find any rows to import — check the file has a header row matching the export format."); return; }
      if (!window.confirm(`This will replace all ${items.length} existing items with ${parsedItems.length} rows from this file. Continue?`)) return;
      setImporting(true);

      const existing = await getDocs(collection(db(), "contentPlan"));
      const delBatch = writeBatch(db());
      existing.docs.forEach((d) => delBatch.delete(d.ref));
      await delBatch.commit();

      const now = Date.now();
      const withIds = parsedItems.map((it, i) => ({ ...it, id: `cp-import-${now}-${i}` }));
      const idByTitle = new Map(withIds.map((it) => [it.title.trim().toLowerCase(), it.id]));
      const addBatch = writeBatch(db());
      withIds.forEach(({ parentTitle, ...it }) => {
        const parentId = parentTitle ? idByTitle.get(parentTitle.trim().toLowerCase()) : undefined;
        addBatch.set(doc(db(), "contentPlan", it.id), stripUndefined({
          ...it, parentId, addedBy: user?.displayName || "", addedByEmail: user?.email || "", createdAt: now,
        }));
      });
      await addBatch.commit();
      await load();
      setImportOpen(false);
      setLastAction(null);
    } catch (e: any) {
      alert(`Import failed: ${e?.message || "unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  const filterCount = laneFilter.length + statusFilter.length + (proposedOnly ? 1 : 0);

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: SP.lg, flexWrap: "wrap", paddingBottom: SP.xl, borderBottom: `1px solid ${T.grey3}` }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.plan }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.plan }} />
              FY27 · Content
            </div>
            <h1 style={{ ...TYPE.hero, fontSize: "clamp(32px, 4.5vw, 48px)", margin: `${SP.sm}px 0 ${SP.md}px` }}>Content Planner</h1>
            <p style={{ ...TYPE.lede, color: T.grey7, margin: 0, maxWidth: 580, fontSize: 15 }}>
              The FY27 content calendar — drag a card to move it between months or lanes.
            </p>
          </div>
          <div style={{ display: "flex", gap: SP.sm, flexShrink: 0 }}>
            {lastAction && (
              <button type="button" onClick={handleUndo} style={secondaryBtnStyle} title="Undo last change">
                <Undo2 size={14} /> Undo
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={handleAutoLink} disabled={autoLinking} style={{ ...secondaryBtnStyle, opacity: autoLinking ? 0.7 : 1 }} title="Link content cards up to their container based on title/tag matches">
                <Link2 size={14} /> {autoLinking ? "Linking…" : "Auto-link"}
              </button>
            )}
            <button type="button" onClick={handleExport} style={secondaryBtnStyle}>
              <Download size={14} /> Export Excel
            </button>
            <button type="button" onClick={() => (canEdit ? setImportOpen(true) : requireAuth())} style={secondaryBtnStyle}>
              <Upload size={14} /> Import Excel
            </button>
            <button type="button" onClick={() => openModal({})} style={primaryBtnStyle}>
              <Plus size={16} /> Add content
            </button>
          </div>
        </header>

        <div style={{ display: "flex", gap: SP.sm, marginTop: SP.lg, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, tags, categories…"
            style={{ fontFamily: T.font, fontSize: 13, padding: "9px 14px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, minWidth: 260 }}
          />
          <FilterPanel
            laneFilter={laneFilter} setLaneFilter={setLaneFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            proposedOnly={proposedOnly} setProposedOnly={setProposedOnly}
            count={filterCount}
          />
          <span style={{ ...TYPE.small, color: T.grey6 }}>{visible.length} of {items.length} items</span>
        </div>

        <KeyLegend />

        <div style={{ marginTop: SP.lg }}>
          {loading ? (
            <p style={{ ...TYPE.body, color: T.grey6 }}>Loading…</p>
          ) : loadError ? (
            <div style={{ border: `1.5px solid ${T.flag}`, background: T.flagBg, borderRadius: R.xl, padding: SP.xxl, color: T.ink }}>
              <div style={{ ...TYPE.h3, color: T.flag, marginBottom: SP.xs }}>Couldn't load the content plan</div>
              <p style={{ ...TYPE.small, margin: 0, color: T.grey7 }}>{loadError}</p>
              <button type="button" onClick={load} style={{ ...secondaryBtnStyle, marginTop: SP.md }}>Retry</button>
            </div>
          ) : (
            <BoardGrid
              lanes={LANES}
              months={MONTH_ORDER}
              board={board}
              itemsById={itemsById}
              nowMonth={nowMonth}
              canEdit={canEdit}
              hiddenLanes={hiddenLanes}
              onToggleHideLane={toggleLaneHidden}
              connecting={connecting}
              onConnectionStart={handleConnectionStart}
              onEdit={(item) => openModal({ editItem: item })}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onUnlinkParent={handleUnlinkParent}
              onQuickAdd={(lane, month) => openModal({ defaultLane: lane, defaultMonth: month })}
              onDragStart={(id) => { dragItemIdRef.current = id; }}
              onDrop={(lane, month) => { const id = dragItemIdRef.current; dragItemIdRef.current = null; if (id) handleMove(id, month, lane); }}
            />
          )}
        </div>
      </div>

      {/* Live connector line while dragging from one card's edge dot to another */}
      {connecting && createPortal(
        <svg style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 300 }}>
          <path
            d={`M ${connecting.x1} ${connecting.y1} C ${connecting.x1 + 80} ${connecting.y1}, ${connecting.x2 - 80} ${connecting.y2}, ${connecting.x2} ${connecting.y2}`}
            fill="none" stroke={T.pink} strokeWidth={2} strokeDasharray="6 3" opacity={0.8}
          />
          <circle cx={connecting.x2} cy={connecting.y2} r={5} fill={T.pink} opacity={0.8} />
        </svg>,
        document.body,
      )}

      {modal && (
        <EditModal
          user={user}
          editItem={modal.editItem}
          defaultMonth={modal.defaultMonth}
          defaultLane={modal.defaultLane}
          allItems={items}
          itemCount={items.length}
          onClose={() => setModal(null)}
          onSaved={(item, wasNew) => {
            setItems((prev) => (prev.some((i) => i.id === item.id) ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item]));
            if (wasNew) setLastAction({ type: "add", id: item.id });
            setModal(null);
          }}
          onDuplicate={modal.editItem ? () => { handleDuplicate(modal.editItem!.id); setModal(null); } : undefined}
        />
      )}

      {importOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setImportOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.4)", display: "grid", placeItems: "center", zIndex: 100, padding: SP.xl }}
        >
          <div style={{ background: T.white, borderRadius: R.xl, padding: SP.xxl, width: "100%", maxWidth: 440, boxShadow: SHADOW.pop, fontFamily: T.font }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SP.lg }}>
              <h2 style={{ ...TYPE.h2, margin: 0 }}>Import Excel</h2>
              <button type="button" onClick={() => setImportOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey6 }}><X size={20} /></button>
            </div>
            <p style={{ ...TYPE.small, color: T.grey7, marginTop: 0 }}>
              Columns: Month, Row, Content Type, Variant, Title, Subtitle, Tags, Category, Proposed, Status, Parent — same layout as Export Excel.
              Parent should match another row's exact Title. This <strong>replaces</strong> every item currently in the plan.
            </p>
            <input
              type="file" accept=".xlsx,.xls" ref={fileInputRef}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }}
              style={{ display: "none" }}
            />
            <button
              type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}
              style={{ ...primaryBtnStyle, width: "100%", justifyContent: "center", opacity: importing ? 0.7 : 1 }}
            >
              {importing ? "Importing…" : "Choose Excel file"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Legend explaining NEW/LIVE badges and the C1/C2/C3 messaging pillars ──
function KeyLegend() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: SP.lg, alignItems: "center", marginTop: SP.lg, padding: `${SP.sm}px 0` }}>
      <LegendBadge bg={T.pinkBg} fg={T.pink} label="NEW" text="Proposed addition" />
      <LegendBadge bg={T.passBg} fg={T.pass} label="LIVE" text="Already out in the world" />
      {Object.entries(PILLARS).map(([code, text]) => (
        <div key={code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ ...TYPE.label, color: T.plan, background: T.planBg, padding: "3px 7px", borderRadius: R.sm }}>{code}</span>
          <span style={{ ...TYPE.small, color: T.grey6 }}>{text}</span>
        </div>
      ))}
    </div>
  );
}

function LegendBadge({ bg, fg, label, text }: { bg: string; fg: string; label: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ ...TYPE.label, color: fg, background: bg, padding: "3px 7px", borderRadius: R.sm }}>{label}</span>
      <span style={{ ...TYPE.small, color: T.grey6 }}>{text}</span>
    </div>
  );
}

// ── The board itself: lanes (rows) × months (columns), draggable cards ──
function BoardGrid({
  lanes, months, board, itemsById, nowMonth, canEdit, hiddenLanes, onToggleHideLane, connecting, onConnectionStart,
  onEdit, onDelete, onDuplicate, onUnlinkParent, onQuickAdd, onDragStart, onDrop,
}: {
  lanes: string[]; months: string[]; board: Record<string, Record<string, ContentPlanItem[]>>;
  itemsById: Map<string, ContentPlanItem>; nowMonth: string;
  canEdit: boolean;
  hiddenLanes: Set<string>;
  onToggleHideLane: (lane: string) => void;
  connecting: { fromId: string; fromVariant: string } | null;
  onConnectionStart: (cardId: string, variant: string, x: number, y: number) => void;
  onEdit: (item: ContentPlanItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUnlinkParent: (id: string) => void;
  onQuickAdd: (lane: string, month: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (lane: string, month: string) => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) => setCollapsedGroups((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<string | null>(null);
  const LABEL_COL = 200;
  const COL_W = 190;
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.grey3}`, borderRadius: R.lg, background: T.white }}>
      <div style={{ display: "grid", gridTemplateColumns: `${LABEL_COL}px repeat(${months.length}, ${COL_W}px)`, minWidth: LABEL_COL + months.length * COL_W }}>
        {/* header row */}
        <div style={{ position: "sticky", left: 0, zIndex: 3, background: T.ink, color: T.white, ...TYPE.label, padding: "12px 14px", display: "flex", alignItems: "center" }}>
          ASSET TYPE
        </div>
        {months.map((m) => (
          <div key={m} style={{ background: m === nowMonth ? T.pink : T.ink, color: T.white, padding: "12px 14px", ...TYPE.label, display: "flex", alignItems: "center", gap: 6, borderLeft: `1px solid rgba(255,255,255,0.15)` }}>
            {m}
            {m === nowMonth && <span style={{ background: "rgba(255,255,255,0.25)", padding: "2px 6px", borderRadius: R.sm, fontSize: 9 }}>NOW</span>}
          </div>
        ))}

        {/* lane rows */}
        {lanes.map((lane) => {
          const Icon = LANE_ICON[lane] || FileText;
          const color = LANE_COLOR[lane] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };

          if (hiddenLanes.has(lane)) {
            return (
              <FragmentRow key={lane}>
                <button
                  type="button" onClick={() => onToggleHideLane(lane)} title={`${lane} is hidden — click to show it again`}
                  style={{
                    position: "sticky", left: 0, zIndex: 3, background: T.grey2, border: "none", borderTop: `1px solid ${T.grey3}`,
                    padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", textAlign: "left",
                  }}
                >
                  <EyeOff size={11} color={T.grey5} />
                  <span style={{ ...TYPE.small, fontWeight: 600, color: T.grey6, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lane}</span>
                  <span style={{ ...TYPE.label, color: T.grey5 }}>Show</span>
                </button>
                {months.map((m) => <div key={m} style={{ borderTop: `1px solid ${T.grey3}`, background: T.grey1, minHeight: 26 }} />)}
              </FragmentRow>
            );
          }

          return (
            <FragmentRow key={lane}>
              <div
                onMouseEnter={() => setHoveredLane(lane)} onMouseLeave={() => setHoveredLane((l) => (l === lane ? null : l))}
                style={{ position: "sticky", left: 0, zIndex: 3, background: T.white, borderTop: `1px solid ${T.grey3}`, padding: "14px", display: "flex", alignItems: "center", gap: SP.sm }}
              >
                <span style={{ color: color.fg }}><Icon size={15} /></span>
                <span style={{ ...TYPE.small, fontWeight: 700, color: T.ink, flex: 1 }}>{lane}</span>
                {hoveredLane === lane && (
                  <button
                    type="button" onClick={() => onToggleHideLane(lane)} title={`Hide ${lane}`}
                    style={{ ...iconBtnStyle, padding: 2 }}
                  >
                    <EyeOff size={13} />
                  </button>
                )}
              </div>
              {months.map((month) => {
                const cellKey = `${lane}-${month}`;
                const cardsHere = board[lane]?.[month] || [];
                // Group cards that share a parent (a container elsewhere on the board) under one collapsible header.
                const grouped: { parentId?: string; parentTitle?: string; cards: ContentPlanItem[] }[] = [];
                const groupIndex = new Map<string, number>();
                for (const item of cardsHere) {
                  const parent = item.parentId ? itemsById.get(item.parentId) : undefined;
                  if (parent) {
                    let idx = groupIndex.get(parent.id);
                    if (idx === undefined) { idx = grouped.length; groupIndex.set(parent.id, idx); grouped.push({ parentId: parent.id, parentTitle: parent.title, cards: [] }); }
                    grouped[idx].cards.push(item);
                  } else {
                    grouped.push({ cards: [item] });
                  }
                }
                const isOver = dragOverKey === cellKey;
                return (
                  <div
                    key={month}
                    onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOverKey(cellKey); } }}
                    onDragLeave={() => setDragOverKey((k) => (k === cellKey ? null : k))}
                    onDrop={(e) => { e.preventDefault(); setDragOverKey(null); if (canEdit) onDrop(lane, month); }}
                    style={{
                      borderTop: `1px solid ${T.grey3}`, borderLeft: `1px solid ${T.grey3}`, minHeight: 90,
                      padding: 6, display: "flex", flexDirection: "column", gap: 6, position: "relative",
                      background: isOver ? "#fdf2f8" : "transparent",
                      boxShadow: isOver ? `inset 0 0 0 1.5px ${T.pink}` : "none",
                      transition: "background-color .1s, box-shadow .1s",
                    }}
                  >
                    {grouped.map((g, gi) => {
                      if (!g.parentId) {
                        return g.cards.map((item) => (
                          <Card key={item.id} item={item} lane={lane} itemsById={itemsById} canEdit={canEdit} connecting={connecting} onConnectionStart={onConnectionStart} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onDuplicate={() => onDuplicate(item.id)} onUnlinkParent={() => onUnlinkParent(item.id)} onDragStart={() => onDragStart(item.id)} />
                        ));
                      }
                      const groupKey = `${lane}-${month}-${g.parentId}`;
                      const collapsed = collapsedGroups.has(groupKey);
                      return (
                        <div key={`g-${gi}`}>
                          <button
                            type="button" onClick={() => toggleGroup(groupKey)}
                            style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", border: "none", background: "none", cursor: "pointer", padding: "2px 0 4px", textAlign: "left" }}
                          >
                            {collapsed ? <ChevronRight size={11} color={T.grey5} /> : <ChevronDown size={11} color={T.grey5} />}
                            <span style={{ ...TYPE.label, color: T.grey6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.parentTitle}</span>
                            <span style={{ flex: 1, borderBottom: `1px dashed ${T.grey4}` }} />
                            <span style={{ ...TYPE.label, color: T.grey5 }}>{g.cards.length}</span>
                          </button>
                          {!collapsed && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {g.cards.map((item) => (
                                <Card key={item.id} item={item} lane={lane} itemsById={itemsById} canEdit={canEdit} connecting={connecting} onConnectionStart={onConnectionStart} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onDuplicate={() => onDuplicate(item.id)} onUnlinkParent={() => onUnlinkParent(item.id)} onDragStart={() => onDragStart(item.id)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {canEdit && (
                      <button
                        type="button" onClick={() => onQuickAdd(lane, month)} title="Add here"
                        style={{
                          alignSelf: "flex-start", border: `1px dashed ${T.grey4}`, background: "transparent", color: T.grey5,
                          borderRadius: R.sm, width: 22, height: 22, display: "grid", placeItems: "center", cursor: "pointer",
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </FragmentRow>
          );
        })}
      </div>
    </div>
  );
}

// Emits a lane's label cell + all its month cells as direct grid children (no wrapping element, so CSS grid auto-placement still lines everything up row by row).
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// The 4 edge positions a connection line can be dragged from (top/bottom/left/right), as % of the card box.
const CONNECTOR_EDGES = [
  { x: 50, y: 0, edgeX: 0.5, edgeY: 0 },
  { x: 50, y: 100, edgeX: 0.5, edgeY: 1 },
  { x: 0, y: 50, edgeX: 0, edgeY: 0.5 },
  { x: 100, y: 50, edgeX: 1, edgeY: 0.5 },
];

function Card({
  item, lane, itemsById, canEdit, connecting, onConnectionStart, onEdit, onDelete, onDuplicate, onUnlinkParent, onDragStart,
}: {
  item: ContentPlanItem; lane: string; itemsById: Map<string, ContentPlanItem>; canEdit: boolean;
  connecting: { fromId: string; fromVariant: string } | null;
  onConnectionStart: (cardId: string, variant: string, x: number, y: number) => void;
  onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onUnlinkParent: () => void; onDragStart: () => void;
}) {
  const color = VARIANT_COLOR[item.variant] || LANE_COLOR[lane] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };
  const parent = item.parentId ? itemsById.get(item.parentId) : undefined;
  const isContainer = CONTAINER_VARIANTS.has(item.variant);
  const allItemsArr = useMemo(() => Array.from(itemsById.values()), [itemsById]);
  const childItems = useMemo(
    () => (isContainer ? allItemsArr.filter((c) => c.parentId === item.id) : []),
    [isContainer, allItemsArr, item.id],
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const { gathered, settled, gather, scatter, dwellProps, panelHoverProps } = useGather(item, allItemsArr, cardRef);
  const [hovered, setHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const showTimerRef = useRef<number | undefined>(undefined);
  const hideTimerRef = useRef<number | undefined>(undefined);

  const scheduleShow = () => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    showTimerRef.current = window.setTimeout(() => {
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        setTooltipPos({ x: r.right + 8, y: r.top });
        setTooltipVisible(true);
      }
    }, 350);
  };
  const scheduleHide = () => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => { setTooltipVisible(false); setTooltipPos(null); }, 200);
  };
  useEffect(() => () => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
  }, []);

  const showDots = canEdit && hovered && !connecting;

  return (
    <div
      ref={cardRef}
      data-card-id={item.id}
      draggable={canEdit}
      onDragStart={onDragStart}
      onClick={() => onEdit()}
      onMouseEnter={() => { setHovered(true); scheduleShow(); }}
      onMouseLeave={() => { setHovered(false); scheduleHide(); }}
      style={{
        background: color.bg, borderLeft: `4px solid ${color.bar}`, borderRadius: R.sm, padding: "8px 10px",
        cursor: canEdit ? "grab" : "pointer", position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <span style={{ ...TYPE.label, color: color.fg }}>{item.contentType}{isContainer && childItems.length > 0 ? ` · ${childItems.length} ASSETS` : ""}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {item.proposed && <span style={{ ...TYPE.label, color: T.pink, background: T.white, padding: "2px 5px", borderRadius: R.sm }}>NEW</span>}
          {item.status === "Live" && <span style={{ ...TYPE.label, color: T.pass, background: T.white, padding: "2px 5px", borderRadius: R.sm }}>LIVE</span>}
        </div>
      </div>
      <div style={{ ...TYPE.small, fontWeight: 700, color: T.ink, marginTop: 3, lineHeight: 1.3 }}>{item.title}</div>
      {item.subtitle && <div style={{ fontSize: 11, color: T.grey6, marginTop: 1 }}>{item.subtitle}</div>}
      {parent && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: T.grey6 }}>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>↳ {parent.title}</span>
          {canEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onUnlinkParent(); }} title="Unlink from parent" style={{ ...iconBtnStyle, padding: 0, flexShrink: 0 }}><X size={10} /></button>
          )}
        </div>
      )}

      {/* Explore spine — hover to gather every linked descendant into a floating panel; click toggles it instantly */}
      {isContainer && childItems.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (gathered) scatter(); else gather(); }}
          {...dwellProps}
          title={gathered ? "Send the cards back" : "Explore this campaign — hover to gather what's linked"}
          style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: hovered || gathered ? 17 : 12,
            border: "none", background: gathered ? T.pink : color.bar, color: T.white,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            borderRadius: `0 ${R.sm}px ${R.sm}px 0`, transition: "width .15s, background-color .15s", padding: 0,
          }}
        >
          {hovered || gathered ? (
            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.06em", writingMode: "vertical-rl", whiteSpace: "nowrap" }}>
              {gathered ? "BACK" : "EXPLORE"}
            </span>
          ) : (
            <ChevronRight size={9} />
          )}
        </button>
      )}
      {gathered && (
        <GatherPanel item={item} accent={color.bar} gathered={gathered} settled={settled} onClose={scatter} panelHoverProps={panelHoverProps} />
      )}

      {/* Connection dots — drag from one card's edge to another to link them; hidden while dragging or mid-connection */}
      {showDots && CONNECTOR_EDGES.map(({ x, y, edgeX, edgeY }, i) => (
        <div
          key={i}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            e.stopPropagation(); e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            onConnectionStart(item.id, item.variant, rect.left + rect.width * edgeX, rect.top + rect.height * edgeY);
          }}
          style={{
            position: "absolute", zIndex: 30, width: 9, height: 9, borderRadius: "50%",
            background: T.white, border: `2px solid ${color.bar}`, cursor: "crosshair",
            left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {tooltipVisible && tooltipPos && createPortal(
        <CardTooltip
          item={item} color={color} parent={parent} childItems={childItems} isContainer={isContainer} canEdit={canEdit}
          pos={tooltipPos}
          onMouseEnter={() => { if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current); }}
          onMouseLeave={scheduleHide}
          onEdit={() => { setTooltipVisible(false); onEdit(); }}
          onDuplicate={() => { setTooltipVisible(false); onDuplicate(); }}
          onDelete={() => { setTooltipVisible(false); onDelete(); }}
        />,
        document.body,
      )}
    </div>
  );
}

function CardTooltip({
  item, color, parent, childItems, isContainer, canEdit, pos, onMouseEnter, onMouseLeave, onEdit, onDuplicate, onDelete,
}: {
  item: ContentPlanItem; color: { fg: string; bg: string; bar: string }; parent?: ContentPlanItem;
  childItems: ContentPlanItem[]; isContainer: boolean; canEdit: boolean; pos: { x: number; y: number };
  onMouseEnter: () => void; onMouseLeave: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed", zIndex: 200, width: 260, background: T.white, borderRadius: R.lg,
        boxShadow: SHADOW.pop, border: `1px solid ${T.grey3}`, padding: SP.lg, fontFamily: T.font,
        left: Math.min(pos.x, window.innerWidth - 280),
        top: Math.max(8, Math.min(pos.y, window.innerHeight - 380)),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: SP.sm, flexWrap: "wrap" }}>
        <span style={{ ...TYPE.label, color: color.fg, background: color.bg, padding: "3px 7px", borderRadius: R.sm }}>{item.contentType}</span>
        {item.proposed && <span style={{ ...TYPE.label, color: T.white, background: T.pink, padding: "3px 7px", borderRadius: R.sm }}>NEW</span>}
        {item.status === "Live" && (
          <span style={{ ...TYPE.small, color: T.pass, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
            <CheckCircle2 size={12} /> Live
          </span>
        )}
      </div>
      <div style={{ ...TYPE.small, fontWeight: 700, color: T.ink, lineHeight: 1.35, fontSize: 13 }}>{item.title}</div>
      {item.subtitle && <div style={{ ...TYPE.small, color: T.grey6, marginTop: 2 }}>{item.subtitle}</div>}
      {parent && <div style={{ ...TYPE.small, color: T.grey6, marginTop: 4 }}>↳ {parent.title}</div>}

      {(item.tags.length > 0 || item.category) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: SP.sm, paddingTop: SP.sm, borderTop: `1px solid ${T.grey3}` }}>
          {item.tags.map((t) => (
            <span key={t} style={{ ...TYPE.label, color: T.plan, background: T.planBg, padding: "2px 6px", borderRadius: R.sm }}>{t}</span>
          ))}
          {item.category && (
            <span style={{ ...TYPE.label, color: T.grey7, background: T.grey2, padding: "2px 6px", borderRadius: R.sm }}>{item.category}</span>
          )}
        </div>
      )}

      {isContainer && childItems.length > 0 && (
        <div style={{ marginTop: SP.sm, paddingTop: SP.sm, borderTop: `1px solid ${T.grey3}` }}>
          <div style={{ ...TYPE.label, color: T.grey6, marginBottom: 6 }}>Contents ({childItems.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {childItems.slice(0, 6).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: (VARIANT_COLOR[c.variant] || color).bar, flexShrink: 0 }} />
                <span style={{ ...TYPE.small, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
              </div>
            ))}
            {childItems.length > 6 && <div style={{ ...TYPE.small, color: T.grey5 }}>+{childItems.length - 6} more</div>}
          </div>
        </div>
      )}

      {canEdit && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: SP.md }}>
          <button type="button" onClick={onEdit} style={{ ...secondaryBtnStyle, justifyContent: "center", width: "100%" }}>Edit</button>
          <button type="button" onClick={onDuplicate} style={{ ...secondaryBtnStyle, justifyContent: "center", width: "100%" }}><Copy size={12} /> Duplicate</button>
          <button type="button" onClick={onDelete} style={{ ...secondaryBtnStyle, justifyContent: "center", width: "100%", color: T.flag, borderColor: T.flagBg }}><Trash2 size={12} /> Delete</button>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  laneFilter, setLaneFilter, statusFilter, setStatusFilter, proposedOnly, setProposedOnly, count,
}: {
  laneFilter: string[]; setLaneFilter: (v: string[]) => void;
  statusFilter: string[]; setStatusFilter: (v: string[]) => void;
  proposedOnly: boolean; setProposedOnly: (v: boolean) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        style={{ ...secondaryBtnStyle, border: `1px solid ${count ? T.plan : T.grey4}`, color: count ? T.plan : T.ink }}
      >
        Filter{count ? ` (${count})` : ""} <ChevronDown size={14} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 260, maxHeight: 360, overflowY: "auto", background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.lg, boxShadow: SHADOW.pop, padding: SP.md }}>
          <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.xs }}>Lane</div>
          {LANES.map((l) => (
            <label key={l} style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "5px 4px", cursor: "pointer" }}>
              <input type="checkbox" checked={laneFilter.includes(l)} onChange={() => toggle(laneFilter, setLaneFilter, l)} />
              <span style={{ ...TYPE.small }}>{l}</span>
            </label>
          ))}
          <div style={{ ...TYPE.label, color: T.grey6, margin: `${SP.md}px 0 ${SP.xs}px` }}>Status</div>
          {STATUSES.map((s) => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "5px 4px", cursor: "pointer" }}>
              <input type="checkbox" checked={statusFilter.includes(s)} onChange={() => toggle(statusFilter, setStatusFilter, s)} />
              <span style={{ ...TYPE.small }}>{s}</span>
            </label>
          ))}
          <div style={{ borderTop: `1px solid ${T.grey3}`, marginTop: SP.md, paddingTop: SP.sm }}>
            <label style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "5px 4px", cursor: "pointer" }}>
              <input type="checkbox" checked={proposedOnly} onChange={(e) => setProposedOnly(e.target.checked)} />
              <span style={{ ...TYPE.small }}>Proposed only</span>
            </label>
          </div>
          {count > 0 && (
            <button
              type="button" onClick={() => { setLaneFilter([]); setStatusFilter([]); setProposedOnly(false); }}
              style={{ ...TYPE.small, color: T.grey6, background: "none", border: "none", cursor: "pointer", padding: "6px 4px 0", textAlign: "left" }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EditModal({
  user, editItem, defaultMonth, defaultLane, allItems, itemCount, onClose, onSaved, onDuplicate,
}: {
  user?: { displayName?: string | null; email?: string | null } | null;
  editItem?: ContentPlanItem;
  defaultMonth?: string;
  defaultLane?: string;
  allItems: ContentPlanItem[];
  itemCount: number;
  onClose: () => void;
  onSaved: (item: ContentPlanItem, wasNew: boolean) => void;
  onDuplicate?: () => void;
}) {
  const [month, setMonth] = useState(editItem?.month || defaultMonth || MONTH_ORDER[0]);
  const [lane, setLane] = useState(editItem?.lane || defaultLane || LANES[0]);
  const [contentType, setContentType] = useState(editItem?.contentType || "BLOG");
  const [variant, setVariant] = useState(editItem?.variant || "blog");
  const [title, setTitle] = useState(editItem?.title || "");
  const [subtitle, setSubtitle] = useState(editItem?.subtitle || "");
  const [tags, setTags] = useState<string[]>(editItem?.tags || []);
  const [category, setCategory] = useState(editItem?.category || "");
  const [proposed, setProposed] = useState(editItem?.proposed || false);
  const [status, setStatus] = useState(editItem?.status || "Planned");
  const [parentId, setParentId] = useState(editItem?.parentId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [openParentGroup, setOpenParentGroup] = useState<string | null>(() => {
    for (const g of PARENT_GROUP_DEFS) {
      if (allItems.some((it) => g.variants.includes(it.variant) && it.id === editItem?.parentId)) return g.key;
    }
    return null;
  });

  // Only content cards (blog/listicle/llm/video/podcast) may link up to a container — matches getValidTargetVariants.
  const canHaveParent = !CONTAINER_VARIANTS.has(variant);
  const typeColor = VARIANT_COLOR[variant] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };
  const parentGroups = PARENT_GROUP_DEFS.map((g) => ({
    ...g,
    cards: allItems.filter((it) => g.variants.includes(it.variant) && it.id !== editItem?.id),
  })).filter((g) => g.cards.length > 0);
  const parentCard = parentId ? allItems.find((it) => it.id === parentId) : undefined;
  const categoryGroup = category ? CATEGORY_GROUPS.find((g) => g.items.includes(category)) : undefined;

  const handleVariantChange = (v: string) => {
    setVariant(v);
    const opt = VARIANT_OPTIONS.find((o) => o.value === v);
    if (opt) setContentType(opt.defaultType);
    if (CONTAINER_VARIANTS.has(v)) setParentId("");
    else if (VARIANT_DEFAULT_LANE[v]) setLane(VARIANT_DEFAULT_LANE[v]);
    setTypeMenuOpen(false);
  };
  const toggleTag = (tag: string) => setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handleSave = async () => {
    if (!title.trim()) { setError("A title is required."); return; }
    setSaving(true);
    const wasNew = !editItem;
    const item: ContentPlanItem = {
      id: editItem?.id || `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      order: editItem?.order ?? itemCount,
      month, lane, contentType: contentType.trim(), variant,
      title: title.trim(), subtitle: subtitle.trim() || undefined,
      tags, category: category || undefined,
      proposed, status,
      parentId: canHaveParent && parentId ? parentId : undefined,
      addedBy: editItem?.addedBy || user?.displayName || "",
      addedByEmail: editItem?.addedByEmail || user?.email || "",
      createdAt: editItem?.createdAt || Date.now(),
    };
    try {
      await setDoc(doc(db(), "contentPlan", item.id), stripUndefined(item));
      onSaved(item, wasNew);
    } catch (e: any) {
      setError(e?.message ? `Couldn't save — ${e.message}` : "Couldn't save — try again.");
      setSaving(false);
    }
  };

  const backdropPressedRef = useRef(false);

  return (
    <div
      onMouseDown={(e) => { backdropPressedRef.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (backdropPressedRef.current && e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.4)", display: "grid", placeItems: "center", zIndex: 100, padding: SP.xl }}
    >
      <div style={{ background: T.white, borderRadius: R.xl, width: "100%", maxWidth: 880, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: SHADOW.pop, fontFamily: T.font }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: `${SP.md}px ${SP.xl}px`, borderBottom: `1px solid ${T.grey3}` }}>
          <h2 style={{ ...TYPE.h3, margin: 0 }}>{editItem ? "Edit card" : "Add card"}</h2>
          <span style={{ ...TYPE.small, color: T.grey5 }}>shape it, watch it change</span>
          <button type="button" onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "transparent", cursor: "pointer", color: T.grey5 }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Left: the making of the card */}
          <div style={{ flex: 1, overflowY: "auto", padding: SP.xl, display: "flex", flexDirection: "column", gap: SP.lg }}>

            {/* Placement — implicit from grid position in the source; explicit here as the only non-drag way to set it */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: SP.sm }}>
              <Field label="Month">
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle}>
                  {MONTH_ORDER.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Lane">
                <select value={lane} onChange={(e) => setLane(e.target.value)} style={inputStyle}>
                  {LANES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            {/* Asset type + Proposed toggle */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: SP.sm, marginBottom: SP.sm }}>
                <span style={{ ...TYPE.label, color: T.grey6 }}>Asset type</span>
                <button
                  type="button" onClick={() => setProposed((p) => !p)}
                  style={{
                    marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, borderRadius: R.pill,
                    padding: "4px 10px 4px 4px", border: `1px solid ${proposed ? T.pink : T.grey4}`, background: proposed ? T.pinkBg : T.white, cursor: "pointer",
                  }}
                >
                  <span style={{ ...TYPE.label, padding: "2px 6px", borderRadius: R.pill, background: proposed ? T.pink : T.grey3, color: proposed ? T.white : T.grey5 }}>NEW</span>
                  <span style={{ ...TYPE.small, fontWeight: 600, color: proposed ? T.pink : T.grey5 }}>Proposed addition</span>
                </button>
              </div>
              <AssetTypeSelect value={variant} onChange={handleVariantChange} open={typeMenuOpen} setOpen={setTypeMenuOpen} />
            </div>

            {/* Headline */}
            <div>
              <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.sm }}>Headline</div>
              <div style={{ border: `1px solid ${title ? typeColor.bar + "88" : T.grey3}`, borderRadius: R.lg, background: T.grey1, padding: SP.lg, display: "flex", flexDirection: "column", gap: SP.sm }}>
                <textarea
                  value={title} onChange={(e) => setTitle(e.target.value)} rows={2} placeholder="What is this piece called?" autoFocus
                  style={{ width: "100%", resize: "none", background: "transparent", border: "none", outline: "none", fontFamily: T.font, fontSize: 17, fontWeight: 700, color: T.ink, lineHeight: 1.4 }}
                />
                <div style={{ height: 1, background: T.grey3 }} />
                <input
                  value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle or wave — optional"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: T.font, fontSize: 13, color: T.grey6 }}
                />
              </div>
            </div>

            {/* Editorial essence */}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: SP.sm }}>
                <span style={{ ...TYPE.label, color: T.grey6 }}>Editorial essence</span>
                <span style={{ ...TYPE.small, color: T.grey5 }}>what is this really about?</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ESSENCE.map((e) => {
                  const cfg = TAG_CFG[e.id];
                  const active = tags.includes(e.id);
                  return (
                    <button
                      key={e.id} type="button" onClick={() => toggleTag(e.id)}
                      style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "8px 10px", borderRadius: R.md, border: `1px solid ${active ? cfg.color : T.grey3}`, background: active ? cfg.bg : T.grey1, cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ width: 22, height: 22, borderRadius: R.sm, background: active ? cfg.color : T.grey4, color: T.white, fontSize: 9, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{e.id}</span>
                      <span style={{ ...TYPE.small, fontWeight: 700, color: active ? cfg.color : T.grey5, flex: 1 }}>{e.label}</span>
                      {active && <span style={{ color: cfg.color, fontWeight: 800 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category groups */}
            <div style={{ display: "flex", flexDirection: "column", gap: SP.md }}>
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.group}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: group.color, display: "inline-block" }} />
                    <span style={{ ...TYPE.label, color: group.color }}>{group.group}</span>
                    {group.description && <span style={{ ...TYPE.small, color: T.grey5 }}>{group.description}</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {group.items.map((label) => {
                      const active = category === label;
                      return (
                        <button
                          key={label} type="button" onClick={() => setCategory(active ? "" : label)}
                          style={{ padding: "6px 12px", borderRadius: R.pill, border: `1px solid ${active ? group.color : T.grey3}`, background: active ? group.color : T.grey1, color: active ? T.white : T.grey6, fontFamily: T.font, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live preview + parent picker */}
          <div style={{ width: 300, flexShrink: 0, borderLeft: `1px solid ${T.grey3}`, background: T.grey1, overflowY: "auto", padding: SP.lg, display: "flex", flexDirection: "column", gap: SP.lg }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: SP.sm }}>
                <span style={{ ...TYPE.label, color: T.grey6 }}>On the plan</span>
                <span style={{ ...TYPE.small, color: T.grey5 }}>{lane} · {month}</span>
              </div>
              <div style={{ background: typeColor.bg, color: typeColor.fg, borderRadius: R.sm, padding: "8px 10px", boxShadow: proposed ? `inset 0 0 0 1.5px ${T.pink}, ${SHADOW.hover}` : SHADOW.hover }}>
                <div style={{ ...TYPE.label, color: proposed ? T.pink : typeColor.fg, opacity: 0.9 }}>{proposed ? `NEW · ${contentType}` : contentType}</div>
                <div style={{ ...TYPE.small, fontWeight: 700, marginTop: 3 }}>{title || "Untitled piece"}</div>
                {subtitle && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>{subtitle}</div>}
                {tags.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {tags.map((t) => <span key={t} style={{ ...TYPE.label, background: "rgba(255,255,255,0.6)", color: typeColor.fg, padding: "1px 5px", borderRadius: R.sm }}>{t}</span>)}
                  </div>
                )}
                {parentCard && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↳ {parentCard.title}</div>}
              </div>
              {category && (
                <div style={{ ...TYPE.small, color: T.grey5, marginTop: SP.sm }}>
                  Tagged <span style={{ fontWeight: 700, color: categoryGroup?.color || T.grey7 }}>{category}</span>
                </div>
              )}
            </div>

            {canHaveParent && parentGroups.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: SP.sm }}>
                  <span style={{ ...TYPE.label, color: T.grey6 }}>Made for</span>
                  <span style={{ ...TYPE.small, color: T.grey5 }}>what does it feed?</span>
                </div>
                <button
                  type="button" onClick={() => setParentId("")}
                  style={{ display: "flex", alignItems: "center", gap: SP.sm, width: "100%", padding: "8px 10px", borderRadius: R.md, border: `1px solid ${parentId === "" ? T.grey6 : T.grey3}`, background: parentId === "" ? T.grey2 : T.white, cursor: "pointer", textAlign: "left", marginBottom: SP.sm }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.grey4, flexShrink: 0 }} />
                  <span style={{ ...TYPE.small, fontWeight: 700, color: T.grey6, flex: 1 }}>Standalone</span>
                  {parentId === "" && <span style={{ color: T.grey6, fontWeight: 800 }}>✓</span>}
                </button>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {parentGroups.map((g) => {
                    const open = openParentGroup === g.key;
                    const selected = g.cards.find((c) => c.id === parentId);
                    const gColor = VARIANT_COLOR[g.variants[0]]?.bar || T.grey6;
                    return (
                      <div key={g.key} style={{ border: `1px solid ${open || selected ? gColor + "88" : T.grey3}`, borderRadius: R.md, background: T.white, overflow: "hidden" }}>
                        <button
                          type="button" onClick={() => setOpenParentGroup(open ? null : g.key)}
                          style={{ display: "flex", alignItems: "center", gap: SP.sm, width: "100%", padding: "8px 10px", border: "none", background: open ? gColor + "14" : T.white, cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: gColor, flexShrink: 0 }} />
                          <span style={{ ...TYPE.small, fontWeight: 700, color: gColor }}>{g.label}</span>
                          {selected && !open && <span style={{ ...TYPE.small, color: T.grey6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{selected.title}</span>}
                          <span style={{ ...TYPE.label, color: T.grey5, marginLeft: "auto" }}>{g.cards.length}</span>
                          <ChevronDown size={12} color={gColor} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
                        </button>
                        {open && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: SP.sm, maxHeight: 180, overflowY: "auto", borderTop: `1px solid ${gColor}22` }}>
                            {g.cards.map((c) => {
                              const active = parentId === c.id;
                              const ccolor = VARIANT_COLOR[c.variant] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };
                              return (
                                <button
                                  key={c.id} type="button" onClick={() => setParentId(active ? "" : c.id)}
                                  style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "6px 8px", borderRadius: R.sm, border: `1px solid ${active ? ccolor.bar : T.grey3}`, background: active ? ccolor.bg : T.white, cursor: "pointer", textAlign: "left" }}
                                >
                                  <span style={{ ...TYPE.small, color: T.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                                  {active && <span style={{ color: ccolor.bar, fontWeight: 800 }}>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: SP.sm, padding: SP.lg, borderTop: `1px solid ${T.grey3}`, alignItems: "center" }}>
          <button type="button" onClick={handleSave} disabled={saving} style={{ ...primaryBtnStyle, flex: 1, justifyContent: "center", background: T.ink, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {onDuplicate && (
            <button type="button" onClick={onDuplicate} style={secondaryBtnStyle}><Copy size={13} /> Duplicate</button>
          )}
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
        </div>
        {error && <p style={{ ...TYPE.small, color: T.flag, margin: `0 ${SP.lg}px ${SP.md}px` }}>{error}</p>}
      </div>
    </div>
  );
}

function AssetTypeSelect({ value, onChange, open, setOpen }: { value: string; onChange: (v: string) => void; open: boolean; setOpen: (o: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, setOpen]);
  const cfg = VARIANT_COLOR[value] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };
  const selected = VARIANT_OPTIONS.find((o) => o.value === value) || VARIANT_OPTIONS[5];
  const Icon = selected.icon;
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button" onClick={() => setOpen(!open)}
        style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, padding: "8px 12px", borderRadius: R.md, border: `1px solid ${cfg.bar}`, background: cfg.bg, color: cfg.fg, fontFamily: T.font, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        <Icon size={14} />
        {selected.label}
        <ChevronDown size={13} style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 220, background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.lg, boxShadow: SHADOW.pop, padding: SP.sm }}>
          {ASSET_TYPE_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{ ...TYPE.label, color: T.grey5, padding: "6px 8px 2px" }}>{group.label}</div>
              {group.items.map((v) => {
                const opt = VARIANT_OPTIONS.find((o) => o.value === v)!;
                const vcfg = VARIANT_COLOR[v];
                const OptIcon = opt.icon;
                const isSelected = value === v;
                return (
                  <button
                    key={v} type="button" onClick={() => onChange(v)}
                    style={{ display: "flex", alignItems: "center", gap: SP.sm, width: "100%", padding: "7px 8px", borderRadius: R.sm, border: "none", background: isSelected ? vcfg.bg : "transparent", color: isSelected ? vcfg.fg : T.ink, cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: isSelected ? 700 : 500, textAlign: "left" }}
                  >
                    <OptIcon size={13} /> {opt.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: SP.lg }}>
      <div style={{ ...TYPE.label, color: T.grey6, marginBottom: SP.xs }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", fontFamily: T.font, fontSize: 14, padding: "9px 12px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, boxSizing: "border-box" };
const iconBtnStyle: React.CSSProperties = { border: "none", background: "transparent", cursor: "pointer", color: T.grey6, padding: 4 };
const primaryBtnStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: SP.sm, padding: "12px 22px", borderRadius: R.pill, border: "none", background: T.ink, color: T.white, fontFamily: T.font, fontWeight: 700, fontSize: 14, cursor: "pointer" };
const secondaryBtnStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, fontFamily: T.font, fontWeight: 600, fontSize: 13, cursor: "pointer" };
