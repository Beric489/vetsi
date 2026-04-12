export const config = { runtime: 'edge' };

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No prompt provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You write job adverts for UK veterinary practices. Your adverts are warm, specific, and honest — written like a person, not a HR department.

STYLE RULES — follow these strictly:
- Never use corporate buzzwords: no "dynamic", "passionate", "fast-paced environment", "driven", "excited to offer", "competitive package"
- Never start a sentence with "We are looking for"
- Lead with what makes this practice genuinely different — not a generic job description
- The opening hook must be one sentence that would make a vet stop scrolling. It should capture something specific and real about the practice or location
- Include a sentence or two about the location of the practice — mention nearby towns, landscape, lifestyle. Make it feel like somewhere a vet would actually want to live
- Be specific over vague: "we see 40 consults a day" beats "busy practice". Use real numbers where available
- Write like a clinical lead wrote it, not an HR manager
- Bullet points are fine for the rota and benefits sections — but the body text should flow naturally in paragraphs
- Don't over-sell. Honest and specific is more attractive than enthusiastic and vague
- End with something that feels like a genuine invitation, not a call-to-action template

STRUCTURE — use this exact format:

[PRACTICE NAME] — [ROLE TYPE] Veterinary Surgeon

[One sentence opening hook — specific, real, makes a vet stop scrolling]

[One paragraph about the practice — what it is, where it is, what kind of place it is to work. Include location detail.]

[One paragraph about the caseload — what they'll actually see day to day. Be specific.]

[One paragraph about the team and culture — honest, not salesy. Mention team size, dynamics, support structures.]

[If RCVS accredited or notable equipment, mention it naturally here — not as a boast, just as context.]

The rota

[Bullet points — days, hours, flexibility]

Benefits

[Bullet points — list everything provided. Be complete.]

[One closing sentence or two — genuine, human, invites a conversation rather than a formal application]

EXAMPLE OF A GOOD ADVERT — match this quality, tone and level of specificity:

---
Orby Vets is a long-standing, single-site small animal practice based in the village of Orby, just outside Skegness. It's a great spot if you enjoy a bit of space and fresh air—close to the Lincolnshire coast and not far from the Wolds—so you get a nice mix of countryside and seaside without the crowds.

We're a busy first-opinion practice with a genuinely friendly team and a loyal client base that's still growing. Day-to-day, you'll see a varied caseload including cats, dogs, rabbits, and the occasional more unusual companion animal. The clinical team includes experienced vets, RVNs, and two student nurses, and there's a strong sense of teamwork across the practice.

We're an RCVS Core Standards accredited practice and take pride in maintaining a high standard of care without overcomplicating things. The clinic is well equipped, with recently upgraded ultrasound, digital radiography, multiparameter monitoring, and blood pressure monitoring. We handle a broad range of cases in-house—covering everything from routine procedures through to more involved work in areas like cardiology, dermatology, internal medicine, neurology, and orthopaedics. Out-of-hours is covered by a dedicated provider, so there's no OOH requirement.

The rota

• 4 x 10-hour shifts
• Monday to Friday, 8:30am–6:30pm (consult hours 9–6)
• Some flexibility with the working pattern depending on what works best

Benefits

• 6.6 weeks holiday including bank holidays
• Extra day off for your birthday
• Private medical insurance
• 24/7 Employee Assistance Programme
• Enhanced family-friendly policies
• £1,250 CPD allowance + 40 hours paid CPD leave (pro rata)
• Certificate support available
• Vetlexicon access
• BVA membership, VDS cover, and RCVS fees paid

If this sounds like it might be the right fit, reach out through vetsi — happy to have an informal chat before anything formal.
---

Now write a new advert using the practice details and role information provided. Do not copy the example — use it only as a guide for tone, structure and specificity. Write plain text only. No HTML, no markdown, no asterisks for bullet points — use • for bullets instead.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: error.error?.message || 'API error' }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
