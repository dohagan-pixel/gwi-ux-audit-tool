const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Resolve a CSS font-size declaration to a desktop pixel value.
// Handles: 16px, 1.5rem, 1.2em (treated as rem at root), clamp(a, b, c) → c, calc — best-effort.
function resolveToPx(value: string, rootPx: number): number | null {
  const v = value.trim().toLowerCase().replace(/\s*!important\s*$/i, '');

  // clamp(min, preferred, max) → take the max for desktop sizing
  const clampM = v.match(/^clamp\s*\(([^,]+),([^,]+),([^)]+)\)$/);
  if (clampM) return resolveToPx(clampM[3], rootPx);

  // min(a, b) / max(a, b) → take first sensible numeric
  const minMaxM = v.match(/^(min|max)\s*\(([^)]+)\)$/);
  if (minMaxM) {
    const parts = minMaxM[2].split(',').map(s => resolveToPx(s, rootPx)).filter((n): n is number => n !== null);
    if (!parts.length) return null;
    return minMaxM[1] === 'min' ? Math.min(...parts) : Math.max(...parts);
  }

  // px
  const pxM = v.match(/^([\d.]+)\s*px$/);
  if (pxM) return parseFloat(pxM[1]);

  // rem / em (treat em as rem since we can't statically know parent context)
  const remM = v.match(/^([\d.]+)\s*(rem|em)$/);
  if (remM) return parseFloat(remM[1]) * rootPx;

  // pt
  const ptM = v.match(/^([\d.]+)\s*pt$/);
  if (ptM) return parseFloat(ptM[1]) * (96 / 72);

  // unitless number > 6 → assume px (some CSS does this)
  const nM = v.match(/^([\d.]+)$/);
  if (nM) {
    const n = parseFloat(nM[1]);
    return n > 6 ? n : null;
  }

  return null;
}

function selectorTargets(selectorRaw: string, target: 'h1' | 'h2' | 'body' | 'html'): boolean {
  // Lowercase, strip pseudos for matching
  const sel = selectorRaw.toLowerCase().replace(/::?[a-z-]+(\([^)]*\))?/g, '').trim();
  // Last simple selector token in compound selectors (e.g. ".hero h1" → "h1")
  const tokens = sel.split(/[\s>+~,]+/).filter(Boolean);
  const last = tokens[tokens.length - 1] || '';
  // Strip attribute/class/id suffixes from the last token to get the tag part
  const tagMatch = last.match(/^([a-z][a-z0-9]*)/);
  const tag = tagMatch ? tagMatch[1] : '';
  return tag === target;
}

async function fetchAllCss(url: string): Promise<{ html: string; css: string }> {
  const pageRes = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' } });
  if (!pageRes.ok) throw new Error(`Page returned HTTP ${pageRes.status}`);
  const html = await pageRes.text();
  const baseUrl = new URL(url);
  let css = '';

  // Inline <style> blocks
  for (const block of (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])) {
    css += block.replace(/<\/?style[^>]*>/gi, '') + '\n';
  }

  // Linked stylesheets — fetch up to 6 (font-size lives in main stylesheet usually)
  const linkTags = (html.match(/<link[^>]+>/gi) || []).filter(t => /rel=["']stylesheet["']/i.test(t)).slice(0, 6);
  await Promise.allSettled(linkTags.map(async tag => {
    const m = tag.match(/href=["']([^"']+)["']/i);
    if (!m) return;
    try {
      const cssUrl = m[1].startsWith('http') ? m[1] : new URL(m[1], baseUrl.origin).href;
      const r = await fetch(cssUrl, { headers: { 'User-Agent': UA } });
      if (r.ok) css += '\n' + await r.text();
    } catch { /* ignore */ }
  }));

  return { html, css };
}

function stripMediaQueries(css: string, allowMobileOnly = false): string {
  // Remove @media blocks that are *only* mobile so we don't pollute desktop sizing.
  // Conservative: leave non-media CSS + remove any @media with max-width < 1024.
  let out = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('@media', i)) {
      // Find the opening brace of this media query
      const braceStart = css.indexOf('{', i);
      if (braceStart < 0) break;
      const query = css.slice(i, braceStart);
      // Find matching closing brace
      let depth = 1; let j = braceStart + 1;
      while (j < css.length && depth > 0) {
        const ch = css[j];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        j++;
      }
      const maxWidth = query.match(/max-width:\s*(\d+)px/i);
      const minWidth = query.match(/min-width:\s*(\d+)px/i);
      // Keep this block if it's a desktop-only or wide query; drop pure mobile (max-width < 1024)
      const isMobileOnly = maxWidth && parseInt(maxWidth[1], 10) < 1024 && !minWidth;
      const isLargeOnly = minWidth && parseInt(minWidth[1], 10) >= 768 && !maxWidth;
      if (!isMobileOnly || allowMobileOnly) {
        // Include the inner content (without the @media wrapper) so its rules apply to desktop too
        out += css.slice(braceStart + 1, j - 1) + '\n';
      }
      i = j;
    } else {
      out += css[i];
      i++;
    }
  }
  return out;
}

