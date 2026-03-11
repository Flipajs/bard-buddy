import { NextRequest, NextResponse } from 'next/server';
import { generateRhymeCandidates } from '@/lib/gemini';

export const runtime = 'nodejs';

function normalizeCsTail(w: string): string {
  const tail = w.slice(-4).toLowerCase();
  const deaccent = tail
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ch/g, 'x');
  return deaccent
    .replace(/[dt]$/g, 'T')
    .replace(/[sz]$/g, 'S')
    .replace(/[bp]$/g, 'P');
}

function normalizeEnTail(w: string): string {
  const tail = w.slice(-4);
  const vowelsNorm = tail.replace(/[aeiouy]/g, 'V');
  const lastConsonant = [...tail].reverse().find((c) => !'aeiouy'.includes(c)) || '';
  return `${vowelsNorm}|${lastConsonant}`;
}

function detectLikelyLang(text: string): 'cs' | 'en' {
  return /[áéěíóúůýčďňřšťž]/i.test(text) ? 'cs' : 'en';
}

function fallbackCandidates(rhymeEnding: string, text: string, refs: string[]): string[] {
  const ending = rhymeEnding.toLowerCase();
  const minTail = ending.length >= 3 ? ending.slice(-3) : ending;
  const tail2 = minTail.slice(-2);
  const corpus = [text, ...refs].join('\n').toLowerCase();
  const lang = detectLikelyLang(corpus + ' ' + ending);

  const words = corpus
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean)
    .filter((w) => w.length >= 3);

  const direct = words.filter((w) => w.endsWith(minTail));

  const targetNorm =
    lang === 'cs'
      ? normalizeCsTail(minTail.padStart(4, minTail))
      : normalizeEnTail(minTail.padStart(4, minTail));

  const near = words.filter((w) => {
    if (w.endsWith(minTail)) return false;
    if (w.slice(-2) === tail2) return true;
    return (lang === 'cs' ? normalizeCsTail(w) : normalizeEnTail(w)) === targetNorm;
  });

  const unique = Array.from(new Set([...direct, ...near]));
  return unique.slice(0, 30);
}

export async function POST(req: NextRequest) {
  try {
    const { rhymeEnding, text, references } = (await req.json()) as {
      rhymeEnding: string;
      text: string;
      references?: Array<{ title?: string; author?: string; content: string }>;
    };

    if (!rhymeEnding?.trim()) {
      return NextResponse.json({ error: 'rhymeEnding is required' }, { status: 400 });
    }

    const cleanEnding = rhymeEnding.trim().toLowerCase();
    const referenceTexts = (references || []).map(
      (r) => `### ${r.title || 'Reference'}${r.author ? ` — ${r.author}` : ''}\n${r.content}`
    );

    const llmPromise = generateRhymeCandidates(
      cleanEnding,
      text || '',
      referenceTexts,
      30
    );

    const timeoutPromise = new Promise<string[]>((resolve) => {
      setTimeout(() => {
        resolve(fallbackCandidates(cleanEnding, text || '', referenceTexts));
      }, 12000);
    });

    const candidates = await Promise.race([llmPromise, timeoutPromise]);

    return NextResponse.json({ success: true, rhymeEnding: cleanEnding, candidates });
  } catch (error) {
    console.error('Rhyme bank API error:', error);
    return NextResponse.json({ error: 'Failed to build rhyme bank' }, { status: 500 });
  }
}
