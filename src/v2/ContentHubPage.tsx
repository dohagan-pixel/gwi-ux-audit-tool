import { useEffect, useMemo, useRef, useState } from "react";
import { getFirestore, collection, getDocs, getDoc, setDoc, deleteDoc, doc, query, orderBy, where, arrayUnion } from "firebase/firestore";
import { ExternalLink, Instagram, Youtube, FileText, Globe, Plus, Trash2, Cog, X, Upload, ImageOff, ChevronLeft, ChevronRight, ChevronDown, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { T, SP, R, TYPE, SHADOW, MAXW } from "./theme";

const TAGS = ["Digital design trends", "AI-assisted design tools", "No-code platforms", "Agentic web standards"] as const;
const TYPE_ORDER: ContentType[] = ["instagram", "youtube", "blog", "website"];
const SLIDER_CAP = 10;

// Each fixed topic maps to one of GWI's four secondary colour families —
// gives instant at-a-glance categorisation across the grid.
const TAG_COLORS: Record<string, { fg: string; bg: string }> = {
  "Digital design trends": { fg: "#333688", bg: "#DEE0F7" },      // Violet
  "AI-assisted design tools": { fg: "#154B5B", bg: "#D3EFF2" },   // Teal
  "No-code platforms": { fg: "#512179", bg: "#EFE0F5" },          // Purple
  "Agentic web standards": { fg: "#003C71", bg: "#DCEFFB" },      // Blue
};

export type ContentType = "instagram" | "youtube" | "blog" | "website";

export type ContentItem = {
  id: string;
  type: ContentType;
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  tags: string[];
  note?: string;
  addedBy: string;
  addedByEmail: string;
  createdAt: number;
};

const TYPE_META: Record<ContentType, { label: string; icon: React.ReactNode }> = {
  instagram: { label: "Instagram", icon: <Instagram size={14} /> },
  youtube: { label: "YouTube", icon: <Youtube size={14} /> },
  blog: { label: "Blog", icon: <FileText size={14} /> },
  website: { label: "Website", icon: <Globe size={14} /> },
};

function db() { return getFirestore(); }

// Custom categories are shared across the studio (not per-item), stored in one
// doc so a category can exist — and show up as a filter/preset everywhere —
// before any item has actually used it yet.
async function loadCustomCategories(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db(), "contentHubMeta", "categories"));
    return snap.exists() ? (snap.data().list as string[]) || [] : [];
  } catch { return []; }
}

async function saveCustomCategory(name: string): Promise<void> {
  await setDoc(doc(db(), "contentHubMeta", "categories"), { list: arrayUnion(name) }, { merge: true });
}

// Instagram only offers a public embed widget for permalinked posts/reels —
// Stories have no permalink and were never embeddable, by Instagram's own design.
function isEmbeddableInstagramPost(url: string): boolean {
  return /instagram\.com\/(p|reel|reels)\//i.test(url);
}

// Instagram's officially documented embed.js/blockquote widget always ships
// its own header, like/comment icons and "Add a comment"/"View more on
// Instagram" link baked into a cross-origin iframe — that attribution link is
// mandatory on every Instagram embed, official or not, so a custom-cropped
// iframe doesn't actually get rid of it, just clips it inconsistently.
// Using their widget directly instead: no cropping, whatever Instagram
// renders is what shows, sized naturally.
function loadInstagramEmbedScript(): Promise<void> {
  const w = window as any;
  if (w.instgrm) return Promise.resolve();
  if (w.__instgrmLoading) return w.__instgrmLoading;
  w.__instgrmLoading = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  return w.__instgrmLoading;
}

function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    loadInstagramEmbedScript().then(() => {
      if (cancelled) return;
      const process = () => (window as any).instgrm?.Embeds?.process();
      process();
      // Instagram's script can take its height reading before a horizontally
      // scrolling flex row has fully settled, leaving some posts stuck at the
      // wrong size — a couple of delayed re-processes catches those.
      timers.push(window.setTimeout(process, 500));
      timers.push(window.setTimeout(process, 1500));
    });
    return () => { cancelled = true; timers.forEach((t) => clearTimeout(t)); };
  }, [url]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" style={{ margin: 0, width: "100%", minWidth: 0 }} />
    </div>
  );
}