function findRootPx(css: string): number {
  // Look for html { font-size: Xpx/Xrem/X% } — fallback 16
  const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  let root = 16;
  while ((m = ruleRe.exec(css)) !== null) {
    const sels = m[1].split(',').map(s => s.trim().toLowerCase());
    if (sels.some(s => s === 'html' || s === ':root')) {
      const fs = m[2].match(/font-size\s*:\s*([^;}]+)/i);
      if (fs) {
        const v = fs[1].trim();
        const pxM = v.match(/^([\d.]+)\s*px$/);
        if (pxM) root = parseFloat(pxM[1]);
        const pctM = v.match(/^([\d.]+)\s*%$/);
        if (pctM) root = (parseFloat(pctM[1]) / 100) * 16;
      }
    }
  }
  return root;
}

function findFontSizesFor(css: string, target: 'h1' | 'h2' | 'body', rootPx: number): number[] {
  const out: number[] = [];
  const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(css)) !== null) {
    const selectors = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const matchesTarget = selectors.some(s => selectorTargets(s, target));
    if (!matchesTarget) continue;
    const fsDecl = m[2].match(/font-size\s*:\s*([^;}]+)/i);
    if (!fsDecl) continue;
    const px = resolveToPx(fsDecl[1], rootPx);
    if (px !== null && px >= 6 && px <= 200) out.push(Math.round(px * 10) / 10);
  }
  return out;
}

// Strip @font-face blocks so their `font-family: 'Faktum'` declarations don't get counted as usage.
function stripFontFaceBlocks(css: string): string {
  let out = '';
  let i = 0;
  while (i < css.length) {
    if (/^@font-face/i.test(css.slice(i, i + 11))) {
      const braceStart = css.indexOf('{', i);
      if (braceStart < 0) break;
      let depth = 1, j = braceStart + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      i = j;
    } else {
      out += css[i];
      i++;
    }
  }
  return out;
}

function collectCssVariables(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(css)) !== null) {
    const sels = m[1].split(',').map(s => s.trim().toLowerCase());
    if (!sels.some(s => s === ':root' || s === 'html' || s === 'body' || s === '*')) continue;
    const declRe = /--([a-z0-9-]+)\s*:\s*([^;}]+)/gi;
    let dm: RegExpExecArray | null;
    while ((dm = declRe.exec(m[2])) !== null) {
      vars[dm[1].toLowerCase()] = dm[2].trim();
    }
  }
  return vars;
}

function resolveVarRefs(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 4) return value;
  return value.replace(/var\s*\(\s*--([a-z0-9-]+)(?:\s*,\s*([^)]+))?\s*\)/gi, (_, name, fallback) => {
    const v = vars[name.toLowerCase()];
    if (v) return resolveVarRefs(v, vars, depth + 1);
    if (fallback) return resolveVarRefs(fallback, vars, depth + 1);
    return '';
  });
}

