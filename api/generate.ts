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
  const model = 'claude-3-5-sonnet-20241022';
  const effectiveMaxTokens = Math.min(max_tokens || 1000, 8192);

  // Build message content — Anthropic uses base64 source objects for images
  const messageContent = hasImages
    ? [
        { type: 'text', text: prompt },
        ...images.map((img: { dataUrl: string }) => {
          const [header, data] = img.dataUrl.split(',');
          const mediaType = header.split(':')[1].split(';')[0]; // e.g. "image/jpeg"
          return {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data }
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
      return res.status(500).json({ error: data.error?.message || 'Anthropic API error' });
    }

    // Response shape matches what the frontend already expects
    const text = data?.content?.[0]?.text ?? '';
    return res.status(200).json({ content: [{ text }] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to contact AI service' });
  }
}
