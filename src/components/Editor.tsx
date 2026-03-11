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
  const [showInlineMetrics, setShowInlineMetrics] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestTitleRef = useRef(title);
  const latestOnSaveRef = useRef(onSave);
  const latestOnSavingChangeRef = useRef(onSavingChange);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    latestTitleRef.current = title;
  }, [title]);

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
        };
      }

      const analyzed = analyzePoem(trimmed)[0];
      return {
        index,
        text: line,
        syllables: analyzed?.syllables ?? 0,
        singabilityScore: analyzed?.singabilityScore ?? 0,
        rhymeEnding: analyzed?.rhymeEnding ?? '',
      };
    });
  }, [content]);

  useEffect(() => {
    // Auto-save every 3 seconds, triggered by document(content) changes.
    if (!hasEditedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const snapshotContent = content;

    // During debounce we keep project-switch lock ON to prevent data loss.
    setSaving(false);
    latestOnSavingChangeRef.current?.(true);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      latestOnSavingChangeRef.current?.(true);
      try {
        await Promise.resolve(
          latestOnSaveRef.current?.(latestTitleRef.current, snapshotContent)
        );
      } catch (error) {
        console.error('Save failed:', error);
      } finally {
        setSaving(false);
        latestOnSavingChangeRef.current?.(false);
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

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

      <textarea
        value={content}
        onChange={(e) => {
          hasEditedRef.current = true;
          setContent(e.target.value);
        }}
        placeholder="Začni psát svou báseň..."
        className="flex-1 p-3 md:p-4 outline-none resize-none font-mono text-sm leading-relaxed"
      />

      <div className="border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowInlineMetrics((v) => !v)}
          className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {showInlineMetrics ? '▾' : '▸'} Inline metriky řádků
        </button>

        {showInlineMetrics && (
          <div className="max-h-40 overflow-y-auto px-3 md:px-4 pb-2 space-y-1">
            {lineMetrics.map((line) => (
              <div key={line.index} className="flex items-center gap-2 text-[11px] md:text-xs">
                <span className="w-6 text-gray-400">{line.index + 1}.</span>
                <span className="truncate flex-1 text-gray-600">{line.text.trim() || '—'}</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                  {line.syllables} slab.
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                  {(line.singabilityScore * 100).toFixed(0)}%
                </span>
                {line.rhymeEnding ? (
                  <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                    -{line.rhymeEnding}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 md:p-4 text-xs md:text-sm text-gray-600">
        Řádků: {content.split('\n').length} | Znaků: {content.length}
      </div>
    </div>
  );
}
