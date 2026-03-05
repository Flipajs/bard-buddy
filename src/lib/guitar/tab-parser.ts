/**
 * Guitar Tab Parser & Renderer
 * Renders chord shapes as ASCII tab notation.
 * MVP: generation from chord symbols only (not raw tab parsing).
 */

export interface TabNote {
  string: number; // 1 = high e, 6 = low E
  fret: number | 'x' | 'o'; // x=mute, o=open (fret 0)
  technique?: 'h' | 'p' | 'b' | '/' | '\\' | '~';
  // h=hammer-on, p=pull-off, b=bend, /=slide up, \=slide down, ~=vibrato
}

export interface TabChord {
  notes: TabNote[]; // 6 entries, one per string
  label?: string; // optional chord name above the tab
}

const STRING_ORDER = ['e', 'B', 'G', 'D', 'A', 'E']; // high to low

// Standard open chord shapes (fret 0 = open, -1 = muted)
export const CHORD_SHAPES: Record<string, number[]> = {
  // [e, B, G, D, A, E] high to low
  C: [0, 1, 0, 2, 3, -1],
  Am: [0, 1, 2, 2, 0, -1],
  G: [3, 3, 0, 0, 2, 3],
  Em: [0, 0, 0, 2, 2, 0],
  D: [2, 3, 2, 0, -1, -1],
  Dm: [1, 3, 2, 0, -1, -1],
  E: [0, 0, 1, 2, 2, 0],
  F: [1, 1, 2, 3, 3, 1], // barre
  Fm: [1, 1, 1, 3, 3, 1],
  A: [0, 2, 2, 2, 0, -1],
  A7: [0, 2, 0, 2, 0, -1],
  B7: [0, 2, 1, 2, 2, -1],
  Bm: [2, 3, 4, 4, 2, -1],
  'F#m': [2, 2, 2, 4, 4, 2],
  'C#m': [4, 4, 4, 6, 6, 4],
  B: [2, 4, 4, 4, 2, -1],
  'C#': [4, 6, 6, 6, 4, -1],
};

// Render a chord shape as horizontal tab (standard tab format)
export function chordToHorizontalTab(symbol: string): string | null {
  const shape = CHORD_SHAPES[symbol];
  if (!shape) return null;

  return STRING_ORDER.map((str, i) => {
    const fret = shape[i];
    const fretStr = fret === -1 ? 'x' : String(fret);
    return `${str}|--${fretStr}--|`;
  }).join('\n');
}

// Render a chord shape as vertical diagram
export function chordToVerticalDiagram(symbol: string): string | null {
  const shape = CHORD_SHAPES[symbol];
  if (!shape) return null;

  const lines = shape.map((fret, i) => {
    const fretStr = fret === -1 ? 'x' : String(fret);
    return `${STRING_ORDER[i]}: ${fretStr}`;
  });
  return lines.join('\n');
}

// Render chord shapes for a sequence of chord symbols as ASCII tab block
export function renderProgressionAsTab(symbols: string[]): string {
  const shapes = symbols
    .map((s) => ({ symbol: s, shape: CHORD_SHAPES[s] }))
    .filter((s) => s.shape !== null);

  if (shapes.length === 0) return '(no shapes found)';

  return STRING_ORDER.map((str, stringIdx) => {
    const cells = shapes.map(({ symbol, shape }) => {
      const fret = shape![stringIdx];
      const fretStr = fret === -1 ? 'x' : String(fret);
      // Pad for alignment
      return `--${fretStr.padEnd(Math.max(fretStr.length, symbol.length))}--`;
    });
    return `${str}|${cells.join('|')}|`;
  }).join('\n');
}
