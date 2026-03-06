'use client';

import { useMemo, useState } from 'react';
import { analyzePoem, findRhymePairs } from '@/lib/czech-metrics';

interface Version {
  id: number;
  content: string;
  created_at: number;
}

interface ComparePanelProps {
  versions: Version[];
}

function summarize(content: string) {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const metrics = analyzePoem(content);
  const avgSyllables =
    metrics.length > 0
      ? metrics.reduce((acc, line) => acc + line.syllables, 0) / metrics.length
      : 0;
  const avgSingability =
    metrics.length > 0
      ? metrics.reduce((acc, line) => acc + line.singabilityScore, 0) / metrics.length
      : 0;
  const rhymePairs = findRhymePairs(content).length;

  return {
    lines: lines.length,
    avgSyllables,
    avgSingability,
    rhymePairs,
  };
}

export default function ComparePanel({ versions }: ComparePanelProps) {
  const [leftId, setLeftId] = useState<number | null>(versions[0]?.id ?? null);
  const [rightId, setRightId] = useState<number | null>(versions[1]?.id ?? versions[0]?.id ?? null);

  const left = useMemo(() => versions.find((v) => v.id === leftId), [versions, leftId]);
  const right = useMemo(() => versions.find((v) => v.id === rightId), [versions, rightId]);

  const leftS = useMemo(() => (left ? summarize(left.content) : null), [left]);
  const rightS = useMemo(() => (right ? summarize(right.content) : null), [right]);

  if (versions.length < 1) {
    return <div className="text-xs text-gray-400">Zatím nejsou verze pro porovnání.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">Varianta A</span>
          <select
            className="border rounded p-1"
            value={leftId ?? ''}
            onChange={(e) => setLeftId(Number(e.target.value))}
          >
            {versions.map((v, idx) => (
              <option key={v.id} value={v.id}>
                V{versions.length - idx} ({new Date(v.created_at).toLocaleTimeString('cs-CZ')})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-gray-600">Varianta B</span>
          <select
            className="border rounded p-1"
            value={rightId ?? ''}
            onChange={(e) => setRightId(Number(e.target.value))}
          >
            {versions.map((v, idx) => (
              <option key={v.id} value={v.id}>
                V{versions.length - idx} ({new Date(v.created_at).toLocaleTimeString('cs-CZ')})
              </option>
            ))}
          </select>
        </label>
      </div>

      {leftS && rightS && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-gray-200 p-2 bg-white">
            <div className="font-semibold text-gray-800 mb-1">A</div>
            <div>Řádky: {leftS.lines}</div>
            <div>Slabiky/řádek: {leftS.avgSyllables.toFixed(1)}</div>
            <div>Zpěvnost: {(leftS.avgSingability * 100).toFixed(0)}%</div>
            <div>Rým páry: {leftS.rhymePairs}</div>
          </div>
          <div className="rounded border border-gray-200 p-2 bg-white">
            <div className="font-semibold text-gray-800 mb-1">B</div>
            <div>Řádky: {rightS.lines}</div>
            <div>Slabiky/řádek: {rightS.avgSyllables.toFixed(1)}</div>
            <div>Zpěvnost: {(rightS.avgSingability * 100).toFixed(0)}%</div>
            <div>Rým páry: {rightS.rhymePairs}</div>
          </div>
        </div>
      )}

      {left && right && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <pre className="rounded border border-gray-200 bg-gray-50 p-2 overflow-x-auto max-h-40">{left.content}</pre>
          <pre className="rounded border border-gray-200 bg-gray-50 p-2 overflow-x-auto max-h-40">{right.content}</pre>
        </div>
      )}
    </div>
  );
}
