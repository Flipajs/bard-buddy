/**
 * Guitar Mode Public API
 * Combines all guitar lib modules into a single interface.
 */

import { parseChordsFromLine } from './chord-parser';
import { detectKeyBest, type KeyCandidate } from './key-detection';
import { suggestChords, type ChordSuggestion, type Mood } from './chord-suggestions';
import { GROOVE_LIBRARY, type GroovePattern, renderGrooveToAscii, getGroovesForTimeSignature } from './groove';
import { renderProgressionAsTab } from './tab-parser';

export interface GuitarModeResult {
  detectedKey: KeyCandidate | null;
  suggestions: ChordSuggestion[];
  grooves: GroovePattern[];
  tabPreview: string;
}

export function analyzeGuitarLine(
  chordLine: string,
  mood: Mood = 'neutral',
  timeSignature: '4/4' | '3/4' | '6/8' | '2/4' | '12/8' = '4/4'
): GuitarModeResult {
  const chords = parseChordsFromLine(chordLine);
  const key = detectKeyBest(chords);

  const suggestions = key ? suggestChords(key.tonic, key.mode, mood) : [];

  const grooves = getGroovesForTimeSignature(timeSignature);

  const tabPreview = renderProgressionAsTab(suggestions.slice(0, 4).map((s) => s.symbol));

  return { detectedKey: key, suggestions, grooves, tabPreview };
}

// Re-export types for components
export type { Mood, ChordSuggestion, KeyCandidate, GroovePattern };
export { renderGrooveToAscii };