// YouTube's embed player is a clean, officially supported iframe with no
// extra chrome baked in (unlike Instagram) — no cropping tricks needed.
function youtubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeEmbed({ url }: { url: string }) {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", background: T.ink }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}

function isEmbeddable(item: ContentItem): boolean {
  if (item.type === "instagram") return isEmbeddableInstagramPost(item.url);
  if (item.type === "youtube") return !!youtubeVideoId(item.url);
  return false;
}

function EmbedCard({ item, onEdit, onDelete }: { item: ContentItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div>
      <div style={{ borderRadius: R.xl, overflow: "hidden", border: `1px solid ${T.grey3}` }}>
        {item.type === "instagram" ? <InstagramEmbed url={item.url} /> : <YouTubeEmbed url={item.url} />}
      </div>
      {item.type === "youtube" && item.title && (
        <a href={item.url} target="_blank" rel="noreferrer" style={{ ...TYPE.h3, fontSize: 16, color: T.ink, textDecoration: "none", display: "block", marginTop: SP.sm }}>
          {item.title}
        </a>
      )}
      <ItemMeta item={item} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// Arrows sit at a fixed pixel offset (not a % of the row) so they land in the
// middle of the media block itself rather than drifting into the meta text
// below once tags/captions push a card's total height around.
function HScroller({ children, arrowTop = 120 }: { children: React.ReactNode; arrowTop?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button" onClick={() => scroll(-1)} aria-label="Scroll left"
        style={{ ...arrowBtnStyle, top: arrowTop, left: -16 }}
      >
        <ChevronLeft size={18} />
      </button>
      <div ref={ref} style={{ display: "flex", gap: SP.lg, overflowX: "auto", scrollSnapType: "x proximity", paddingBottom: SP.md }}>
        {children}
      </div>
      <button
        type="button" onClick={() => scroll(1)} aria-label="Scroll right"
        style={{ ...arrowBtnStyle, top: arrowTop, right: -16 }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

const arrowBtnStyle: React.CSSProperties = {
  position: "absolute", transform: "translateY(-50%)",
  width: 36, height: 36, borderRadius: "50%", border: `1px solid ${T.grey3}`, background: T.white,
  color: T.ink, display: "grid", placeItems: "center", cursor: "pointer", boxShadow: SHADOW.hover, zIndex: 2,
};

// Approximate media-block height per type, used only to vertically centre the
// slider arrows on the media itself (not an exact render height).
const SECTION_MEDIA_HEIGHT: Record<ContentType, number> = {
  instagram: 500,
  youtube: Math.round((460 * 9) / 16),
  blog: Math.round((280 * 11) / 16),
  website: Math.round((280 * 11) / 16),
};

function ItemMeta({ item, onEdit, onDelete }: { item: ContentItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <>
      {item.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: SP.sm }}>
          {item.tags.map((t) => {
            const c = TAG_COLORS[t] || { fg: T.hub, bg: T.hubBg };
            return <span key={t} style={{ ...TYPE.label, color: c.fg, background: c.bg, padding: "4px 8px", borderRadius: R.pill }}>{t}</span>;
          })}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: SP.sm }}>
        <span style={{ ...TYPE.small, color: T.grey5 }}>{item.addedBy || item.addedByEmail} · {fmtDate(item.createdAt)}</span>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            type="button" onClick={onEdit} title="Edit"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey5, padding: 4 }}
          >
            <Cog size={14} />
          </button>
          <button
            type="button" onClick={onDelete} title="Remove"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey5, padding: 4 }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

function SliderItem({ item, onEdit, onDelete }: { item: ContentItem; onEdit: () => void; onDelete: () => void }) {
  const embeddable = isEmbeddable(item);
  const width = item.type === "instagram" && embeddable ? 340 : item.type === "youtube" && embeddable ? 460 : 280;
  return (
    <div style={{ flex: "0 0 auto", width, scrollSnapAlign: "start" }}>
      {embeddable ? <EmbedCard item={item} onEdit={onEdit} onDelete={onDelete} /> : <ContentCard item={item} onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

const pillBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${T.grey3}`, background: T.white,
  borderRadius: R.pill, cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.ink,
};

function TypeSection({
  type, items, onViewAll, onQuickAdd, onEdit, onDelete,
}: { type: ContentType; items: ContentItem[]; onViewAll: () => void; onQuickAdd: () => void; onEdit: (item: ContentItem) => void; onDelete: (id: string) => void }) {
  if (!items.length) return null;
  const meta = TYPE_META[type];
  const visible = items.slice(0, SLIDER_CAP);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SP.md }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
          <span style={{ color: T.hub }}>{meta.icon}</span>
          <h2 style={{ ...TYPE.h3, margin: 0 }}>{meta.label}</h2>
          <span style={{ ...TYPE.small, color: T.grey5 }}>{items.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
          <button
            type="button" onClick={onQuickAdd} aria-label={`Add ${meta.label} content`} title={`Add ${meta.label} content`}
            style={{ ...pillBtnStyle, width: 30, height: 30, padding: 0, justifyContent: "center" }}
          >
            <Plus size={14} />
          </button>
          <button type="button" onClick={onViewAll} style={{ ...pillBtnStyle, padding: "7px 14px" }}>
            View all <ArrowRight size={13} />
          </button>
        </div>
      </div>
      <HScroller arrowTop={SECTION_MEDIA_HEIGHT[type] / 2}>
        {visible.map((item) => (
          <SliderItem key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
        ))}
      </HScroller>
    </div>
  );
}

function TypeAllView({
  type, items, onBack, onEdit, onDelete,
}: { type: ContentType; items: ContentItem[]; onBack: () => void; onEdit: (item: ContentItem) => void; onDelete: (id: string) => void }) {
  const meta = TYPE_META[type];
  return (
    <div>
      <button
        type="button" onClick={onBack}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", ...TYPE.small, fontWeight: 700, color: T.grey6, padding: 0, marginBottom: SP.lg }}
      >
        <ArrowLeft size={13} /> All content
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: SP.sm, marginBottom: SP.xl }}>
        <span style={{ color: T.hub }}>{meta.icon}</span>
        <h2 style={{ ...TYPE.h2, margin: 0 }}>{meta.label}</h2>
        <span style={{ ...TYPE.small, color: T.grey5 }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${type === "youtube" ? 400 : 300}px, 1fr))`, gap: SP.xxl }}>
          {items.map((item) => (
            <div key={item.id}>
              {isEmbeddable(item)
                ? <EmbedCard item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
                : <ContentCard item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ border: `1.5px dashed ${T.grey4}`, borderRadius: R.xl, padding: SP.xxxl, textAlign: "center", color: T.grey6 }}>
      <div style={{ ...TYPE.h3, color: T.grey7, marginBottom: SP.xs }}>Nothing here yet</div>
      <p style={{ ...TYPE.small, margin: 0 }}>Be the first to add something worth sharing with the studio.</p>
    </div>
  );
}

const filterBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, borderRadius: R.md, cursor: "pointer",
  fontFamily: T.font, fontSize: 13, fontWeight: 600, padding: "9px 14px", background: T.white,
};

function TagFilterDropdown({
  allTags, active, onToggle, onAddCategory,
}: { allTags: string[]; active: string[]; onToggle: (tag: string) => void; onAddCategory: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const submitNew = () => {
    const t = newTag.trim();
    if (!t) return;
    onAddCategory(t);
    setNewTag("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        style={{ ...filterBtnStyle, border: `1px solid ${active.length ? T.hub : T.grey4}`, color: active.length ? T.hub : T.ink }}
      >
        Category{active.length ? ` (${active.length})` : ""} <ChevronDown size={14} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, width: 260,
          background: T.white, border: `1px solid ${T.grey3}`, borderRadius: R.lg, boxShadow: SHADOW.pop, padding: SP.md,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 220, overflowY: "auto" }}>
            {allTags.map((tag) => {
              const isActive = active.includes(tag);
              const c = TAG_COLORS[tag] || { fg: T.hub, bg: T.hubBg };
              return (
                <label key={tag} style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "6px 8px", borderRadius: R.md, cursor: "pointer", background: isActive ? c.bg : "transparent" }}>
                  <input type="checkbox" checked={isActive} onChange={() => onToggle(tag)} style={{ accentColor: c.fg }} />
                  <span style={{ ...TYPE.small, color: isActive ? c.fg : T.ink, fontWeight: isActive ? 700 : 500 }}>{tag}</span>
                </label>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: SP.sm, paddingTop: SP.sm, borderTop: `1px solid ${T.grey3}` }}>
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitNew(); } }}
              placeholder="New category…"
              style={{ flex: 1, fontFamily: T.font, fontSize: 13, padding: "6px 10px", borderRadius: R.sm, border: `1px solid ${T.grey4}`, boxSizing: "border-box" }}
            />
            <button
              type="button" onClick={submitNew} disabled={!newTag.trim()} aria-label="Add category"
              style={{ display: "grid", placeItems: "center", width: 30, flexShrink: 0, borderRadius: R.sm, border: `1px solid ${T.grey4}`, background: T.grey2, color: T.ink, cursor: newTag.trim() ? "pointer" : "default" }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContentHubPage({ user }: { user?: { displayName?: string | null; email?: string | null } | null }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: ContentType; editItem?: ContentItem } | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db(), "contentHub"), orderBy("createdAt", "desc")))
      .then((snap) => setItems(snap.docs.map((d) => d.data() as ContentItem)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => { loadCustomCategories().then(setCustomCategories); }, []);

  // Tag/search apply regardless of type — the type pills switch layout mode
  // (sectioned overview vs. a single type's full list), not what's matched.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (tagFilter.length && !tagFilter.some((t) => it.tags.includes(t))) return false;
      if (q && !`${it.title} ${it.note || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, tagFilter, search]);

  const grouped = useMemo(() => {
    const map = { instagram: [], youtube: [], blog: [], website: [] } as Record<ContentType, ContentItem[]>;
    for (const it of baseFiltered) map[it.type]?.push(it);
    return map;
  }, [baseFiltered]);

  // Tag list grows to include shared custom categories (creatable ahead of
  // any item existing) plus whatever's actually in use on items — not just
  // the 4 fixed presets.
  const allTags = useMemo(() => {
    const fromItems = items.flatMap((it) => it.tags);
    return Array.from(new Set([...TAGS, ...customCategories, ...fromItems]));
  }, [items, customCategories]);

  const addCategory = (name: string) => {
    const t = name.trim();
    if (!t) return;
    setCustomCategories((prev) => (prev.includes(t) ? prev : [...prev, t]));
    saveCustomCategory(t).catch(() => {});
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this item from the hub?")) return;
    try {
      await deleteDoc(doc(db(), "contentHub", id));
      // Items saved before the addDoc→setDoc fix got a Firestore doc id that
      // doesn't match their `id` field, so the delete above silently misses
      // them — sweep by field value too to actually clean those up.
      const stray = await getDocs(query(collection(db(), "contentHub"), where("id", "==", id)));
      await Promise.all(stray.docs.map((d) => deleteDoc(d.ref)));
      // Only drop it from the visible list once Firestore actually confirms
      // the delete — removing it optimistically hid failures until refresh.
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert(`Couldn't delete this item: ${e?.message || "unknown error"}`);
    }
  };

  return (
    <div style={{ background: T.grey1, minHeight: "100%", overflow: "auto", fontFamily: T.font, color: T.ink }}>
      <div style={{ maxWidth: MAXW, margin: "0 auto", padding: `${SP.xxxl}px ${SP.xl}px ${SP.huge}px` }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: SP.lg, flexWrap: "wrap", paddingBottom: SP.xxl, borderBottom: `1px solid ${T.grey3}` }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: SP.sm, ...TYPE.eyebrow, color: T.hub }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.hub }} />
              Studio resource
            </div>
            <h1 style={{ ...TYPE.hero, fontSize: "clamp(36px, 5vw, 56px)", margin: `${SP.sm}px 0 ${SP.md}px` }}>Content Hub</h1>
            <p style={{ ...TYPE.lede, color: T.grey7, margin: 0, maxWidth: 580 }}>
              Digital design trends, AI-assisted design tools, no-code platforms and agentic web standards — save what's worth sharing with the studio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ type: "youtube" })}
            style={{
              display: "inline-flex", alignItems: "center", gap: SP.sm, padding: "12px 22px",
              borderRadius: R.pill, border: "none", background: T.ink, color: T.white,
              fontFamily: T.font, fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0,
              transition: "background .2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.hub; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = T.ink; }}
          >
            <Plus size={16} /> Add content
          </button>
        </header>

        <div style={{ display: "flex", gap: SP.sm, marginTop: SP.xl, flexWrap: "wrap", alignItems: "center" }}>
          {(["all", "instagram", "youtube", "blog", "website"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              style={{
                ...filterBtnStyle,
                border: `1px solid ${typeFilter === t ? T.ink : T.grey4}`,
                background: typeFilter === t ? T.ink : T.white,
                color: typeFilter === t ? T.white : T.ink,
              }}
            >
              {t === "all" ? "All" : TYPE_META[t].label}
            </button>
          ))}

          <TagFilterDropdown allTags={allTags} active={tagFilter} onToggle={toggleTagFilter} onAddCategory={addCategory} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or note…"
            style={{
              fontFamily: T.font, fontSize: 13, padding: "9px 14px", borderRadius: R.md,
              border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, minWidth: 200,
            }}
          />

          {(typeFilter !== "all" || tagFilter.length > 0 || search.trim()) && (
            <button
              type="button"
              onClick={() => { setTypeFilter("all"); setTagFilter([]); setSearch(""); }}
              style={{ ...filterBtnStyle, border: "none", background: "none", color: T.grey6, marginLeft: "auto" }}
            >
              Reset filters <RotateCcw size={13} />
            </button>
          )}
        </div>

        <div style={{ marginTop: SP.xxxl, display: "flex", flexDirection: "column", gap: SP.xxxl }}>
          {loading ? (
            <p style={{ ...TYPE.body, color: T.grey6 }}>Loading…</p>
          ) : baseFiltered.length === 0 ? (
            <EmptyState />
          ) : typeFilter === "all" ? (
            TYPE_ORDER.map((t) => (
              <TypeSection
                key={t} type={t} items={grouped[t]}
                onViewAll={() => setTypeFilter(t)}
                onQuickAdd={() => setModal({ type: t })}
                onEdit={(item) => setModal({ type: item.type, editItem: item })}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <TypeAllView
              type={typeFilter} items={grouped[typeFilter]}
              onBack={() => setTypeFilter("all")}
              onEdit={(item) => setModal({ type: item.type, editItem: item })}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {modal && (
        <AddContentModal
          user={user}
          initialType={modal.type}
          editItem={modal.editItem}
          availableTags={allTags}
          onAddCategory={addCategory}
          onClose={() => setModal(null)}
          onSaved={(item) => {
            setItems((prev) => (prev.some((i) => i.id === item.id) ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev]));
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ContentCard({ item, onEdit, onDelete }: { item: ContentItem; onEdit: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  const meta = TYPE_META[item.type];
  const aspectRatio = item.type === "blog" || item.type === "website" ? "16 / 9" : "16 / 11";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: T.white, border: `1px solid ${hover ? T.hub : T.grey3}`, borderRadius: R.xl, overflow: "hidden",
        display: "flex", flexDirection: "column", transform: hover ? "translateY(-4px)" : "none",
        transition: "transform .25s cubic-bezier(.16,1,.3,1), border-color .2s",
      }}
    >
      <a href={item.url} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none", position: "relative" }}>
        <div style={{ position: "relative", aspectRatio, overflow: "hidden", background: T.grey2 }}>
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform .5s cubic-bezier(.16,1,.3,1)",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: T.grey5 }}>
              <span style={{ transform: "scale(2.2)" }}>{meta.icon}</span>
            </div>
          )}
          <div style={{
            position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: R.pill, background: "rgba(14,17,22,0.72)", color: T.white,
            ...TYPE.label, backdropFilter: "blur(4px)",
          }}>
            {meta.icon} {meta.label}
          </div>
        </div>
      </a>
      <div style={{ padding: SP.lg, display: "flex", flexDirection: "column", gap: SP.sm, flex: 1 }}>
        <a href={item.url} target="_blank" rel="noreferrer" style={{ ...TYPE.h3, color: T.ink, textDecoration: "none", display: "flex", gap: SP.xs, alignItems: "flex-start" }}>
          <span style={{ flex: 1 }}>{item.title || item.url}</span>
          <ExternalLink size={14} style={{ flexShrink: 0, marginTop: 4, color: T.grey5 }} />
        </a>
        {item.note && <p style={{ ...TYPE.small, color: T.grey7, margin: 0 }}>{item.note}</p>}
        {item.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: SP.xs }}>
            {item.tags.map((t) => {
              const c = TAG_COLORS[t] || { fg: T.hub, bg: T.hubBg };
              return <span key={t} style={{ ...TYPE.label, color: c.fg, background: c.bg, padding: "4px 8px", borderRadius: R.pill }}>{t}</span>;
            })}
          </div>
        )}
        <div style={{ marginTop: "auto", paddingTop: SP.sm, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...TYPE.small, color: T.grey5 }}>{item.addedBy || item.addedByEmail} · {fmtDate(item.createdAt)}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey5, padding: 4 }}
            >
              <Cog size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Remove"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey5, padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtDate(ts: number): string {
  try { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; }
}

function resizeImageToDataUrl(file: File, maxDim = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale) || 1;
      const h = Math.round(img.height * scale) || 1;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read image")); };
    img.src = url;
  });
}

