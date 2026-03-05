/**
 * POST /api/guitar
 * Analyze guitar chord line for key detection, chord suggestions, groove patterns, and tab preview.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeGuitarLine, type Mood } from '@/lib/guitar';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { chordLine, mood = 'neutral', timeSignature = '4/4' } = await req.json();

    if (!chordLine || typeof chordLine !== 'string') {
      return NextResponse.json({ error: 'chordLine is required' }, { status: 400 });
    }

    const result = analyzeGuitarLine(chordLine.trim(), mood as Mood, timeSignature as any);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Guitar API error:', error);
    return NextResponse.json({ error: 'Failed to analyze guitar chords' }, { status: 500 });
  }
}
