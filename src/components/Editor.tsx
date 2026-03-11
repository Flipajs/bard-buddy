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
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
          lastWord: '',
        };
      }

      const analyzed = analyzePoem(trimmed)[0];
      const words = trimmed.split(/\s+/).filter(Boolean);
      const lastWordRaw = words[words.length - 1] || '';
      const lastWord = lastWordRaw.replace(/[^\p{L}]/gu, '');

      return {
        index,
        text: line,
        syllables: analyzed?.syllables ?? 0,
        singabilityScore: analyzed?.singabilityScore ?? 0,
        rhymeEnding: analyzed?.rhymeEnding ?? '',
        lastWord,
      };
    });
  }, [content]);

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
    // Hybrid: fast debounce save after pause + periodic safety save.
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!dirtyRef.current || saveInFlightRef.current) return;
      void runSave(latestContentRef.current);
    }, 10000);

    return () => clearInterval(interval);
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
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název básně..."
          className="w-full text-lg md:text-2xl font-bold outline-none bg-transparent"
        />
        <div className="flex justify-between items-center mt-2 text-xs md:text-sm text-gray-500">
          <span>Titul</span>
          {saving && <span className="text-amber-600">Ukládám...</span>}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <textarea
          value={content}
          onChange={(e) => {
            hasEditedRef.current = true;
            setContent(e.target.value);
          }}
          placeholder="Začni psát svou báseň..."
          className="flex-1 p-3 md:p-4 outline-none resize-none font-mono text-sm leading-relaxed"
        />

        <aside className="hidden md:flex w-80 border-l border-gray-200 bg-gray-50 flex-col">
          <div className="px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700">
            Vazba na řádky
          </div>
          <div className="flex-1 overflow-y-auto">
            {lineMetrics.map((line) => (
              <div
                key={line.index}
                className={`px-3 py-2 text-xs border-b border-gray-200 ${
                  line.index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 w-5">{line.index + 1}.</span>
                  <span className="truncate text-gray-700">{line.text.trim() || '—'}</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-7">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                    {line.syllables} slab.
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                    {(line.singabilityScore * 100).toFixed(0)}% zpěv.
                  </span>
                  {line.lastWord && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
                      {line.lastWord}
                      {line.rhymeEnding ? ` · -${line.rhymeEnding}` : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="border-t border-gray-200 p-3 md:p-4 text-xs md:text-sm text-gray-600">
        Řádků: {content.split('\n').length} | Znaků: {content.length}
      </div>
    </div>
  );
}