function AddContentModal({
  user, initialType, editItem, availableTags, onAddCategory, onClose, onSaved,
}: {
  user?: { displayName?: string | null; email?: string | null } | null;
  initialType?: ContentType;
  editItem?: ContentItem;
  availableTags: string[];
  onAddCategory: (name: string) => void;
  onClose: () => void;
  onSaved: (item: ContentItem) => void;
}) {
  const [type, setType] = useState<ContentType>(editItem?.type || initialType || "youtube");
  const [url, setUrl] = useState(editItem?.url || "");
  const [title, setTitle] = useState(editItem?.title || "");
  const [description, setDescription] = useState(editItem?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(editItem?.thumbnailUrl || "");
  const [note, setNote] = useState(editItem?.note || "");
  const [tags, setTags] = useState<string[]>(editItem?.tags || []);
  const [customTag, setCustomTag] = useState("");
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canFetchPreview = type === "youtube" || type === "blog" || type === "website";

  const fetchPreview = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl);
      if (!data.title) setError("Couldn't fetch a preview — enter a title manually.");
    } catch {
      setError("Couldn't fetch a preview — enter a title manually.");
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("Image must be under 15MB."); return; }
    setUploading(true);
    setError("");
    try {
      // No Firebase Storage on the Spark plan — compress client-side and store
      // inline as a data URL instead, well within Firestore's 1MB doc limit.
      const dataUrl = await resizeImageToDataUrl(file);
      if (dataUrl.length > 700_000) { setError("Image is still too large after compressing — try a smaller one."); return; }
      setThumbnailUrl(dataUrl);
    } catch {
      setError("Couldn't process that image — try again.");
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    onAddCategory(t);
    setCustomTag("");
  };

  const handleSave = async () => {
    if (!url.trim() || !title.trim()) { setError("A URL and title are required."); return; }
    setSaving(true);
    const item: ContentItem = {
      id: editItem?.id || `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type, url: url.trim(), title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      tags, note: note.trim() || undefined,
      addedBy: editItem?.addedBy || user?.displayName || "",
      addedByEmail: editItem?.addedByEmail || user?.email || "",
      createdAt: editItem?.createdAt || Date.now(),
    };
    try {
      // Firestore rejects fields explicitly set to `undefined` — strip them before writing.
      // Written at a doc keyed by item.id (not addDoc's auto-id) so later
      // deletes-by-id actually hit the right document; editing an existing
      // item just overwrites the same doc.
      const docData = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined));
      await setDoc(doc(db(), "contentHub", item.id), docData);
      if (editItem) {
        // Items saved before the addDoc→setDoc fix live at a Firestore doc id
        // that doesn't match their `id` field — editing one without this
        // would leave that stray original behind as a visible duplicate.
        const stray = await getDocs(query(collection(db(), "contentHub"), where("id", "==", item.id)));
        await Promise.all(stray.docs.filter((d) => d.id !== item.id).map((d) => deleteDoc(d.ref)));
      }
      onSaved(item);
    } catch (e: any) {
      setError(e?.message ? `Couldn't save — ${e.message}` : "Couldn't save — try again.");
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(14,17,22,0.4)", display: "grid",
        placeItems: "center", zIndex: 100, padding: SP.xl,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white, borderRadius: R.xl, padding: SP.xxl, width: "100%", maxWidth: 480,
          maxHeight: "90vh", overflow: "auto", boxShadow: SHADOW.pop, fontFamily: T.font,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SP.lg }}>
          <h2 style={{ ...TYPE.h2, margin: 0 }}>{editItem ? "Edit content" : "Add content"}</h2>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey6 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", gap: SP.xs, marginBottom: SP.lg }}>
          {(Object.keys(TYPE_META) as ContentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 4px", borderRadius: R.md, cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${type === t ? T.hub : T.grey3}`,
                background: type === t ? T.hubBg : T.white, color: type === t ? T.hub : T.grey6,
              }}
            >
              {TYPE_META[t].icon} {TYPE_META[t].label}
            </button>
          ))}
        </div>

        <Field label="URL">
          <div style={{ display: "flex", gap: SP.sm }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
            {canFetchPreview && (
              <button
                type="button" onClick={fetchPreview} disabled={fetching || !url.trim()}
                style={{
                  ...TYPE.small, fontWeight: 700, whiteSpace: "nowrap", padding: "0 14px", borderRadius: R.md,
                  border: `1px solid ${T.grey4}`, background: T.grey2, color: T.ink, cursor: fetching ? "default" : "pointer",
                }}
              >
                {fetching ? "Fetching…" : "Fetch preview"}
              </button>
            )}
          </div>
        </Field>

        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a title" style={inputStyle} /></Field>

        <Field label="Thumbnail">
          <div style={{ display: "flex", gap: SP.md, alignItems: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: R.md, background: T.grey2, flexShrink: 0, overflow: "hidden",
              display: "grid", placeItems: "center", color: T.grey5,
            }}>
              {thumbnailUrl ? <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageOff size={20} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <input
                type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }}
              />
              <button
                type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, ...TYPE.small, fontWeight: 700,
                  padding: "8px 14px", borderRadius: R.md, border: `1px solid ${T.grey4}`, background: T.white,
                  color: T.ink, cursor: uploading ? "default" : "pointer", alignSelf: "flex-start",
                }}
              >
                <Upload size={13} /> {uploading ? "Processing…" : thumbnailUrl ? "Replace image" : "Upload image"}
              </button>
              {thumbnailUrl && (
                <button
                  type="button" onClick={() => setThumbnailUrl("")}
                  style={{ ...TYPE.small, color: T.grey6, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                >
                  Remove image
                </button>
              )}
            </div>
          </div>
        </Field>

        <Field label="Notes (optional)">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why does this matter to the studio?" rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
        </Field>

        <Field label="Tags">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: SP.sm }}>
            {availableTags.map((tag) => {
              const active = tags.includes(tag);
              const c = TAG_COLORS[tag] || { fg: T.hub, bg: T.hubBg };
              return (
                <button
                  key={tag} type="button" onClick={() => toggleTag(tag)}
                  style={{
                    border: `1px solid ${active ? c.fg : T.grey4}`, cursor: "pointer", fontFamily: T.font,
                    fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: R.pill,
                    background: active ? c.bg : T.white, color: active ? c.fg : T.grey6,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: SP.sm }}>
            <input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
              placeholder="Add your own category…"
              style={{ ...inputStyle, fontSize: 13, padding: "8px 12px" }}
            />
            <button
              type="button" onClick={addCustomTag} disabled={!customTag.trim()} aria-label="Add category"
              style={{
                display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: R.md, flexShrink: 0,
                border: `1px solid ${T.grey4}`, background: T.grey2, color: T.ink, cursor: customTag.trim() ? "pointer" : "default",
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        </Field>

        {error && <p style={{ ...TYPE.small, color: T.flag, margin: `0 0 ${SP.md}px` }}>{error}</p>}

        <button
          type="button" onClick={handleSave} disabled={saving || uploading}
          style={{
            width: "100%", padding: "12px", borderRadius: R.pill, border: "none", marginTop: SP.sm,
            background: T.hub, color: T.white, fontFamily: T.font, fontWeight: 700, fontSize: 14,
            cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : editItem ? "Save changes" : "Save to hub"}
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

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: T.font, fontSize: 14, padding: "9px 12px", borderRadius: R.md,
  border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, boxSizing: "border-box",
};
