/**
 * Guitar Key Detection
 * Uses Krumhansl-Schmuckler algorithm to detect key from chord progressions.
 */

import type { ParsedChord } from './chord-parser';

// Krumhansl-Schmuckler pitch class profiles (normalized)
// Index 0 = tonic, rotated per key
const KS_MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const KS_MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

// Intervals that make up each chord quality (semitones from root)
const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  diminished7: [0, 3, 6, 9],
  'half-diminished7': [0, 3, 6, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
  power: [0, 7],
};

function buildPitchClassVector(chords: ParsedChord[]): number[] {
  const pcv = new Array(12).fill(0);
  for (const chord of chords) {
    const intervals = CHORD_INTERVALS[chord.quality] ?? [0, 4, 7];
    for (const interval of intervals) {
      const pc = (chord.rootMidi + interval) % 12;
      pcv[pc] += 1;
    }
  }
  return pcv;
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0,
    denA = 0,
    denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA,
      db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  return denA === 0 || denB === 0 ? 0 : num / Math.sqrt(denA * denB);
}

export interface KeyCandidate {
  key: string; // e.g. 'C major', 'A minor'
  tonic: number; // 0–11
  mode: 'major' | 'minor';
  score: number; // Pearson r, higher = better fit
}

export function detectKey(chords: ParsedChord[]): KeyCandidate[] {
  if (chords.length === 0) return [];

  const pcv = buildPitchClassVector(chords);
  const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const candidates: KeyCandidate[] = [];

  for (let tonic = 0; tonic < 12; tonic++) {
    // Rotate PCV so pcv[0] = tonic pitch class
    const rotatedPcv = [...pcv.slice(tonic), ...pcv.slice(0, tonic)];

    const majorScore = pearsonCorrelation(rotatedPcv, KS_MAJOR_PROFILE);
    const minorScore = pearsonCorrelation(rotatedPcv, KS_MINOR_PROFILE);

    candidates.push(
      { key: `${NOTE_NAMES[tonic]} major`, tonic, mode: 'major', score: majorScore },
      { key: `${NOTE_NAMES[tonic]} minor`, tonic, mode: 'minor', score: minorScore }
    );
  }

  return candidates.sort((a, b) => b.score - a.score);
}

// Convenience: get single best guess
export function detectKeyBest(chords: ParsedChord[]): KeyCandidate | null {
  const candidates = detectKey(chords);
  return candidates[0] ?? null;
}
