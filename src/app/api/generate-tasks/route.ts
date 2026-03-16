import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { levers, existingProjects, lang } = await req.json();

  const langInstruction = lang === 'es' ? '\n\nIMPORTANT: Respond entirely in Spanish for all task names, descriptions, and notes.' : '';

  const systemPrompt = `You are the strategic advisor inside LeverageOS. Analyze the user's lever portfolio and suggest concrete projects with subtasks.

Core formula: Effective Leverage = Rigidity × Length × Quality (multiplicative).
Three Fulcrums (order matters): Material → Epistemic → Relational.
Fulcrum statuses: verified, assumed, at_risk, absent.

Rules for task generation:
- Focus on the weakest fulcrums and sequence violations first
- Each project should address a specific strategic gap
- Subtasks should be concrete, actionable, and completable in 1-2 weeks
- Don't duplicate existing projects${langInstruction}`;

  const existingNames = (existingProjects || []).map((p: { name: string }) => p.name).join(', ');

  const userPrompt = `Here is the lever portfolio:
${JSON.stringify(levers, null, 2)}

${existingNames ? `Existing projects (don't duplicate): ${existingNames}` : 'No existing projects.'}

For each lever, suggest 1 project with 2-3 subtasks focused on the most critical gap. Return ONLY valid JSON:
{
  "projects": [
    {
      "leverIndex": 0,
      "name": "Project name",
      "description": "Why this matters strategically",
      "subtasks": [
        {"name": "Task name", "notes": "Brief guidance"}
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown fences.`;

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
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status} - ${errorText}` }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate tasks: ${message}` }, { status: 500 });
  }
}
