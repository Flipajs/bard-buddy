// Czech linguistic metrics for poetry

const CZECH_VOWELS = /[aeiouáéíóúůyý]/gi;
const CZECH_LONG_VOWELS = /[áéíóúůý]/gi;

export interface LineMetrics {
  syllables: number;
  syllablesPerWord: number[];
  words: string[];
  rhymeEnding: string;
  stress: number[];
  singabilityScore: number;
}

/**
 * Count syllables in a Czech word
 * Simple approach: count vowel groups
 */
export function countSyllables(word: string): number {
  if (!word) return 0;
  const cleaned = word.replace(/[^\p{L}]/gu, '').toLowerCase();
  if (!cleaned) return 0;

  let count = 0;
  let inVowel = false;

  for (const char of cleaned) {
    const isVowel = CZECH_VOWELS.test(char);
    if (isVowel && !inVowel) {
      count++;
      inVowel = true;
    } else if (!isVowel) {
      inVowel = false;
    }
  }

  return Math.max(1, count);
}

/**
 * Analyze a single line of poetry
 */
export function analyzeLine(line: string): LineMetrics {
  const words = line.trim().split(/\s+/).filter(Boolean);
  const syllablesPerWord = words.map(countSyllables);
  const totalSyllables = syllablesPerWord.reduce((a, b) => a + b, 0);

  // Rhyme ending: last 2-3 characters (simplified)
  const lastWord = words[words.length - 1]?.toLowerCase() || '';
  const rhymeEnding = lastWord.slice(-3).replace(/[^\p{L}]/gu, '');

  // Stress: Czech stress is always on 1st syllable
  const stress = words.map(() => 1);

  // Singability: ideal vowel/consonant ratio ~0.45-0.55
  const text = line.toLowerCase();
  const vowelCount = (text.match(CZECH_VOWELS) || []).length;
  const consonantCount = text.replace(CZECH_VOWELS, '').replace(/[^a-z]/gi, '').length;
  const ratio = consonantCount > 0 ? vowelCount / (vowelCount + consonantCount) : 0.5;
  const singabilityScore = 1 - Math.abs(ratio - 0.45) * 2; // Ideal at 0.45

  return {
    syllables: totalSyllables,
    syllablesPerWord,
    words,
    rhymeEnding,
    stress,
    singabilityScore: Math.max(0, Math.min(1, singabilityScore)),
  };
}

/**
 * Detect rhymes between two lines
 */
export function detectRhyme(line1: string, line2: string): number {
  const metrics1 = analyzeLine(line1);
  const metrics2 = analyzeLine(line2);

  const ending1 = metrics1.rhymeEnding.toLowerCase();
  const ending2 = metrics2.rhymeEnding.toLowerCase();

  if (!ending1 || !ending2) return 0;

  // Simple similarity: how many chars match from the end
  let matches = 0;
  const minLen = Math.min(ending1.length, ending2.length);

  for (let i = 0; i < minLen; i++) {
    if (ending1[ending1.length - 1 - i] === ending2[ending2.length - 1 - i]) {
      matches++;
    } else {
      break;
    }
  }

  return matches / Math.max(ending1.length, ending2.length);
}

/**
 * Analyze entire poem text
 */
export function analyzePoem(text: string): LineMetrics[] {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(analyzeLine);
}

/**
 * Get rhyme pairs in poem
 */
export function findRhymePairs(
  text: string
): Array<{ line1: number; line2: number; similarity: number }> {
  const lines = text.split('\n').filter(line => line.trim());
  const pairs: Array<{ line1: number; line2: number; similarity: number }> = [];

  for (let i = 0; i < lines.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const similarity = detectRhyme(lines[i], lines[j]);
      if (similarity > 0.5) {
        pairs.push({ line1: i, line2: j, similarity });
      }
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity);
}
