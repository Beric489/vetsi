export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `You are an expert veterinary recruitment copywriter. Write a compelling, honest job advert for a UK veterinary practice. Use markdown formatting with ## for section headers. Be warm, specific and human — avoid corporate clichés. Keep it to 400-500 words.\n\n${prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return new Response(JSON.stringify({ advert: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const config = {
  path: '/api/generate-advert'
};
