'use client';

import { useEffect, useMemo, useState } from 'react';
import { analyzePoem, findRhymePairs } from '@/lib/czech-metrics';
import BranchTimelineView from '@/components/BranchTimelineView';
import ComparePanel from '@/components/ComparePanel';

interface Version {
  id: number;
  content: string;
  created_at: number;
}

interface VariantSidebarProps {
  poemId?: number;
  onRestore?: (content: string) => void;
}

function summarize(content: string) {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const words = content
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean);

  const metrics = analyzePoem(content);
  const avgSingability =
    metrics.length > 0
      ? metrics.reduce((acc, line) => acc + line.singabilityScore, 0) / metrics.length
      : 0;
  const avgSyllables =
    metrics.length > 0
      ? metrics.reduce((acc, line) => acc + line.syllables, 0) / metrics.length
      : 0;
  const rhymePairs = findRhymePairs(content).length;

  return {
    lines: lines.length,
    words: words.length,
    avgSingability,
    avgSyllables,
    rhymePairs,
  };
}

type VariantViewMode = 'list' | 'timeline' | 'compare';

export default function VariantSidebar({ poemId, onRestore }: VariantSidebarProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<VariantViewMode>('list');

  const fetchVersions = async () => {
    if (!poemId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-versions', poemId }),
      });

      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        if (!selectedVersionId && data.versions?.length) {
          setSelectedVersionId(data.versions[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVersions();
    const interval = setInterval(fetchVersions, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemId]);

  const selected = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) || versions[0],
    [versions, selectedVersionId]
  );

  const selectedSummary = useMemo(
    () => (selected ? summarize(selected.content) : null),
    [selected]
  );

  if (!poemId) {
    return <div className="p-4 text-sm text-gray-400">Nejprve vytvoř text pro varianty.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-sm text-gray-700">Variant Explorer (MVP)</h3>
        <p className="text-xs text-gray-500 mt-1">
          Rychlý výběr verze + metriky pro porovnání.
        </p>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        {selectedSummary ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-gray-200 bg-white p-2">
              <div className="text-gray-500">Řádky</div>
              <div className="font-semibold text-gray-800">{selectedSummary.lines}</div>
            </div>
            <div className="rounded border border-gray-200 bg-white p-2">
              <div className="text-gray-500">Slova</div>
              <div className="font-semibold text-gray-800">{selectedSummary.words}</div>
            </div>
            <div className="rounded border border-gray-200 bg-white p-2">
              <div className="text-gray-500">Slabiky/řádek</div>
              <div className="font-semibold text-gray-800">{selectedSummary.avgSyllables.toFixed(1)}</div>
            </div>
            <div className="rounded border border-gray-200 bg-white p-2">
              <div className="text-gray-500">Zpěvnost</div>
              <div className="font-semibold text-gray-800">
                {(selectedSummary.avgSingability * 100).toFixed(0)}%
              </div>
            </div>
            <div className="rounded border border-gray-200 bg-white p-2 col-span-2">
              <div className="text-gray-500">Rýmové páry</div>
              <div className="font-semibold text-gray-800">{selectedSummary.rhymePairs}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Vyber variantu.</div>
        )}
      </div>

      <div className="px-4 pt-3 border-b border-gray-200 flex gap-2">
        {([
          ['list', 'Seznam'],
          ['timeline', 'Strom'],
          ['compare', 'Porovnání'],
        ] as Array<[VariantViewMode, string]>).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`text-xs px-2 py-1 rounded ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <div className="text-xs text-gray-500">Načítám varianty...</div>}

        {!loading && versions.length === 0 && (
          <div className="text-xs text-gray-400">Zatím nejsou uložené varianty.</div>
        )}

        {viewMode === 'list' && versions.map((version, index) => {
          const active = selected?.id === version.id;
          return (
            <button
              key={version.id}
              onClick={() => setSelectedVersionId(version.id)}
              className={`w-full text-left rounded border p-2 text-xs transition-colors ${
                active
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800">Varianta {versions.length - index}</span>
                {index === 0 && <span className="text-[10px] text-green-700">nejnovější</span>}
              </div>
              <div className="text-gray-600 line-clamp-2 mb-1">{version.content || '(prázdné)'}</div>
              <div className="text-[10px] text-gray-500">
                {new Date(version.created_at).toLocaleTimeString('cs-CZ')}
              </div>

              <div className="mt-2">
                <span
                  role="button"
                  tabIndex={0}
                  className="text-[11px] text-blue-700 hover:text-blue-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore?.(version.content);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRestore?.(version.content);
                    }
                  }}
                >
                  ↳ otevřít v editoru
                </span>
              </div>
            </button>
          );
        })}

        {viewMode === 'timeline' && (
          <BranchTimelineView
            versions={versions}
            selectedId={selectedVersionId}
            onSelect={setSelectedVersionId}
          />
        )}

        {viewMode === 'compare' && <ComparePanel versions={versions} />}
      </div>
    </div>
  );
}
