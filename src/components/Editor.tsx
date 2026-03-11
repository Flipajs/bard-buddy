'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzePoem } from '@/lib/czech-metrics';

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave?: (title: string, content: string) => void;
  onSavingChange?: (saving: boolean) => void;
}

export default function Editor({
  initialTitle = 'Untitled',
  initialContent = '',
  onSave,
  onSavingChange,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [lines, setLines] = useState<string[]>(() => {
    const split = initialContent.split('\n');
    return split.length ? split : [''];
  });
  const [saving, setSaving] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lineInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const latestTitleRef = useRef(title);
  const latestContentRef = useRef('');
  const latestOnSaveRef = useRef(onSave);
  const latestOnSavingChangeRef = useRef(onSavingChange);

  const hasEditedRef = useRef(false);
  const dirtyRef = useRef(false);
  const saveInFlightRef = useRef(false);

  const content = useMemo(() => lines.join('\n'), [lines]);
  const docSignature = useMemo(() => `${title}\n${content}`, [title, content]);

  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    latestOnSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    latestOnSavingChangeRef.current = onSavingChange;
  }, [onSavingChange]);

  const lineMetrics = useMemo(() => {
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return {
          index,
          text: line,
          syllables: 0,
          singabilityScore: 0,
          rhymeEnding: '',
          rhymeKey: '',
          lastWord: '',
        };
      }

      const analyzed = analyzePoem(trimmed)[0];
      const words = trimmed.split(/\s+/).filter(Boolean);
      const lastWordRaw = words[words.length - 1] || '';
      const lastWord = lastWordRaw.replace(/[^\p{L}]/gu, '');

      const rhymeEnding = analyzed?.rhymeEnding ?? '';
      const rhymeKey = rhymeEnding.length >= 2 ? rhymeEnding.slice(-2) : rhymeEnding;

      return {
        index,
        text: line,
        syllables: analyzed?.syllables ?? 0,
        singabilityScore: analyzed?.singabilityScore ?? 0,
        rhymeEnding,
        rhymeKey,
        lastWord,
      };
    });
  }, [lines]);

  const rhymeColorClass = useMemo(() => {
    const palette = [
      'bg-violet-100 border-violet-300 text-violet-800',
      'bg-sky-100 border-sky-300 text-sky-800',
      'bg-emerald-100 border-emerald-300 text-emerald-800',
      'bg-amber-100 border-amber-300 text-amber-800',
      'bg-rose-100 border-rose-300 text-rose-800',
      'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800',
    ];

    const counts = new Map<string, number>();
    lineMetrics.forEach((l) => {
      if (!l.rhymeKey) return;
      counts.set(l.rhymeKey, (counts.get(l.rhymeKey) || 0) + 1);
    });

    const map = new Map<string, string>();
    let idx = 0;
    [...counts.entries()]
      .filter(([, c]) => c > 1)
      .forEach(([key]) => {
        map.set(key, palette[idx % palette.length]);
        idx++;
      });

    return map;
  }, [lineMetrics]);

  const runSave = async (snapshotContent: string) => {
    if (saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setSaving(true);
    latestOnSavingChangeRef.current?.(true);

    try {
      await Promise.resolve(
        latestOnSaveRef.current?.(latestTitleRef.current, snapshotContent)
      );

      if (latestContentRef.current === snapshotContent) {
        dirtyRef.current = false;
      }
    } catch (error) {
      console.error('Save failed:', error);
      dirtyRef.current = true;
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
      latestOnSavingChangeRef.current?.(dirtyRef.current);
    }
  };

  useEffect(() => {
    if (!hasEditedRef.current) return;

    dirtyRef.current = true;
    latestOnSavingChangeRef.current?.(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const snapshotContent = content;
    saveTimeoutRef.current = setTimeout(() => {
      void runSave(snapshotContent);
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docSignature]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!dirtyRef.current || saveInFlightRef.current) return;
      void runSave(latestContentRef.current);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      latestOnSavingChangeRef.current?.(false);
    };
  }, []);

  const updateLine = (index: number, value: string) => {
    hasEditedRef.current = true;
    setLines((prev) => prev.map((line, i) => (i === index ? value : line)));
  };

  const insertLineAfter = (index: number) => {
    hasEditedRef.current = true;
    setLines((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, '');
      return next;
    });

    setTimeout(() => lineInputRefs.current[index + 1]?.focus(), 0);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    hasEditedRef.current = true;

    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });

    setTimeout(() => lineInputRefs.current[Math.max(0, index - 1)]?.focus(), 0);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 p-3 md:p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            hasEditedRef.current = true;
            setTitle(e.target.value);
          }}
          placeholder="Název básně..."
          className="w-full text-lg md:text-2xl font-bold outline-none bg-transparent"
        />
        <div className="flex justify-between items-center mt-2 text-xs md:text-sm text-gray-500">
          <span>Titul</span>
          {saving && <span className="text-amber-600">Ukládám...</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 grid grid-cols-[40px_1fr_74px_86px_132px] items-center gap-2 px-3 md:px-4 py-1.5 border-b border-gray-200 bg-white text-[11px] font-semibold text-gray-600">
          <span>#</span>
          <span>Text</span>
          <span className="text-right">Slab.</span>
          <span className="text-right">Zpěv.</span>
          <span className="text-right">Konec / rým</span>
        </div>

        {lineMetrics.map((line) => (
          <div
            key={line.index}
            className={`grid grid-cols-[40px_1fr_74px_86px_132px] items-center gap-2 px-3 md:px-4 py-1.5 border-b border-gray-100 ${
              line.index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <div className="text-xs text-gray-400">{line.index + 1}.</div>

            <input
              ref={(el) => {
                lineInputRefs.current[line.index] = el;
              }}
              value={lines[line.index] ?? ''}
              onChange={(e) => updateLine(line.index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertLineAfter(line.index);
                }
                if (e.key === 'Backspace' && !(lines[line.index] ?? '').length) {
                  e.preventDefault();
                  removeLine(line.index);
                }
              }}
              placeholder={line.index === 0 ? 'Začni psát svou báseň...' : ''}
              className="font-mono text-sm leading-relaxed bg-transparent outline-none w-full"
            />

            <div className="text-[11px] text-right">
              <span className="inline-block min-w-[68px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                {line.syllables}
              </span>
            </div>

            <div className="text-[11px] text-right">
              <span className="inline-block min-w-[80px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                {(line.singabilityScore * 100).toFixed(0)}%
              </span>
            </div>

            <div className="text-[11px] text-right">
              {line.lastWord ? (
                <span
                  title={`${line.lastWord}${line.rhymeEnding ? ` · -${line.rhymeEnding}` : ''}`}
                  className={`inline-block max-w-[122px] truncate px-1.5 py-0.5 rounded border ${
                    line.rhymeKey && rhymeColorClass.get(line.rhymeKey)
                      ? rhymeColorClass.get(line.rhymeKey)
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}
                >
                  {line.lastWord}
                  {line.rhymeEnding ? ` · -${line.rhymeEnding}` : ''}
                </span>
              ) : (
                <span className="inline-block min-w-[80px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-400">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 p-3 md:p-4 text-xs md:text-sm text-gray-600">
        Řádků: {lines.length} | Znaků: {content.length}
      </div>
    </div>
  );
}
