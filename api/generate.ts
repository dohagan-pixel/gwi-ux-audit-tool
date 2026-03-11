export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, max_tokens, images } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const hasImages = Array.isArray(images) && images.length > 0;

  // claude-sonnet-4-6 is the latest Claude Sonnet (Feb 2026) — excellent quality + vision support.
  const model = 'claude-sonnet-4-6';
  const effectiveMaxTokens = Math.min(max_tokens || 1000, 4096);

  // Build message content — Anthropic uses base64 source objects for images
  const messageContent = hasImages
    ? [
        { type: 'text', text: prompt },
        ...images.map((img: { dataUrl: string }) => {
          const commaIdx = img.dataUrl.indexOf(',');
          const header = img.dataUrl.slice(0, commaIdx);
          const b64data = img.dataUrl.slice(commaIdx + 1);
          const mediaType = header.split(':')[1].split(';')[0]; // e.g. "image/jpeg"
          return {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: b64data }
          };
        })
      ]
    : prompt;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: effectiveMaxTokens,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = `HTTP ${response.status} — ${data?.error?.message || data?.error?.type || JSON.stringify(data)}`;
      return res.status(500).json({ error: errMsg });
    }

    const text = data?.content?.[0]?.text ?? '';
    return res.status(200).json({ content: [{ text }] });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to contact AI service' });
  }
}
