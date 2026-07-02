import { useEffect, useMemo, useRef, useState } from "react";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { ExternalLink, Instagram, Youtube, FileText, Globe, Plus, Trash2, X, Upload, ImageOff, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react";
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

// Instagram only offers a public embed widget for permalinked posts/reels —
// Stories have no permalink and were never embeddable, by Instagram's own design.
function isEmbeddableInstagramPost(url: string): boolean {
  return /instagram\.com\/(p|reel|reels)\//i.test(url);
}

// Instagram's officially documented embed.js/blockquote widget always ships
// its own header, like/comment icons and "Add a comment" box baked into a
// cross-origin iframe we can't reach with CSS or JS to strip. Pointing an
// iframe straight at the same /embed/ page Instagram's widget uses under the
// hood, then cropping its visible height, hides that footer chrome for most
// posts — this is the same endpoint, just used directly rather than through
// their JS wrapper. It's not a documented API, so the crop height is a
// best-effort guess per post type and could need retuning if Instagram
// changes their embed layout.
function instagramEmbedIframeSrc(url: string): string | null {
  const m = url.match(/instagram\.com\/(p|reel|reels)\/([^/?]+)/i);
  if (!m) return null;
  const kind = m[1] === "p" ? "p" : "reel";
  return `https://www.instagram.com/${kind}/${m[2]}/embed/`;
}

function InstagramEmbed({ url }: { url: string }) {
  const src = instagramEmbedIframeSrc(url);
  if (!src) return null;
  const isReel = /\/(reel|reels)\//i.test(url);
  const cropHeight = isReel ? 560 : 480;
  return (
    <div style={{ position: "relative", height: cropHeight, overflow: "hidden", background: T.white }}>
      <iframe
        src={src}
        title="Instagram post"
        width="100%"
        height={900}
        scrolling="no"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", border: "none" }}
      />
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

function EmbedCard({ item, onDelete }: { item: ContentItem; onDelete: () => void }) {
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
      <ItemMeta item={item} onDelete={onDelete} />
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

function ItemMeta({ item, onDelete }: { item: ContentItem; onDelete: () => void }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: SP.sm, marginTop: SP.sm }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
          {item.tags.map((t) => {
            const c = TAG_COLORS[t] || { fg: T.hub, bg: T.hubBg };
            return <span key={t} style={{ ...TYPE.label, color: c.fg, background: c.bg, padding: "4px 8px", borderRadius: R.pill }}>{t}</span>;
          })}
        </div>
        <button
          type="button" onClick={onDelete} title="Remove"
          style={{ border: "none", background: "transparent", cursor: "pointer", color: T.grey5, padding: 4, flexShrink: 0 }}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <span style={{ ...TYPE.small, color: T.grey5, display: "block", marginTop: 4 }}>{item.addedBy || item.addedByEmail} · {fmtDate(item.createdAt)}</span>
    </>
  );
}

function SliderItem({ item, onDelete }: { item: ContentItem; onDelete: () => void }) {
  const embeddable = isEmbeddable(item);
  const width = item.type === "instagram" && embeddable ? 340 : item.type === "youtube" && embeddable ? 460 : 280;
  return (
    <div style={{ flex: "0 0 auto", width, scrollSnapAlign: "start" }}>
      {embeddable ? <EmbedCard item={item} onDelete={onDelete} /> : <ContentCard item={item} onDelete={onDelete} />}
    </div>
  );
}

function TypeSection({
  type, items, onViewAll, onDelete,
}: { type: ContentType; items: ContentItem[]; onViewAll: () => void; onDelete: (id: string) => void }) {
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
        <button
          type="button" onClick={onViewAll}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", ...TYPE.small, fontWeight: 700, color: T.hub, padding: 0 }}
        >
          View all <ArrowRight size={13} />
        </button>
      </div>
      <HScroller arrowTop={SECTION_MEDIA_HEIGHT[type] / 2}>
        {visible.map((item) => (
          <SliderItem key={item.id} item={item} onDelete={() => onDelete(item.id)} />
        ))}
      </HScroller>
    </div>
  );
}

function TypeAllView({
  type, items, onBack, onDelete,
}: { type: ContentType; items: ContentItem[]; onBack: () => void; onDelete: (id: string) => void }) {
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
              {isEmbeddable(item) ? <EmbedCard item={item} onDelete={() => onDelete(item.id)} /> : <ContentCard item={item} onDelete={() => onDelete(item.id)} />}
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

export function ContentHubPage({ user }: { user?: { displayName?: string | null; email?: string | null } | null }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db(), "contentHub"), orderBy("createdAt", "desc")))
      .then((snap) => setItems(snap.docs.map((d) => d.data() as ContentItem)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

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

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this item from the hub?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try { await deleteDoc(doc(db(), "contentHub", id)); } catch {}
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
            onClick={() => setShowAdd(true)}
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

        <div style={{ display: "flex", gap: SP.md, marginTop: SP.xl, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: SP.xs, background: T.grey2, borderRadius: R.pill, padding: 3 }}>
            {(["all", "instagram", "youtube", "blog", "website"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                style={{
                  border: "none", cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 600,
                  padding: "7px 14px", borderRadius: R.pill,
                  background: typeFilter === t ? T.white : "transparent",
                  color: typeFilter === t ? T.ink : T.grey6,
                  boxShadow: typeFilter === t ? SHADOW.hover : "none",
                }}
              >
                {t === "all" ? "All" : TYPE_META[t].label}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or note…"
            style={{
              fontFamily: T.font, fontSize: 13, padding: "8px 14px", borderRadius: R.pill,
              border: `1px solid ${T.grey4}`, background: T.white, color: T.ink, minWidth: 200,
            }}
          />

          <div style={{ display: "flex", gap: SP.xs, flexWrap: "wrap" }}>
            {TAGS.map((tag) => {
              const active = tagFilter.includes(tag);
              const c = TAG_COLORS[tag];
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTagFilter(tag)}
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
        </div>

        <div style={{ marginTop: SP.xxxl, display: "flex", flexDirection: "column", gap: SP.xxxl }}>
          {loading ? (
            <p style={{ ...TYPE.body, color: T.grey6 }}>Loading…</p>
          ) : baseFiltered.length === 0 ? (
            <EmptyState />
          ) : typeFilter === "all" ? (
            TYPE_ORDER.map((t) => (
              <TypeSection key={t} type={t} items={grouped[t]} onViewAll={() => setTypeFilter(t)} onDelete={handleDelete} />
            ))
          ) : (
            <TypeAllView type={typeFilter} items={grouped[typeFilter]} onBack={() => setTypeFilter("all")} onDelete={handleDelete} />
          )}
        </div>
      </div>

      {showAdd && (
        <AddContentModal
          user={user}
          onClose={() => setShowAdd(false)}
          onAdded={(item) => { setItems((prev) => [item, ...prev]); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

function ContentCard({ item, onDelete }: { item: ContentItem; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  const meta = TYPE_META[item.type];

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
        <div style={{ position: "relative", aspectRatio: "16 / 11", overflow: "hidden", background: T.grey2 }}>
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
  user, onClose, onAdded,
}: {
  user?: { displayName?: string | null; email?: string | null } | null;
  onClose: () => void;
  onAdded: (item: ContentItem) => void;
}) {
  const [type, setType] = useState<ContentType>("youtube");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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

  const handleSave = async () => {
    if (!url.trim() || !title.trim()) { setError("A URL and title are required."); return; }
    setSaving(true);
    const item: ContentItem = {
      id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type, url: url.trim(), title: title.trim(),
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      tags, note: note.trim() || undefined,
      addedBy: user?.displayName || "", addedByEmail: user?.email || "",
      createdAt: Date.now(),
    };
    try {
      // Firestore rejects fields explicitly set to `undefined` — strip them before writing.
      const docData = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined));
      await addDoc(collection(db(), "contentHub"), docData);
      onAdded(item);
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
          <h2 style={{ ...TYPE.h2, margin: 0 }}>Add content</h2>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TAGS.map((tag) => {
              const active = tags.includes(tag);
              const c = TAG_COLORS[tag];
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
          {saving ? "Saving…" : "Save to hub"}
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
