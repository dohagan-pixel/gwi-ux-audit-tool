const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function normalizeHex(hex: string): string {
  const h = hex.replace('#','').toUpperCase();
  if(h.length===3) return '#'+h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return '#'+h.slice(0,6);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function isValidDisplayColor(hex: string): boolean {
  // Filter out pure black/white/transparent as they're noise
  const h = hex.toUpperCase();
  return h !== '#000000' && h !== '#FFFFFF' && h !== '#FFF' && h !== '#000';
}

function extractColorsFromValue(value: string): string[] {
  const out: string[] = [];
  // Hex
  for(const m of (value.match(/#[0-9a-fA-F]{3,6}\b/g)||[])) out.push(normalizeHex(m));
  // RGB/RGBA
  for(const m of (value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)||[])){
    const n=m.match(/\d+/g)!;
    out.push(rgbToHex(+n[0],+n[1],+n[2]));
  }
  return out;
}

async function scanPage(url: string) {
  const pageRes = await fetch(url, { headers:{'User-Agent':UA,'Accept':'text/html,application/xhtml+xml'} });
  if(!pageRes.ok) throw new Error(`Page returned HTTP ${pageRes.status}`);
  const html = await pageRes.text();
  const baseUrl = new URL(url);
  let allCss = '';

  // Inline <style> blocks
  for(const block of (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)||[])){
    allCss += block.replace(/<[^>]+>/g,'') + '\n';
  }

  // Linked stylesheets — fetch up to 4
  const linkTags = (html.match(/<link[^>]+>/gi)||[]).filter(t=>/rel=["']stylesheet["']/i.test(t)).slice(0,4);
  await Promise.allSettled(linkTags.map(async tag => {
    const m = tag.match(/href=["']([^"']+)["']/i);
    if(!m) return;
    try {
      const cssUrl = m[1].startsWith('http') ? m[1] : new URL(m[1], baseUrl.origin).href;
      const r = await fetch(cssUrl, { headers:{'User-Agent':UA} });
      if(r.ok) allCss += await r.text();
    } catch {}
  }));

  // Inline style attributes
  for(const m of (html.match(/style=["'][^"']+["']/gi)||[])) allCss += m + ';';

  // Parse color/background declarations
  const textColors = new Map<string,number>();
  const bgColors   = new Map<string,number>();
  const re = /(^|[{;,\s])(color|background(?:-color)?|fill|stroke)\s*:\s*([^;}{]+)/gi;
  let m: RegExpExecArray|null;
  while((m=re.exec(allCss))!==null){
    const prop = m[2].toLowerCase();
    const colors = extractColorsFromValue(m[3]);
    for(const c of colors){
      if(prop==='color'||prop==='fill') textColors.set(c,(textColors.get(c)||0)+1);
      else bgColors.set(c,(bgColors.get(c)||0)+1);
    }
  }

  // Sort by frequency, filter noise, return top 12 each
  const sort = (m: Map<string,number>) =>
    [...m.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]).filter(isValidDisplayColor).slice(0,12);

  // Also return all colors (union) for reference
  const allColors = sort(new Map([...textColors,...bgColors].reduce((acc,[k,v])=>{
    acc.set(k,(acc.get(k)||0)+v); return acc;
  }, new Map<string,number>())));

  return { textColors: sort(textColors), bgColors: sort(bgColors), allColors };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin','*');
  const url = req.query?.url as string;
  if(!url) return res.status(400).json({error:'url query param required'});

  try {
    const result = await Promise.race([
      scanPage(url),
      new Promise<never>((_,rej)=>setTimeout(()=>rej(new Error('Scan timed out after 9s')),9000))
    ]);
    return res.json(result);
  } catch(e: any) {
    return res.status(500).json({error: e?.message||'Failed to scan page'});
  }
}
