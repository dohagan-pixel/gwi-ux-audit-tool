export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, max_tokens, images } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const hasImages = Array.isArray(images) && images.length > 0;
  const model = hasImages ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';
  const messageContent = hasImages
    ? [
        { type: 'text', text: prompt },
        ...images.map((img: { dataUrl: string }) => ({
          type: 'image_url',
          image_url: { url: img.dataUrl }
        }))
      ]
    : prompt;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: max_tokens || 1000,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    const text = data?.choices?.[0]?.message?.content ?? '';
    // Return in Anthropic-compatible shape so the frontend needs no changes
    return res.status(200).json({ content: [{ text }] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to contact AI service' });
  }
}
