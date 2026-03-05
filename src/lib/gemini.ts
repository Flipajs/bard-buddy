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
export async function generateAlternatives(
  verse: string,
  count: number = 3
): Promise<string[]> {
  const prompt = `Generate ${count} alternative poetic lines in Czech that have similar meaning and structure to:

"${verse}"

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
  style: string = 'similar'
): Promise<string> {
  const prompt = `You are a Czech poetry assistant. Continue the following poem in a ${style} style. Generate 2-3 new lines that follow naturally.

Current poem:
${existingText}

Continue with 2-3 new lines:`;

  return generateContent(prompt);
}

/**
 * Generate chorus/refrain variants
 */
export async function generateChorus(
  mainTheme: string,
  lines: number = 2
): Promise<string> {
  const prompt = `Create a ${lines}-line poetic chorus/refrain in Czech about: "${mainTheme}"

The chorus should be memorable and singable.`;

  return generateContent(prompt);
}
