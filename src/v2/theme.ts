// GWI UX Platform — V2 design tokens
// A lighter, more spacious system than v1. Built on the GWI brand
// (Faktum, Hot Pink hero) but with restrained colour, generous space,
// and far fewer hard-bordered boxes.

export const T = {
  // ── Brand ──────────────────────────────────────────────
  pink: "#FF0077",
  pinkDark: "#DC1F69",
  pinkBg: "#FFE8EE",
  pinkTint: "rgba(255,0,119,0.06)",

  // ── Ink / neutrals (cool grey scale) ───────────────────
  ink: "#0E1116",        // near-black, primary text
  inkSoft: "#2A3447",
  grey7: "#526482",      // secondary text
  grey6: "#6B7A99",
  grey5: "#ABB8CF",      // muted / placeholder
  grey4: "#D7E0F0",      // hairlines
  grey3: "#E6ECF7",
  grey2: "#EFF3FA",      // soft fills
  grey1: "#F6F8FC",      // app background
  white: "#FFFFFF",

  // ── Semantic ───────────────────────────────────────────
  pass: "#008851",
  passBg: "rgba(0,136,81,0.10)",
  flag: "#DA3441",
  flagBg: "rgba(218,52,65,0.10)",
  warn: "#B8770A",
  warnBg: "rgba(246,194,109,0.18)",
  info: "#0369A1",
  infoBg: "#E0F2FE",

  // ── Module accents (each top-level module gets one) ─────
  audit: "#5461C8",      // violet
  auditBg: "rgba(84,97,200,0.10)",
  qa: "#FF0077",         // hot pink
  qaBg: "#FFE8EE",
  hub: "#0E9384",        // teal
  hubBg: "rgba(14,147,132,0.10)",

  font: "Faktum, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

// Spacing scale (px) — use these instead of ad-hoc numbers.
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, huge: 64 } as const;

// Radii
export const R = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

// Type scale — { size, weight, tracking, line-height }
export const TYPE = {
  hero:    { fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02 },
  h1:      { fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em",  lineHeight: 1.08 },
  h2:      { fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
  h3:      { fontSize: 19, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.3 },
  lede:    { fontSize: 18, fontWeight: 400, letterSpacing: 0, lineHeight: 1.6 },
  body:    { fontSize: 15, fontWeight: 400, letterSpacing: 0, lineHeight: 1.6 },
  small:   { fontSize: 13, fontWeight: 500, letterSpacing: 0, lineHeight: 1.5 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, lineHeight: 1 },
  label:   { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, lineHeight: 1 },
} as const;

// Elevation — used sparingly; default is no shadow, lift on hover.
export const SHADOW = {
  none: "none",
  hover: "0 8px 30px rgba(14,17,22,0.08)",
  pop: "0 12px 40px rgba(14,17,22,0.12)",
} as const;

export const MAXW = 1120; // content container width
