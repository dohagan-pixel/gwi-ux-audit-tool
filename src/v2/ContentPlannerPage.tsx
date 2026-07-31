import { useEffect, useMemo, useRef, useState } from "react";
import {
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  Plus, Cog, Trash2, X, Upload, Download, ChevronDown, ChevronRight, Undo2, Copy,
  Megaphone, FileText, Calendar, Video, Mic, Layers, Code2, Scale, Radio,
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
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, parentId: undefined } : i)));
    try {
      await setDoc(doc(db(), "contentPlan", id), { parentId: null }, { merge: true });
    } catch (e: any) {
      alert(`Couldn't unlink: ${e?.message || "unknown error"}`);
      load();
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
  lanes, months, board, itemsById, nowMonth, canEdit, onEdit, onDelete, onDuplicate, onUnlinkParent, onQuickAdd, onDragStart, onDrop,
}: {
  lanes: string[]; months: string[]; board: Record<string, Record<string, ContentPlanItem[]>>;
  itemsById: Map<string, ContentPlanItem>; nowMonth: string;
  canEdit: boolean;
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
          return (
            <FragmentRow key={lane}>
              <div style={{ position: "sticky", left: 0, zIndex: 3, background: T.white, borderTop: `1px solid ${T.grey3}`, padding: "14px", display: "flex", alignItems: "center", gap: SP.sm }}>
                <span style={{ color: color.fg }}><Icon size={15} /></span>
                <span style={{ ...TYPE.small, fontWeight: 700, color: T.ink }}>{lane}</span>
              </div>
              {months.map((month) => {
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
                return (
                  <div
                    key={month}
                    onDragOver={(e) => { if (canEdit) e.preventDefault(); }}
                    onDrop={(e) => { e.preventDefault(); if (canEdit) onDrop(lane, month); }}
                    style={{
                      borderTop: `1px solid ${T.grey3}`, borderLeft: `1px solid ${T.grey3}`, minHeight: 90,
                      padding: 6, display: "flex", flexDirection: "column", gap: 6, position: "relative",
                    }}
                  >
                    {grouped.map((g, gi) => {
                      if (!g.parentId) {
                        return g.cards.map((item) => (
                          <Card key={item.id} item={item} lane={lane} itemsById={itemsById} canEdit={canEdit} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onDuplicate={() => onDuplicate(item.id)} onUnlinkParent={() => onUnlinkParent(item.id)} onDragStart={() => onDragStart(item.id)} />
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
                                <Card key={item.id} item={item} lane={lane} itemsById={itemsById} canEdit={canEdit} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onDuplicate={() => onDuplicate(item.id)} onUnlinkParent={() => onUnlinkParent(item.id)} onDragStart={() => onDragStart(item.id)} />
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

function Card({
  item, lane, itemsById, canEdit, onEdit, onDelete, onDuplicate, onUnlinkParent, onDragStart,
}: {
  item: ContentPlanItem; lane: string; itemsById: Map<string, ContentPlanItem>; canEdit: boolean;
  onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onUnlinkParent: () => void; onDragStart: () => void;
}) {
  const color = VARIANT_COLOR[item.variant] || LANE_COLOR[lane] || { fg: T.grey7, bg: T.grey2, bar: T.grey5 };
  const parent = item.parentId ? itemsById.get(item.parentId) : undefined;
  return (
    <div
      draggable={canEdit}
      onDragStart={onDragStart}
      style={{
        background: color.bg, borderLeft: `4px solid ${color.bar}`, borderRadius: R.sm, padding: "8px 10px",
        cursor: canEdit ? "grab" : "default", position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <span style={{ ...TYPE.label, color: color.fg }}>{item.contentType}</span>
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
            <button type="button" onClick={onUnlinkParent} title="Unlink from parent" style={{ ...iconBtnStyle, padding: 0, flexShrink: 0 }}><X size={10} /></button>
          )}
        </div>
      )}
      {canEdit && (
        <div style={{ display: "flex", gap: 2, marginTop: 4, justifyContent: "flex-end" }}>
          <button type="button" onClick={onEdit} title="Edit" style={{ ...iconBtnStyle, padding: 2 }}><Cog size={12} /></button>
          <button type="button" onClick={onDuplicate} title="Duplicate" style={{ ...iconBtnStyle, padding: 2 }}><Copy size={12} /></button>
          <button type="button" onClick={onDelete} title="Remove" style={{ ...iconBtnStyle, padding: 2 }}><Trash2 size={12} /></button>
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
  user, editItem, defaultMonth, defaultLane, allItems, itemCount, onClose, onSaved,
}: {
  user?: { displayName?: string | null; email?: string | null } | null;
  editItem?: ContentPlanItem;
  defaultMonth?: string;
  defaultLane?: string;
  allItems: ContentPlanItem[];
  itemCount: number;
  onClose: () => void;
  onSaved: (item: ContentPlanItem, wasNew: boolean) => void;
}) {
  const [month, setMonth] = useState(editItem?.month || defaultMonth || MONTH_ORDER[0]);
  const [lane, setLane] = useState(editItem?.lane || defaultLane || LANES[0]);
  const [contentType, setContentType] = useState(editItem?.contentType || "BLOG");
  const [variant, setVariant] = useState(editItem?.variant || "blog");
  const [title, setTitle] = useState(editItem?.title || "");
  const [subtitle, setSubtitle] = useState(editItem?.subtitle || "");
  const [tags, setTags] = useState(editItem?.tags?.join(", ") || "");
  const [category, setCategory] = useState(editItem?.category || "");
  const [proposed, setProposed] = useState(editItem?.proposed || false);
  const [status, setStatus] = useState(editItem?.status || "Planned");
  const [parentId, setParentId] = useState(editItem?.parentId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Only content cards (blog/listicle/llm/video/podcast) may link up to a container — matches getValidTargetVariants.
  const canHaveParent = !CONTAINER_VARIANTS.has(variant.trim().toLowerCase());
  const parentCandidates = allItems.filter((it) => CONTAINER_VARIANTS.has(it.variant) && it.id !== editItem?.id);

  const handleSave = async () => {
    if (!title.trim()) { setError("A title is required."); return; }
    setSaving(true);
    const wasNew = !editItem;
    const item: ContentPlanItem = {
      id: editItem?.id || `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      order: editItem?.order ?? itemCount,
      month, lane, contentType: contentType.trim(), variant: variant.trim(),
      title: title.trim(), subtitle: subtitle.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      category: category.trim() || undefined,
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
      <div style={{ background: T.white, borderRadius: R.xl, padding: SP.xxl, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: SHADOW.pop, fontFamily: T.font }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SP.lg }}>
          <h2 style={{ ...TYPE.h2, margin: 0 }}>{editItem ? "Edit content" : "Add content"}</h2>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey6 }}><X size={20} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SP.md }}>
          <Field label="Month">
            <select value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle}>
              {MONTH_ORDER.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Lane">
            <input value={lane} onChange={(e) => setLane(e.target.value)} list="lane-options" style={inputStyle} />
            <datalist id="lane-options">{LANES.map((l) => <option key={l} value={l} />)}</datalist>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SP.md }}>
          <Field label="Content type"><input value={contentType} onChange={(e) => setContentType(e.target.value)} style={inputStyle} /></Field>
          <Field label="Variant"><input value={variant} onChange={(e) => setVariant(e.target.value)} style={inputStyle} /></Field>
        </div>

        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a title" style={inputStyle} /></Field>
        <Field label="Subtitle (optional)"><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle} /></Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SP.md }}>
          <Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Always On" style={inputStyle} /></Field>
          <Field label="Tags (comma separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="C1, C2" style={inputStyle} /></Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SP.md }}>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Proposed">
            <label style={{ display: "flex", alignItems: "center", gap: SP.sm, height: 38 }}>
              <input type="checkbox" checked={proposed} onChange={(e) => setProposed(e.target.checked)} />
              <span style={{ ...TYPE.small }}>New / proposed idea</span>
            </label>
          </Field>
        </div>

        {canHaveParent && (
          <Field label="Parent (links this card up to a container)">
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {parentCandidates.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.lane})</option>)}
            </select>
          </Field>
        )}

        {error && <p style={{ ...TYPE.small, color: T.flag, margin: `0 0 ${SP.md}px` }}>{error}</p>}

        <button
          type="button" onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: "12px", borderRadius: R.pill, border: "none", marginTop: SP.sm, background: T.plan, color: T.white, fontFamily: T.font, fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : editItem ? "Save changes" : "Add to plan"}
        </button>
      </div>
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
