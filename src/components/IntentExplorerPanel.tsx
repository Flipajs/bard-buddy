'use client';

import { useMemo, useState } from 'react';

interface RefItem {
  id: number;
  title: string;
  author: string;
  content: string;
}

interface IntentExplorerPanelProps {
  references?: RefItem[];
  onInsert?: (text: string) => void;
}

const DEFAULT_AXES = [
  { key: 'mood', label: 'Smutný ↔ Veselý', value: 5 },
  { key: 'depth', label: 'Odlehčený ↔ Filozofický', value: 5 },
  { key: 'energy', label: 'Klidný ↔ Energický', value: 5 },
  { key: 'intimacy', label: 'Osobní ↔ Univerzální', value: 5 },
];

export default function IntentExplorerPanel({ references = [], onInsert }: IntentExplorerPanelProps) {
  const [axes, setAxes] = useState(DEFAULT_AXES);
  const [loading, setLoading] = useState(false);
  const [themes, setThemes] = useState<string[]>([]);
  const [seedLines, setSeedLines] = useState<string[]>([]);
  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);

  const topRefs = useMemo(() => references.slice(0, 3), [references]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intent-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axes, references: topRefs }),
      });
      if (!res.ok) {
        const e = await res.json();
        alert(e.error || 'Intent generation failed');
      } else {
        const data = await res.json();
        setThemes(data.themes || []);
        setSeedLines(data.seedLines || []);
        setTitleIdeas(data.titleIdeas || []);
      }
    } catch (e) {
      console.error(e);
      alert('Intent generation failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h3 className="text-sm font-bold text-gray-700 mb-2">O čem ten song bude? (beta)</h3>
      <p className="text-xs text-gray-500 mb-3">Nastav semantický prostor a nech si vygenerovat seed témata + první verše.</p>

      <div className="space-y-3 mb-4">
        {axes.map((a, idx) => (
          <label key={a.key} className="block text-xs">
            <div className="flex justify-between text-gray-600 mb-1">
              <span>{a.label}</span>
              <span>{a.value}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={a.value}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAxes((prev) => prev.map((x, i) => (i === idx ? { ...x, value: v } : x)));
              }}
              className="w-full"
            />
          </label>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full mb-4 px-3 py-2 rounded bg-indigo-600 text-white text-sm disabled:bg-gray-400"
      >
        {loading ? 'Hledám seed...' : 'Najít téma + seed'}
      </button>

      {titleIdeas.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 mb-1">Názvy</div>
          <div className="flex flex-wrap gap-1">
            {titleIdeas.map((t) => (
              <button key={t} onClick={() => onInsert?.(t)} className="text-[11px] px-2 py-0.5 rounded border bg-gray-50">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {themes.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 mb-1">Témata</div>
          <div className="space-y-1">
            {themes.map((t) => (
              <button key={t} onClick={() => onInsert?.(t)} className="w-full text-left text-xs p-2 rounded border bg-gray-50 hover:bg-gray-100">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {seedLines.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-1">Seed verše</div>
          <div className="space-y-1">
            {seedLines.map((s) => (
              <button key={s} onClick={() => onInsert?.(s)} className="w-full text-left text-xs p-2 rounded border bg-indigo-50 border-indigo-200 hover:bg-indigo-100">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
