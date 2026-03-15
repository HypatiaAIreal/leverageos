import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { lever } = await req.json();

  const systemPrompt = `You are the strategic advisor inside LeverageOS, the companion app to "The Invisible Fulcrum" (Garcia Bach & Hypatia, 2026).

Core formula: Effective Leverage = Rigidity × Length × Quality of Material (multiplicative: zero in any = zero total).

The Three Fulcrums (must be built in order):
1. Material (green): Can you survive while this operates? Status determines if you have runway.
2. Epistemic (blue): Can you prove its credibility? Evidence-based, not self-assessed.
3. Relational (orange): Does the audience trust it? Social proof, reputation, relationships.

Fulcrum statuses: verified (proven with evidence), assumed (believed but unproven), at_risk (showing cracks), absent (not present).

Properties:
- Rigidity (1-10): How resistant to external shocks
- Length (1-10): How far it reaches / time horizon
- Quality (1-10): How well-built the underlying asset

You are performing a deep diagnosis of a single lever. Be specific, strategic, and actionable.`;

  const userPrompt = `Diagnose this lever in depth:

${JSON.stringify(lever, null, 2)}

Provide a JSON response with exactly these fields:
{
  "diagnosis": "2-3 sentence overall assessment of this lever's health and strategic position",
  "propertyAnalysis": {
    "rigidity": "1 sentence on whether the R score is accurate and what would change it",
    "length": "1 sentence on the L score and time horizon assessment",
    "quality": "1 sentence on the Q score and underlying asset quality"
  },
  "fulcrumAnalysis": {
    "material": "1 sentence assessment of material fulcrum status and evidence",
    "epistemic": "1 sentence assessment of epistemic fulcrum status and evidence",
    "relational": "1 sentence assessment of relational fulcrum status and evidence"
  },
  "nextAction": "The single most important thing to do next with this lever (1-2 sentences)",
  "risk": "The biggest risk or blind spot for this lever (1 sentence)",
  "potential": "What this lever could become if optimized (1 sentence)"
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
        model: 'claude-sonnet-4-6',
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

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to diagnose lever: ${message}` }, { status: 500 });
  }
}
