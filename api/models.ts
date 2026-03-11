export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `HTTP ${response.status}`,
        detail: data
      });
    }

    // Return just the model IDs for easy reading
    const ids = (data?.data ?? []).map((m: any) => m.id);
    return res.status(200).json({ models: ids, raw: data });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to contact Anthropic' });
  }
}
