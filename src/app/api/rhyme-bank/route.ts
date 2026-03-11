import { NextRequest, NextResponse } from 'next/server';
import { generateRhymeCandidates } from '@/lib/gemini';

export const runtime = 'nodejs';

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

    const referenceTexts = (references || []).map(
      (r) => `### ${r.title || 'Reference'}${r.author ? ` — ${r.author}` : ''}\n${r.content}`
    );

    const candidates = await generateRhymeCandidates(
      rhymeEnding.trim().toLowerCase(),
      text || '',
      referenceTexts,
      20
    );

    return NextResponse.json({ success: true, rhymeEnding, candidates });
  } catch (error) {
    console.error('Rhyme bank API error:', error);
    return NextResponse.json({ error: 'Failed to build rhyme bank' }, { status: 500 });
  }
}
