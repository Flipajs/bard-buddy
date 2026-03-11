'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzePoem } from '@/lib/czech-metrics';

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave?: (title: string, content: string) => void;
  onSavingChange?: (saving: boolean) => void;
  onSelectionChange?: (text: string) => void;
}

export default function Editor({
  initialTitle = 'Untitled',
  initialContent = '',
  onSave,
  onSavingChange,
  onSelectionChange,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const metricsScrollRef = useRef<HTMLDivElement | null>(null);

  const latestTitleRef = useRef(title);
  const latestContentRef = useRef(content);
  const latestOnSaveRef = useRef(onSave);
  const latestOnSavingChangeRef = useRef(onSavingChange);

  const hasEditedRef = useRef(false);
  const dirtyRef = useRef(false);
  const saveInFlightRef = useRef(false);

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
    const lines = content.split('\n');

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
  }, [content]);

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

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const snapshotContent = content;
    saveTimeoutRef.current = setTimeout(() => {
      void runSave(snapshotContent);
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title]);

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

      <div className="flex-1 min-h-0 grid grid-cols-[1fr_304px]">
        <div className="flex flex-col min-h-0 border-r border-gray-200">
          <div className="h-[31px] border-b border-gray-200 bg-white" />
          <textarea
            ref={textareaRef}
            wrap="off"
            value={content}
            onChange={(e) => {
              hasEditedRef.current = true;
              setContent(e.target.value);
            }}
            onSelect={(e) => {
              const el = e.currentTarget;
              const s = el.selectionStart ?? 0;
              const t = el.selectionEnd ?? 0;
              onSelectionChange?.(el.value.slice(s, t));
            }}
            onScroll={(e) => {
              if (metricsScrollRef.current) {
                metricsScrollRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            placeholder="Začni psát svou báseň..."
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, #ffffff 0px, #ffffff 24px, #f9fafb 24px, #f9fafb 48px)',
            }}
            className="flex-1 px-3 md:px-4 py-0 outline-none resize-none overflow-x-auto whitespace-pre font-mono tabular-nums text-sm leading-6"
          />
        </div>

        <div className="flex flex-col min-h-0 bg-gray-50">
          <div className="sticky top-0 z-10 grid grid-cols-[74px_86px_132px] items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-white text-[11px] font-semibold text-gray-600">
            <span className="text-right">Slab.</span>
            <span className="text-right">Zpěv.</span>
            <span className="text-right">Konec / rým</span>
          </div>

          <div ref={metricsScrollRef} className="flex-1 overflow-y-auto">
            {lineMetrics.map((line) => (
              <div
                key={line.index}
                className={`grid grid-cols-[74px_86px_132px] items-center gap-2 px-3 h-6 border-b border-gray-100 ${
                  line.index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
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
        </div>
      </div>

      <div className="border-t border-gray-200 p-3 md:p-4 text-xs md:text-sm text-gray-600">
        Řádků: {lineMetrics.length} | Znaků: {content.length}
      </div>
    </div>
  );
}