const SYSTEM_FAMILIES = new Set([
  'sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-serif',
  'ui-monospace', 'cursive', 'fantasy', 'math', 'emoji', 'fangsong',
  'inherit', 'initial', 'unset', 'revert', 'currentcolor',
  'arial', 'helvetica', 'helvetica neue', 'times', 'times new roman', 'georgia',
  'verdana', 'tahoma', 'trebuchet ms', 'courier', 'courier new', 'lucida grande',
  'segoe ui', 'menlo', 'monaco', 'consolas', '-apple-system', 'blinkmacsystemfont',
  'sf pro', 'sf pro text', 'sf pro display', 'san francisco',
]);

function parseFontFamilyList(raw: string): string[] {
  // Split on top-level commas (font-family has no nested parens for families)
  const items = raw.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
  return items.filter(Boolean);
}

function isSystemFamily(name: string): boolean {
  return SYSTEM_FAMILIES.has(name);
}

function findFontFamilies(css: string, vars: Record<string, string>) {
  const primaryUses = new Map<string, number>(); // primary family → count
  const perTarget: Record<'h1' | 'h2' | 'body', string[]> = { h1: [], h2: [], body: [] };
  const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(css)) !== null) {
    const selectors = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const ffDecl = m[2].match(/font-family\s*:\s*([^;}]+)/i);
    const ffShorthand = !ffDecl ? m[2].match(/(?<!-)font\s*:\s*([^;}]+)/i) : null;
    let raw = ffDecl ? ffDecl[1] : ffShorthand ? ffShorthand[1] : null;
    if (!raw) continue;
    raw = resolveVarRefs(raw, vars).trim();
    // For shorthand `font: italic 700 16px/1.2 Faktum, sans-serif` — take the part after the last size/line-height
    if (ffShorthand && !ffDecl) {
      const afterSize = raw.split(/\d+(?:px|rem|em|%)(?:\s*\/\s*[^\s,]+)?/).pop();
      if (afterSize) raw = afterSize.trim();
    }
    const families = parseFontFamilyList(raw);
    if (!families.length) continue;
    const primary = families[0];
    if (!primary) continue;
    primaryUses.set(primary, (primaryUses.get(primary) || 0) + 1);
    for (const target of ['h1', 'h2', 'body'] as const) {
      if (selectors.some(s => selectorTargets(s, target))) {
        perTarget[target].push(primary);
      }
    }
  }
  const families = [...primaryUses.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  return { families, perTarget };
}

function weightToNumber(v: string): number | null {
  const t = v.trim().toLowerCase();
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  if (t === 'normal') return 400;
  if (t === 'bold') return 700;
  if (t === 'lighter') return 300;
  if (t === 'bolder') return 700;
  return null;
}

function findFontWeights(css: string, vars: Record<string, string>): Record<'h1' | 'h2' | 'body', number[]> {
  const out: Record<'h1' | 'h2' | 'body', number[]> = { h1: [], h2: [], body: [] };
  const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(css)) !== null) {
    const selectors = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const fwDecl = m[2].match(/font-weight\s*:\s*([^;}]+)/i);
    if (!fwDecl) continue;
    const raw = resolveVarRefs(fwDecl[1], vars).trim();
    const w = weightToNumber(raw);
    if (w == null) continue;
    for (const target of ['h1', 'h2', 'body'] as const) {
      if (selectors.some(s => selectorTargets(s, target))) {
        out[target].push(w);
      }
    }
  }
  return out;
}

