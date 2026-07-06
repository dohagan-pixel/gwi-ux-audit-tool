const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_PAGES = 40;

type Found = { url: string; label: string };

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function isPageLike(pathname: string): boolean {
  if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|json|xml|ico|woff2?|mp4|mov)$/i.test(pathname)) return false;
  if (/^\/(wp-admin|wp-content|wp-json|cdn-cgi|api)\//i.test(pathname)) return false;
  return true;
}

function extractLinks(html: string, block: string, baseOrigin: string): Found[] {
  const out: Found[] = [];
  for (const a of (block.match(/<a\b[^>]*href=["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [])) {
    const hrefM = a.match(/href=["']([^"']*)["']/i);
    if (!hrefM) continue;
    let href = hrefM[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    try {
      const abs = new URL(href, baseOrigin);
      if (abs.origin !== baseOrigin) continue;
      if (!isPageLike(abs.pathname)) continue;
      abs.hash = '';
      const label = stripTags(a) || abs.pathname;
      out.push({ url: abs.href, label: label.length > 60 ? label.slice(0, 57) + '…' : label });
    } catch {}
  }
  return out;
}

async function discoverFromNav(baseUrl: string): Promise<Found[]> {
  const res = await fetch(baseUrl, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' } });
  if (!res.ok) throw new Error(`Page returned HTTP ${res.status}`);
  const html = await res.text();
  const origin = new URL(baseUrl).origin;

  const found: Found[] = [];
  for (const tag of ['nav', 'header', 'footer']) {
    for (const block of (html.match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, 'gi')) || [])) {
      found.push(...extractLinks(html, block, origin));
    }
  }
  // Nothing in structural tags (some sites don't use them) — fall back to the whole page.
  if (found.length === 0) found.push(...extractLinks(html, html, origin));
  return found;
}

async function discoverFromSitemap(baseUrl: string): Promise<Found[]> {
  const origin = new URL(baseUrl).origin;
  const res = await fetch(`${origin}/sitemap.xml`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Sitemap returned HTTP ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => decodeEntities(m[1].trim()));
  const found: Found[] = [];
  for (const loc of locs) {
    try {
      const abs = new URL(loc);
      if (abs.origin !== origin) continue;
      if (!isPageLike(abs.pathname)) continue;
      // Prefer top-level / shallow pages as the "main pages" of the site.
      const depth = abs.pathname.split('/').filter(Boolean).length;
      if (depth > 1) continue;
      found.push({ url: abs.href, label: abs.pathname === '/' ? 'Home' : abs.pathname });
    } catch {}
  }
  return found;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let raw = (req.query?.url as string) || '';
  if (!raw) return res.status(400).json({ error: 'url query param required' });
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let base: URL;
  try { base = new URL(raw); } catch { return res.status(400).json({ error: 'Not a valid URL' }); }

  try {
    const result = await Promise.race([
      (async () => {
        const [navPages, sitemapPages] = await Promise.allSettled([
          discoverFromNav(base.href),
          discoverFromSitemap(base.href),
        ]);
        const combined: Found[] = [];
        if (navPages.status === 'fulfilled') combined.push(...navPages.value);
        if (sitemapPages.status === 'fulfilled') combined.push(...sitemapPages.value);
        // Always offer the homepage itself first.
        combined.unshift({ url: `${base.origin}/`, label: 'Home' });

        const seen = new Set<string>();
        const deduped: Found[] = [];
        for (const p of combined) {
          const key = p.url.replace(/\/$/, '');
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(p);
        }

        if (navPages.status === 'rejected' && sitemapPages.status === 'rejected') {
          throw new Error('Could not read navigation or sitemap for this site');
        }

        const truncated = deduped.length > MAX_PAGES;
        return { pages: deduped.slice(0, MAX_PAGES), truncated, totalFound: deduped.length };
      })(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Discovery timed out after 9s')), 9000)),
    ]);
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to discover pages' });
  }
}
