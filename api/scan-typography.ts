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

function countH1Tags(html: string): number {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

async function scanTypography(url: string) {
  const { html, css: rawCss } = await fetchAllCss(url);
  const desktopCss = stripMediaQueries(rawCss);
  const rootPx = findRootPx(desktopCss);

  const h1Sizes = findFontSizesFor(desktopCss, 'h1', rootPx);
  const h2Sizes = findFontSizesFor(desktopCss, 'h2', rootPx);
  const bodySizes = findFontSizesFor(desktopCss, 'body', rootPx);
  const h1Count = countH1Tags(html);

  // Pick the largest h1 (likely hero) and smallest body size (worst case for the min-16 check)
  const heroH1 = h1Sizes.length ? Math.max(...h1Sizes) : null;
  const dominantH2 = h2Sizes.length ? Math.max(...h2Sizes) : null;
  const bodyPx = bodySizes.length ? Math.min(...bodySizes) : (rootPx ? rootPx : null);

  return {
    rootPx,
    h1: { count: h1Count, sizes: h1Sizes, hero: heroH1 },
    h2: { sizes: h2Sizes, dominant: dominantH2 },
    body: { sizes: bodySizes, smallest: bodyPx },
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
