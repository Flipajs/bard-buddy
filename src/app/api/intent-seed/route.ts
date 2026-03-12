import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { axes, references } = (await req.json()) as {
      axes: Array<{ key: string; label: string; value: number }>;
      references?: Array<{ title?: string; author?: string; content: string }>;
    };

    if (!axes?.length) {
      return NextResponse.json({ error: 'axes are required' }, { status: 400 });
    }

    const axesText = axes
      .map((a) => `- ${a.label}: ${a.value}/10`)
      .join('\n');

    const refsText = (references || [])
      .slice(0, 3)
      .map((r) => `### ${r.title || 'Reference'}${r.author ? ` — ${r.author}` : ''}\n${r.content}`)
      .join('\n\n');

    const prompt = `Jsi kreativní asistent pro psaní textů k hudbě.

Uživatel má hotovou hudbu a hledá seed pro text.
Vstupní semantické osy (1-10):
${axesText}

${refsText ? `Reference stylu (jen inspirace, nekopírovat):\n${refsText}` : ''}

Vrať JSON s tímto tvarem:
{
  "themes": ["...", "...", "...", "...", "..."],
  "seedLines": ["...", "...", "...", "...", "..."],
  "titleIdeas": ["...", "...", "..."]
}

Pravidla:
- Čeština
- seedLines max 1 řádek každá
- Konkrétní, ne generické
- Žádné markdown, pouze validní JSON`;

    const raw = await generateContent(prompt);

    let parsed: {
      themes: string[];
      seedLines: string[];
      titleIdeas: string[];
    } | null = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error('Intent seed API error:', error);
    return NextResponse.json({ error: 'Failed to generate intent seeds' }, { status: 500 });
  }
}
