'use client';

import { useState, useEffect, useRef } from 'react';
import type { Mood, ChordSuggestion, KeyCandidate, GroovePattern } from '@/lib/guitar';
import { renderGrooveToAscii } from '@/lib/guitar';

interface GuitarPanelProps {
  onChordLineChange?: (line: string) => void;
}

interface GuitarModeResult {
  detectedKey: KeyCandidate | null;
  suggestions: ChordSuggestion[];
  grooves: GroovePattern[];
  tabPreview: string;
}

const MOOD_LABELS: Record<Mood, string> = {
  happy: '😊 Veselá',
  sad: '😢 Smutná',
  tense: '😤 Napjatá',
  epic: '🎬 Epická',
  romantic: '💕 Romantická',
  dark: '🌙 Temná',
  neutral: '⚪ Neutrální',
};

export function GuitarPanel({ onChordLineChange }: GuitarPanelProps) {
  const [chordLine, setChordLine] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');
  const [result, setResult] = useState<GuitarModeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce fetch on chordLine change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!chordLine.trim()) {
      setResult(null);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/guitar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chordLine: chordLine.trim(), mood }),
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
        } else {
          console.error('Guitar API error:', response.status);
          setResult(null);
        }
      } catch (error) {
        console.error('Guitar fetch error:', error);
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [chordLine, mood]);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Title */}
      <div className="text-lg font-bold border-b pb-2">Kytarový režim</div>

      {/* Chord input */}
      <div>
        <label className="block text-sm font-medium mb-2">Akordy (oddělené mezerou)</label>
        <textarea
          value={chordLine}
          onChange={(e) => {
            setChordLine(e.target.value);
            onChordLineChange?.(e.target.value);
          }}
          placeholder="Am G F E7"
          className="w-full h-20 p-2 border rounded font-mono text-sm resize-none"
        />
      </div>

      {/* Mood selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Nálada</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MOOD_LABELS) as Mood[]).map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`py-2 px-3 rounded text-sm font-medium transition ${
                mood === m
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Analyzuji...</div>}

      {result && (
        <>
          {/* Detected key */}
          {result.detectedKey && (
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm font-medium mb-2">Zjištěná tónina</div>
              <div className="flex items-baseline gap-2">
                <div className="font-bold text-lg">{result.detectedKey.key}</div>
                <div className="text-xs text-gray-600">
                  skóre: {(result.detectedKey.score * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* Chord suggestions */}
          {result.suggestions.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-sm font-medium mb-2">Navrhované akordy</div>
              <div className="space-y-2">
                {result.suggestions.map((chord, idx) => (
                  <div key={idx} className="bg-green-50 p-2 rounded">
                    <div className="flex items-baseline gap-2">
                      <div className="font-bold">{chord.symbol}</div>
                      <div className="text-xs text-gray-600">{chord.degree}</div>
                    </div>
                    <div className="w-full bg-gray-200 h-1 rounded mt-1">
                      <div
                        className="bg-green-500 h-1 rounded"
                        style={{ width: `${chord.moodFit * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab preview */}
          {result.tabPreview && result.tabPreview !== '(no shapes found)' && (
            <div className="border-t pt-3">
              <div className="text-sm font-medium mb-2">Tabulatura (náhled)</div>
              <pre className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto">
                {result.tabPreview}
              </pre>
            </div>
          )}

          {/* Groove patterns */}
          {result.grooves.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-sm font-medium mb-2">Rytmické vzory</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {result.grooves.slice(0, 4).map((groove) => (
                  <div key={groove.id} className="bg-purple-50 p-2 rounded">
                    <div className="font-medium text-sm">{groove.name}</div>
                    <div className="text-xs text-gray-600">{groove.description}</div>
                    <pre className="text-xs font-mono mt-1 text-gray-700">
                      {renderGrooveToAscii(groove)}
                    </pre>
                    <div className="text-xs text-gray-500 mt-1">{groove.tempo} BPM</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
