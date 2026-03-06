/**
 * Chord Suggestions
 * Diatonic chord system with mood/emotion filtering.
 */

import { midiToNote } from './chord-parser';
import type { ChordQuality } from './chord-parser';

// Diatonic intervals: [root offset, quality] for each scale degree
// Major scale: W W H W W W H
const MAJOR_DIATONIC: [number, ChordQuality][] = [
  [0, 'major'], // I
  [2, 'minor'], // ii
  [4, 'minor'], // iii
  [5, 'major'], // IV
  [7, 'major'], // V
  [9, 'minor'], // vi
  [11, 'diminished'], // vii°
];

// Natural minor scale: W H W W H W W
const MINOR_DIATONIC: [number, ChordQuality][] = [
  [0, 'minor'], // i
  [2, 'diminished'], // ii°
  [3, 'major'], // III
  [5, 'minor'], // iv
  [7, 'minor'], // v (natural minor)
  [8, 'major'], // VI
  [10, 'major'], // VII
];

// Harmonic minor substitution: raise 7th → V becomes dominant7
const HARMONIC_MINOR_OVERRIDES: Partial<Record<number, ChordQuality>> = {
  4: 'dominant7', // degree index 4 (v) → V7
};

export type Mood = 'happy' | 'sad' | 'tense' | 'epic' | 'romantic' | 'dark' | 'neutral';

// Degree indices (0-based into diatonic array) preferred per mood
const MOOD_DEGREE_WEIGHTS: Record<Mood, number[]> = {
  happy: [0, 3, 4, 1], // I IV V ii — bright, resolved
  sad: [0, 5, 3, 1], // i VI iv ii° — minor-heavy, descending
  tense: [6, 4, 2, 5], // vii° V iii vi — leading tone, dominant pull
  epic: [0, 4, 5, 3], // I/i V/v VI IV — cinematic, all strong
  romantic: [0, 5, 3, 1], // I vi IV ii — common pop/ballad
  dark: [0, 6, 5, 2], // i vii° VI III — minor + diminished
  neutral: [0, 1, 2, 3, 4, 5, 6],
};

export interface ChordSuggestion {
  root: string;
  quality: ChordQuality;
  symbol: string; // e.g. 'Am', 'G7', 'Bdim'
  degree: string; // e.g. 'I', 'ii', 'V7'
  moodFit: number; // 0–1
}

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  dominant7: '7',
  major7: 'maj7',
  minor7: 'm7',
  diminished7: 'dim7',
  'half-diminished7': 'ø7',
  sus2: 'sus2',
  sus4: 'sus4',
  add9: 'add9',
  power: '5',
};

const DEGREE_NAMES_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const DEGREE_NAMES_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

export function getDiatonicChords(
  tonicMidi: number,
  mode: 'major' | 'minor',
  useHarmonicMinor = true
): ChordSuggestion[] {
  const template = mode === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC;
  const degreeNames = mode === 'major' ? DEGREE_NAMES_MAJOR : DEGREE_NAMES_MINOR;

  return template.map(([offset, baseQuality], i) => {
    const rootMidi = (tonicMidi + offset) % 12;
    const root = midiToNote(rootMidi);

    // Apply harmonic minor override if applicable
    let quality = baseQuality;
    if (mode === 'minor' && useHarmonicMinor && HARMONIC_MINOR_OVERRIDES[i] !== undefined) {
      quality = HARMONIC_MINOR_OVERRIDES[i]!;
    }

    const symbol = `${root}${QUALITY_SUFFIX[quality]}`;
    return { root, quality, symbol, degree: degreeNames[i], moodFit: 1 };
  });
}

export function suggestChords(
  tonicMidi: number,
  mode: 'major' | 'minor',
  mood: Mood,
  count = 4
): ChordSuggestion[] {
  const diatonic = getDiatonicChords(tonicMidi, mode);
  const degreeWeights = MOOD_DEGREE_WEIGHTS[mood];

  // Score each diatonic chord by mood preference
  const scored = diatonic.map((chord, idx) => {
    const weightPos = degreeWeights.indexOf(idx);
    const moodFit =
      weightPos === -1
        ? 0.2 // low but non-zero — still a valid chord, just less preferred
        : 1 - weightPos / degreeWeights.length;
    return { ...chord, moodFit };
  });

  return scored.sort((a, b) => b.moodFit - a.moodFit).slice(0, count);
}
