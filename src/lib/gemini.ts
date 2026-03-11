import { GoogleGenerativeAI } from '@google/generative-ai';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';

let _genAI: GoogleGenerativeAI | null = null;

function getClient() {
  if (_genAI) return _genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

export function getChatModel() {
  return getClient().getGenerativeModel({ model: GEMINI_CHAT_MODEL });
}

/**
 * Generate content using Gemini CLI (primary)
 * Falls back to SDK if CLI fails
 */
export async function generateContent(prompt: string): Promise<string> {
  // Try CLI first (like Scholia)
  try {
    const { stdout } = await execFileAsync('gemini', ['-p', prompt], {
      cwd: process.cwd(),
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim();
  } catch (cliErr) {
    console.warn('Gemini CLI failed, falling back to SDK:', cliErr);
    
    // Fallback to SDK
    try {
      const model = getChatModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (sdkErr) {
      console.error('Both Gemini CLI and SDK failed:', sdkErr);
      throw new Error('Failed to generate content with Gemini');
    }
  }
}

/**
 * Generate alternatives for a verse
 */
function buildReferenceSection(references: string[] = []) {
  if (!references.length) return '';
  return `\n\nReference style material (for inspiration only; DO NOT copy lines verbatim):\n${references.join('\n\n')}\n\nRules: Keep output original, avoid direct copying, synthesize tone/imagery only.`;
}

export async function generateAlternatives(
  verse: string,
  count: number = 3,
  references: string[] = []
): Promise<string[]> {
  const prompt = `Generate ${count} alternative poetic lines in Czech that have similar meaning and structure to:

"${verse}"
${buildReferenceSection(references)}

Return only the alternatives, one per line, without numbering or quotes.`;

  const content = await generateContent(prompt);
  return content
    .split('\n')
    .filter(line => line.trim())
    .slice(0, count);
}

/**
 * Continue/extend the poem
 */
export async function continuePoem(
  existingText: string,
  style: string = 'similar',
  references: string[] = []
): Promise<string> {
  const prompt = `You are a Czech poetry assistant. Continue the following poem in a ${style} style. Generate 2-3 new lines that follow naturally.

Current poem:
${existingText}
${buildReferenceSection(references)}

Continue with 2-3 new lines:`;

  return generateContent(prompt);
}

/**
 * Generate chorus/refrain variants
 */
export async function generateChorus(
  mainTheme: string,
  lines: number = 2,
  references: string[] = []
): Promise<string> {
  const prompt = `Create a ${lines}-line poetic chorus/refrain in Czech about: "${mainTheme}"
${buildReferenceSection(references)}

The chorus should be memorable and singable.`;

  return generateContent(prompt);
}

export async function generateRhymeCandidates(
  rhymeEnding: string,
  contextText: string,
  references: string[] = [],
  count: number = 20
): Promise<string[]> {
  const prompt = `You are a Czech lyric-writing assistant.

Task:
Generate ${count} single-word Czech rhyme candidates for ending "${rhymeEnding}".
Use context from current draft and references to prefer semantically fitting words.

Current draft context:
${contextText}
${buildReferenceSection(references)}

Rules:
- Return only Czech words (single tokens), one per line
- No punctuation, no numbering
- Prioritize words that are singable and useful in song lyrics
- Avoid obvious duplicates
- Keep output original and context-aware`;

  const content = await generateContent(prompt);
  const unique = Array.from(
    new Set(
      content
        .split('\n')
        .map((w) => w.trim().toLowerCase())
        .map((w) => w.replace(/[^\p{L}-]/gu, ''))
        .filter(Boolean)
    )
  );

  return unique.slice(0, count);
}
