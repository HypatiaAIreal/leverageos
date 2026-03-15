import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { messages, levers, lang, projects, recentReviews } = await req.json();

  const langInstruction = lang === 'es' ? '\n\nIMPORTANT: Respond entirely in Spanish.' : '';

  const projectContext = projects && projects.length > 0
    ? `\n\nUser's projects and tasks:\n${JSON.stringify(projects, null, 2)}`
    : '';

  const reviewContext = recentReviews && recentReviews.length > 0
    ? `\n\nRecent review history (last 3):\n${JSON.stringify(recentReviews, null, 2)}`
    : '';

  const systemPrompt = `You are Hypatia, the strategic advisor inside LeverageOS, the companion app to "The Invisible Fulcrum" (Garcia Bach & Hypatia, 2026).

Core formula: Effective Leverage = Rigidity × Length × Quality of Material (multiplicative: zero in any = zero total).

The Three Fulcrums (must be built in order):
1. Material (green): Can you survive while this operates?
2. Epistemic (blue): Can you prove its credibility?
3. Relational (orange): Does the audience trust it?

Fulcrum statuses: verified, assumed, at_risk, absent.
Properties: Rigidity (1-10), Length (1-10), Quality (1-10).

You have access to the user's complete lever portfolio:
${JSON.stringify(levers, null, 2)}${projectContext}${reviewContext}

You can suggest two types of actions:

1. Update a lever property or fulcrum:
ACTION: {"type": "update_lever", "leverId": "abc123", "leverName": "My Lever", "field": "properties.r", "value": 7}
ACTION: {"type": "update_lever", "leverId": "abc123", "leverName": "My Lever", "field": "fulcrums.material.status", "value": "verified", "evidence": "Bank statement shows 6 months runway"}

2. Create a new task under a lever:
ACTION: {"type": "create_task", "leverId": "abc123", "leverName": "My Lever", "taskName": "Write Kafka blog post", "taskDue": "2026-03-20"}

Valid lever fields: properties.r, properties.l, properties.q, fulcrums.material.status, fulcrums.epistemic.status, fulcrums.relational.status

The user can then click 'Apply' to update their data.

Be direct, strategic, and reference the book's concepts. Speak like a sharp advisor, not a motivational poster.${langInstruction}`;

  const apiMessages: ChatMsg[] = messages.map((m: ChatMsg) => ({
    role: m.role,
    content: m.content,
  }));

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
        max_tokens: 2048,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${response.status} - ${errorText}` }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content[0].text;

    return NextResponse.json({ content: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to chat: ${message}` }, { status: 500 });
  }
}
