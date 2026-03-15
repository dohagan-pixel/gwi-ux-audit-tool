// Vercel Edge Function — streams Anthropic response back in real-time,
// bypassing the 10-second serverless timeout entirely.
export const config = { runtime: 'edge' };

// Models tried in descending quality order — first one that doesn't 404 wins
const MODEL_PRIORITY = [
  'claude-opus-4-5-20251001',        // Best: Opus 4.5
  'claude-3-5-sonnet-20241022',      // Fallback: 3.5 Sonnet (known reliable)
  'claude-haiku-4-5-20251001',       // Last resort: Haiku 4.5 (confirmed available)
];

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { prompt, max_tokens, images } = body;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  const hasImages = Array.isArray(images) && images.length > 0;
  const effectiveMaxTokens = Math.min(max_tokens || 16000, 16000);

  const messageContent = hasImages
    ? [
        { type: 'text', text: prompt },
        ...images.map((img: { dataUrl: string }) => {
          const commaIdx = img.dataUrl.indexOf(',');
          const header = img.dataUrl.slice(0, commaIdx);
          const b64data = img.dataUrl.slice(commaIdx + 1);
          const mediaType = header.split(':')[1].split(';')[0];
          return { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64data } };
        })
      ]
    : prompt;

  // Try each model in priority order — skip on 404, stop on first success or non-404 error
  let anthropicRes: Response | null = null;
  let lastErr = '';
  for (const model of MODEL_PRIORITY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: effectiveMaxTokens,
        stream: true,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    if (res.ok) {
      anthropicRes = res;
      break;
    }

    const errData = await res.json() as any;
    lastErr = `HTTP ${res.status} — ${errData?.error?.message || errData?.error?.type || JSON.stringify(errData)}`;

    // 404 = model not available for this key — try the next one
    if (res.status === 404) continue;

    // Any other error (auth, rate limit, bad request) — stop immediately
    return new Response(JSON.stringify({ error: lastErr }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!anthropicRes) {
    return new Response(JSON.stringify({ error: lastErr || 'No available model found' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Pipe Anthropic SSE → client SSE, forwarding only text delta chunks
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    const reader = anthropicRes!.body!.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as any;
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ t: parsed.delta.text })}\n\n`));
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch (e: any) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no'
    }
  });
}
