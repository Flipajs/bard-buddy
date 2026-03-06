/**
 * Guitar Chord Parser
 * Parses chord symbols (Am, G, F#m, Bb7, etc.) into structured objects with MIDI pitch class.
 */

export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'dominant7'
  | 'major7'
  | 'minor7'
  | 'diminished7'
  | 'half-diminished7'
  | 'sus2'
  | 'sus4'
  | 'add9'
  | 'power';

export interface ParsedChord {
  root: string; // 'C', 'F#', 'Bb', etc.
  rootMidi: number; // 0–11 (C=0, C#=1, …, B=11)
  quality: ChordQuality;
  bassNote?: string; // for slash chords: Am/E → bassNote='E'
  bassNoteMidi?: number;
  raw: string; // original input
}

// Chromatic pitch class, using sharps as canonical
const NOTE_TO_MIDI: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const MIDI_TO_NOTE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Regex: root (C–B with optional #/b) + quality suffix + optional /bass
const CHORD_REGEX = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/;

const QUALITY_MAP: Array<[RegExp, ChordQuality]> = [
  [/^m(in)?7b5$|^ø7?$/, 'half-diminished7'],
  [/^dim7$|^°7$/, 'diminished7'],
  [/^dim$|^°$/, 'diminished'],
  [/^aug$|\+$/, 'augmented'],
  [/^maj7$|^M7$|^Δ$/, 'major7'],
  [/^m(in)?7$/, 'minor7'],
  [/^7$/, 'dominant7'],
  [/^m(in)?$/, 'minor'],
  [/^sus2$/, 'sus2'],
  [/^sus4?$/, 'sus4'],
  [/^add9$/, 'add9'],
  [/^5$/, 'power'],
  [/^(maj)?$/, 'major'], // empty suffix = major
];

export function parseChord(raw: string): ParsedChord | null {
  const trimmed = raw.trim();
  const match = CHORD_REGEX.exec(trimmed);
  if (!match) return null;

  const [, rootStr, qualitySuffix, bassStr] = match;

  const rootMidi = NOTE_TO_MIDI[rootStr];
  if (rootMidi === undefined) return null;

  let quality: ChordQuality = 'major';
  for (const [pattern, q] of QUALITY_MAP) {
    if (pattern.test(qualitySuffix)) {
      quality = q;
      break;
    }
  }

  const result: ParsedChord = {
    root: rootStr,
    rootMidi,
    quality,
    raw: trimmed,
  };

  if (bassStr) {
    const bassMidi = NOTE_TO_MIDI[bassStr];
    if (bassMidi !== undefined) {
      result.bassNote = bassStr;
      result.bassNoteMidi = bassMidi;
    }
  }

  return result;
}

export function midiToNote(midi: number): string {
  return MIDI_TO_NOTE[((midi % 12) + 12) % 12];
}

// Parse a line of chords: "Am G F E7"
export function parseChordsFromLine(line: string): ParsedChord[] {
  return line
    .trim()
    .split(/\s+/)
    .map(parseChord)
    .filter((c): c is ParsedChord => c !== null);
}
