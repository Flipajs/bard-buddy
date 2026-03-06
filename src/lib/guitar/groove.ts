/**
 * Guitar Groove Patterns
 * Static library of groove patterns with metadata.
 * MVP: no audio processing, just metadata and ASCII notation.
 */

export type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4' | '12/8';
export type GrooveStyle = 'strumming' | 'fingerpicking' | 'arpeggio' | 'palm-mute' | 'hybrid';

// A single beat event
export interface StrokeEvent {
  beat: number; // beat number (1-based)
  subdivision: number; // 1 = on beat, 2 = "and", 3 = "e", 4 = "ah" (16th subdivisions)
  direction: 'D' | 'U' | '-'; // Down, Up, muted/dead
  accent: boolean;
}

export interface GroovePattern {
  id: string;
  name: string;
  timeSignature: TimeSignature;
  style: GrooveStyle;
  tempo: number; // BPM
  strokes: StrokeEvent[];
  description: string; // human-readable for the Czech UI
}

// Library of common patterns — expand as needed
export const GROOVE_LIBRARY: GroovePattern[] = [
  {
    id: 'basic-4-4-down',
    name: 'Základní 4/4',
    timeSignature: '4/4',
    style: 'strumming',
    tempo: 120,
    strokes: [
      { beat: 1, subdivision: 1, direction: 'D', accent: true },
      { beat: 2, subdivision: 1, direction: 'D', accent: false },
      { beat: 3, subdivision: 1, direction: 'D', accent: true },
      { beat: 4, subdivision: 1, direction: 'D', accent: false },
    ],
    description: 'Čtyři údery dolů – ideální pro začátečníky',
  },
  {
    id: 'pop-strum-4-4',
    name: 'Pop strum',
    timeSignature: '4/4',
    style: 'strumming',
    tempo: 120,
    strokes: [
      { beat: 1, subdivision: 1, direction: 'D', accent: true },
      { beat: 1, subdivision: 2, direction: 'U', accent: false },
      { beat: 2, subdivision: 1, direction: 'D', accent: false },
      { beat: 2, subdivision: 2, direction: 'U', accent: false },
      { beat: 3, subdivision: 1, direction: 'D', accent: true },
      { beat: 3, subdivision: 2, direction: 'U', accent: false },
      { beat: 4, subdivision: 1, direction: 'D', accent: false },
      { beat: 4, subdivision: 2, direction: 'U', accent: false },
    ],
    description: 'D-DU-DU – klasický pop rytmus',
  },
  {
    id: 'ballad-4-4',
    name: 'Balada',
    timeSignature: '4/4',
    style: 'strumming',
    tempo: 80,
    strokes: [
      { beat: 1, subdivision: 1, direction: 'D', accent: true },
      { beat: 2, subdivision: 2, direction: 'U', accent: false },
      { beat: 3, subdivision: 1, direction: 'D', accent: false },
      { beat: 3, subdivision: 2, direction: 'U', accent: false },
      { beat: 4, subdivision: 2, direction: 'U', accent: false },
    ],
    description: 'Pomalé DU-DU – pro baladické písně',
  },
  {
    id: 'waltz-3-4',
    name: 'Valčík 3/4',
    timeSignature: '3/4',
    style: 'strumming',
    tempo: 100,
    strokes: [
      { beat: 1, subdivision: 1, direction: 'D', accent: true },
      { beat: 2, subdivision: 1, direction: 'D', accent: false },
      { beat: 3, subdivision: 1, direction: 'D', accent: false },
    ],
    description: 'Tři doby – valčíkový rytmus',
  },
  {
    id: 'folk-6-8',
    name: 'Folk 6/8',
    timeSignature: '6/8',
    style: 'strumming',
    tempo: 90,
    strokes: [
      { beat: 1, subdivision: 1, direction: 'D', accent: true },
      { beat: 1, subdivision: 2, direction: 'D', accent: false },
      { beat: 1, subdivision: 3, direction: 'U', accent: false },
      { beat: 2, subdivision: 1, direction: 'D', accent: true },
      { beat: 2, subdivision: 2, direction: 'D', accent: false },
      { beat: 2, subdivision: 3, direction: 'U', accent: false },
    ],
    description: 'DDU DDU – šestiosminový folk rytmus',
  },
  {
    id: 'fingerpick-travis',
    name: 'Travis picking',
    timeSignature: '4/4',
    style: 'fingerpicking',
    tempo: 100,
    strokes: [
      { beat: 1, subdivision: 1, direction: 'D', accent: true }, // thumb bass
      { beat: 1, subdivision: 2, direction: 'U', accent: false }, // fingers
      { beat: 2, subdivision: 1, direction: 'D', accent: false }, // thumb
      { beat: 2, subdivision: 2, direction: 'U', accent: false },
      { beat: 3, subdivision: 1, direction: 'D', accent: true },
      { beat: 3, subdivision: 2, direction: 'U', accent: false },
      { beat: 4, subdivision: 1, direction: 'D', accent: false },
      { beat: 4, subdivision: 2, direction: 'U', accent: false },
    ],
    description: 'Travis picking – alternující bas s melodií',
  },
];

// Render groove to a compact ASCII notation string
// e.g. "D DU DU D" or with accents "D! DU DU D"
export function renderGrooveToAscii(pattern: GroovePattern): string {
  const strokes = pattern.strokes.map((s) => {
    const mark = s.direction === '-' ? 'x' : s.direction;
    return s.accent ? mark + '!' : mark;
  });
  return strokes.join(' ');
}

// Filter by time signature
export function getGroovesForTimeSignature(sig: TimeSignature): GroovePattern[] {
  return GROOVE_LIBRARY.filter((g) => g.timeSignature === sig);
}