function countH1Tags(html: string): number {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

function extractImages(html: string) {
  const urls: string[] = [];
  // Walk every <img> tag and capture both src and alt so we can audit alt text.
  let imgTotal = 0;
  let imgWithAlt = 0;
  let imgEmptyAlt = 0;
  let imgDescriptiveAlt = 0;
  for (const m of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = m[1];
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
    if (srcMatch) urls.push(srcMatch[1]);
    imgTotal++;
    if (altMatch) {
      imgWithAlt++;
      if (altMatch[1].trim().length === 0) imgEmptyAlt++;
      else imgDescriptiveAlt++;
    }
  }
  for (const m of html.matchAll(/<source[^>]+srcset=["']([^"']+)["']/gi)) {
    for (const candidate of m[1].split(',')) {
      const src = candidate.trim().split(/\s+/)[0];
      if (src) urls.push(src);
    }
  }
  // Also catch background-image URLs in inline styles (light scan; ignores stylesheets)
  for (const m of html.matchAll(/background(?:-image)?\s*:[^;"']*url\(["']?([^"')]+)/gi)) urls.push(m[1]);
  const extOf = (u: string) => {
    const clean = u.split('?')[0].split('#')[0];
    const ext = clean.split('.').pop()?.toLowerCase() || '';
    if (['svg','png','jpg','jpeg','webp','gif','avif'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
    if (clean.startsWith('data:image/svg')) return 'svg';
    if (clean.startsWith('data:image/png')) return 'png';
    if (clean.startsWith('data:image/jpeg') || clean.startsWith('data:image/jpg')) return 'jpg';
    if (clean.startsWith('data:image/webp')) return 'webp';
    if (clean.startsWith('data:image/gif')) return 'gif';
    return 'unknown';
  };
  const byExt: Record<string, number> = {};
  for (const u of urls) {
    const ext = extOf(u);
    byExt[ext] = (byExt[ext] || 0) + 1;
  }
  const samples: Record<string, string[]> = {};
  for (const u of urls.slice(0, 60)) {
    const ext = extOf(u);
    if (!samples[ext]) samples[ext] = [];
    if (samples[ext].length < 3) samples[ext].push(u);
  }
  return {
    total: urls.length,
    svg: byExt.svg || 0,
    png: byExt.png || 0,
    jpg: byExt.jpg || 0,
    webp: byExt.webp || 0,
    gif: byExt.gif || 0,
    avif: byExt.avif || 0,
    unknown: byExt.unknown || 0,
    byExtension: byExt,
    samples,
    altText: {
      total: imgTotal,
      withAlt: imgWithAlt,
      missing: imgTotal - imgWithAlt,
      empty: imgEmptyAlt,
      descriptive: imgDescriptiveAlt,
    },
  };
}

async function scanTypography(url: string) {
  const { html, css: rawCss } = await fetchAllCss(url);
  const desktopCss = stripMediaQueries(stripFontFaceBlocks(rawCss));
  const rootPx = findRootPx(desktopCss);
  const cssVars = collectCssVariables(desktopCss);

  const h1Sizes = findFontSizesFor(desktopCss, 'h1', rootPx);
  const h2Sizes = findFontSizesFor(desktopCss, 'h2', rootPx);
  const bodySizes = findFontSizesFor(desktopCss, 'body', rootPx);
  const h1Count = countH1Tags(html);
  const fontFamilies = findFontFamilies(desktopCss, cssVars);
  const fontWeights = findFontWeights(desktopCss, cssVars);
  const images = extractImages(html);

  const heroH1 = h1Sizes.length ? Math.max(...h1Sizes) : null;
  const dominantH2 = h2Sizes.length ? Math.max(...h2Sizes) : null;
  const bodyPx = bodySizes.length ? Math.min(...bodySizes) : (rootPx ? rootPx : null);

  return {
    rootPx,
    h1: { count: h1Count, sizes: h1Sizes, hero: heroH1, families: fontFamilies.perTarget.h1, weights: fontWeights.h1 },
    h2: { sizes: h2Sizes, dominant: dominantH2, families: fontFamilies.perTarget.h2, weights: fontWeights.h2 },
    body: { sizes: bodySizes, smallest: bodyPx, families: fontFamilies.perTarget.body, weights: fontWeights.body },
    fontFamilies: {
      all: fontFamilies.families,
      brandedOther: fontFamilies.families.filter(f => !isSystemFamily(f.name) && !/faktum/i.test(f.name)),
      hasFaktum: fontFamilies.families.some(f => /faktum/i.test(f.name)),
    },
    images,
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.query?.url as string;
  if (!url) return res.status(400).json({ error: 'url query param required' });

  try {
    const result = await Promise.race([
      scanTypography(url),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Scan timed out after 9s')), 9000)),
    ]);
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to scan page' });
  }
}
