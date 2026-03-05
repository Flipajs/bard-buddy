import { NextRequest, NextResponse } from 'next/server';
import { analyzePoem, findRhymePairs } from '@/lib/czech-metrics';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const metrics = analyzePoem(text);
    const rhymes = findRhymePairs(text);

    return NextResponse.json({
      success: true,
      lines: metrics,
      rhymePairs: rhymes,
      summary: {
        totalLines: metrics.length,
        totalSyllables: metrics.reduce((acc, m) => acc + m.syllables, 0),
        avgSyllablesPerLine: metrics.length > 0
          ? Math.round(metrics.reduce((acc, m) => acc + m.syllables, 0) / metrics.length)
          : 0,
        avgSingability: metrics.length > 0
          ? (metrics.reduce((acc, m) => acc + m.singabilityScore, 0) / metrics.length).toFixed(2)
          : 0,
      },
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze metrics' },
      { status: 500 }
    );
  }
}
