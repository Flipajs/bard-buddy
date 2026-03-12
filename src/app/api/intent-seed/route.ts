import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

function localIntentFallback(axes: Array<{ key: string; label: string; value: number }>) {
  const get = (key: string) => axes.find((a) => a.key === key)?.value ?? 5;
  const mood = get('mood');
  const depth = get('depth');
  const energy = get('energy');
  const intimacy = get('intimacy');

  const moodWord = mood >= 7 ? 'světlo' : mood <= 3 ? 'stín' : 'soumrak';
  const depthWord = depth >= 7 ? 'smysl' : depth <= 3 ? 'lehkost' : 'otázka';
  const energyWord = energy >= 7 ? 'tep' : energy <= 3 ? 'ticho' : 'puls';
  const intimacyWord = intimacy >= 7 ? 'my všichni' : intimacy <= 3 ? 'jen já' : 'my dva';

  return {
    themes: [
      `${moodWord} po bouři`,
      `${depthWord} mezi řádky`,
      `${energyWord} v nočním městě`,
      `hranice ${intimacyWord}`,
      `když se vrací hlas`
    ],
    seedLines: [
      `V tomhle tichu ještě slyším ${energyWord}.`,
      `Nesu v kapse ${moodWord}, i když padá déšť.`,
      `Mezi námi roste ${depthWord}, co nejde obejít.`,
      `${intimacyWord}, a přesto každý jiným krokem.`,
      `Možná je to začátek, ne konec.`
    ],
    titleIdeas: [
      `${moodWord} a tep`,
      `Mezi námi ${depthWord}`,
      `Noční ${energyWord}`
    ],
    source: 'local-fallback',
  };
}

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

    try {
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

      return NextResponse.json({ success: true, source: 'llm', ...parsed });
    } catch (llmError) {
      console.warn('Intent seed LLM failed, using local fallback:', llmError);
      return NextResponse.json({ success: true, ...localIntentFallback(axes) });
    }
  } catch (error) {
    console.error('Intent seed API fatal error:', error);
    return NextResponse.json({ success: true, ...localIntentFallback([{ key: 'mood', label: 'Smutný ↔ Veselý', value: 5 }]) });
  }
}
