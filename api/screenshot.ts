import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// WebGL isn't needed for a static-page screenshot and costs startup time.
chromium.setGraphicsMode = false;

async function captureScreenshot(url: string, width: number) {
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
    defaultViewport: { width, height: 1000, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
    // Strip gwi.com's CookieYes consent banner (and its dimming overlay) plus
    // the hero video popup — neither should appear in QA screenshots.
    await page.evaluate(() => {
      document.querySelectorAll('.cky-consent-container, .cky-overlay, .cky-consent-bar, #gwi-hero-full-width-popup-id').forEach((el) => el.remove());
    }).catch(() => {});

    // Resize to the full page height *before* waiting — native `loading="lazy"`
    // images and scroll-triggered embeds (e.g. the Storylane product demo) only
    // fire once they're considered "in view". Scrolling through and back to the
    // top doesn't reliably work (images near the bottom lose "in view" status
    // again once scrolled away and never finish loading); resizing the viewport
    // once, to the full document height, keeps everything in view throughout.
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewport({ width, height: Math.min(fullHeight, 20000), deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 1200));
    await Promise.race([
      page.evaluate(() => Promise.all(
        [...document.querySelectorAll('img')].map((img) =>
          img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })
        )
      )),
      new Promise((r) => setTimeout(r, 6000)),
    ]).catch(() => {});

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const buffer = await page.screenshot({ type: 'jpeg', quality: 78, fullPage: true });
    return { buffer, height };
  } finally {
    await browser.close();
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let raw = (req.query?.url as string) || '';
  const width = Math.min(2560, Math.max(320, parseInt((req.query?.width as string) || '1440', 10) || 1440));
  if (!raw) return res.status(400).json({ error: 'url query param required' });
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  try {
    new URL(raw);
  } catch {
    return res.status(400).json({ error: 'Not a valid URL' });
  }

  try {
    const { buffer, height } = await Promise.race([
      captureScreenshot(raw, width),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Screenshot timed out after 45s')), 45000)),
    ]);
    const image = `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
    return res.json({ image, width, height });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to capture screenshot' });
  }
}
