import { NextRequest, NextResponse } from 'next/server';
import {
  generateAlternatives,
  continuePoem,
  generateChorus,
} from '@/lib/gemini';

export const runtime = 'nodejs';

type AssistMode = 'alternatives' | 'continuation' | 'chorus';

export async function POST(req: NextRequest) {
  try {
    const { text, mode, theme } = (await req.json()) as {
      text: string;
      mode: AssistMode;
      theme?: string;
    };

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!['alternatives', 'continuation', 'chorus'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use: alternatives, continuation, or chorus' },
        { status: 400 }
      );
    }

    let result: string | string[] = '';

    if (mode === 'alternatives') {
      result = await generateAlternatives(text, 3);
    } else if (mode === 'continuation') {
      result = await continuePoem(text);
    } else if (mode === 'chorus') {
      result = await generateChorus(theme || text);
    }

    return NextResponse.json({
      success: true,
      mode,
      result,
    });
  } catch (error) {
    console.error('Assist API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
