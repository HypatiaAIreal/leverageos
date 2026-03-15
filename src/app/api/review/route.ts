import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { levers } = await req.json();

  const systemPrompt = `You are the strategic advisor inside LeverageOS, the companion app to "The Invisible Fulcrum" (Garcia Bach & Hypatia, 2026).

Core formula: Effective Leverage = Rigidity × Length × Quality of Material (multiplicative: zero in any = zero total).

The Three Fulcrums (must be built in this order):
1. Material (green): Can you survive while this operates?
2. Epistemic (blue): Can you prove its credibility?
3. Relational (orange): Does the audience trust it?

Fulcrum statuses: verified, assumed, at_risk, absent.

You are performing a weekly review of the user's leverage system. Be direct, strategic, and reference the book's concepts. Speak like a sharp advisor, not a motivational poster.`;

  const userPrompt = `Here is the user's current lever portfolio:

${JSON.stringify(levers, null, 2)}

Analyze this system and provide a JSON response with exactly these fields:
{
  "quickWin": "The single most impactful action they could take this week (1-2 sentences)",
  "bottleneck": "The biggest constraint limiting their overall leverage (1-2 sentences)",
  "sequenceAlerts": ["Array of any sequence violations or order concerns"],
  "fulcrumTraps": ["Array of any fulcrum traps - e.g., building on assumptions, relational without epistemic backing"],
  "celebration": "One genuine thing worth celebrating in their system (1 sentence)"
}

Return ONLY valid JSON, no markdown fences or other text.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${response.status} - ${errorText}` }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the JSON from Claude's response
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to get review: ${message}` }, { status: 500 });
  }
}
