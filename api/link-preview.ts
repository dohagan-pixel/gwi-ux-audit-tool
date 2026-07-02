const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

type Preview = { title: string; description: string; thumbnailUrl: string };

function isYouTube(url: string): boolean {
  return /(^|\.)youtube\.com\/watch/.test(url) || /youtu\.be\//.test(url);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function extractMeta(html: string, prop: string): string {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i');
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

async function fetchYouTubePreview(url: string): Promise<Preview> {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
  if (!res.ok) throw new Error(`oEmbed returned HTTP ${res.status}`);
  const data = await res.json();
  return {
    title: data.title || '',
    description: data.author_name ? `By ${data.author_name}` : '',
    thumbnailUrl: data.thumbnail_url || '',
  };
}

async function fetchGenericPreview(url: string): Promise<Preview> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' } });
  if (!res.ok) throw new Error(`Page returned HTTP ${res.status}`);
  const html = await res.text();
  const titleTag = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
  return {
    title: extractMeta(html, 'og:title') || decodeEntities(titleTag).trim(),
    description: extractMeta(html, 'og:description') || extractMeta(html, 'description'),
    thumbnailUrl: extractMeta(html, 'og:image'),
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.query?.url as string;
  if (!url) return res.status(400).json({ error: 'url query param required' });

  const empty: Preview = { title: '', description: '', thumbnailUrl: '' };
  try {
    const result = await Promise.race([
      isYouTube(url) ? fetchYouTubePreview(url) : fetchGenericPreview(url),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Preview fetch timed out after 8s')), 8000)),
    ]);
    return res.json(result);
  } catch {
    // Preview is a nice-to-have — fall back to manual entry rather than surfacing an error.
    return res.json(empty);
  }
}
