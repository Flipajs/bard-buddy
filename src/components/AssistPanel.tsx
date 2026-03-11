'use client';

import { useEffect, useState } from 'react';

interface ReferenceItem {
  id: number;
  title: string;
  author: string;
  content: string;
  created_at: number;
}

interface AssistPanelProps {
  selectedText: string;
  poemId?: number;
  onInsert?: (text: string) => void;
}

type Mode = 'alternatives' | 'continuation' | 'chorus';

export default function AssistPanel({ selectedText, poemId, onInsert }: AssistPanelProps) {
  const [mode, setMode] = useState<Mode>('alternatives');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<number[]>([]);
  const [newRefTitle, setNewRefTitle] = useState('');
  const [newRefAuthor, setNewRefAuthor] = useState('');
  const [newRefContent, setNewRefContent] = useState('');

  const fetchReferences = async () => {
    if (!poemId) return;
    const res = await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', poemId }),
    });
    if (res.ok) {
      const data = await res.json();
      setReferences(data.references || []);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [poemId]);

  const addReference = async () => {
    if (!poemId || !newRefTitle.trim() || !newRefContent.trim()) return;

    const res = await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        poemId,
        title: newRefTitle,
        author: newRefAuthor,
        content: newRefContent,
      }),
    });

    if (res.ok) {
      setNewRefTitle('');
      setNewRefAuthor('');
      setNewRefContent('');
      fetchReferences();
    }
  };

  const deleteReference = async (id: number) => {
    const res = await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });

    if (res.ok) {
      setSelectedReferenceIds((prev) => prev.filter((x) => x !== id));
      fetchReferences();
    }
  };

  const exportReferencesJson = async () => {
    const res = await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export-all' }),
    });

    if (!res.ok) {
      alert('Export se nepodařil.');
      return;
    }

    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `bard-buddy-references-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importReferencesJson = async (file: File) => {
    if (!poemId) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const refs = Array.isArray(parsed?.references) ? parsed.references : [];

      const payloadRefs = refs.map((r: unknown) => {
        const obj = (r || {}) as { title?: string; author?: string; content?: string };
        return {
          title: obj.title,
          author: obj.author,
          content: obj.content,
        };
      });

      const res = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import-all', poemId, references: payloadRefs }),
      });

      if (!res.ok) {
        alert('Import se nepodařil.');
        return;
      }

      const data = await res.json();
      alert(`Import hotov: ${data.imported} referencí.`);
      fetchReferences();
    } catch (e) {
      console.error(e);
      alert('Neplatný JSON soubor.');
    }
  };

  const generateSuggestions = async () => {
    if (!selectedText.trim()) {
      alert('Vyber text, aby mohl asistent pomoci.');
      return;
    }

    setLoading(true);
    try {
      const selectedReferences = references
        .filter((ref) => selectedReferenceIds.includes(ref.id))
        .map((ref) => ({ title: ref.title, author: ref.author, content: ref.content }));

      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          mode,
          theme: mode === 'chorus' ? selectedText : undefined,
          references: selectedReferences,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (mode === 'alternatives') {
          setSuggestions(data.result as string[]);
        } else {
          setSuggestions([data.result as string]);
        }
      } else {
        const error = await res.json();
        alert(`Chyba: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      alert('Nepodařilo se vygenerovat návrhy.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto">
      <h3 className="font-bold text-sm mb-3 text-gray-700">Asistace + inspirace</h3>

      <div className="mb-4 space-y-2">
        <label className="text-xs text-gray-600">Režim:</label>
        <div className="grid grid-cols-3 gap-2">
          {(['alternatives', 'continuation', 'chorus'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {m === 'alternatives'
                ? 'Alternativy'
                : m === 'continuation'
                ? 'Pokračování'
                : 'Refrén'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 p-2 border rounded bg-white">
        <div className="text-xs font-semibold text-gray-700 mb-2">Inspirace (oblíbené texty)</div>
        <input
          value={newRefTitle}
          onChange={(e) => setNewRefTitle(e.target.value)}
          placeholder="Název reference"
          className="w-full text-xs border rounded px-2 py-1 mb-2"
        />
        <input
          value={newRefAuthor}
          onChange={(e) => setNewRefAuthor(e.target.value)}
          placeholder="Autor (volitelné)"
          className="w-full text-xs border rounded px-2 py-1 mb-2"
        />
        <textarea
          value={newRefContent}
          onChange={(e) => setNewRefContent(e.target.value)}
          placeholder="Vlož oblíbenou báseň/text (jen jako inspirace)"
          className="w-full text-xs border rounded px-2 py-1 mb-2 h-20"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={addReference}
            className="text-xs px-2 py-1 rounded bg-gray-800 text-white hover:bg-black"
            disabled={!poemId}
          >
            + Uložit referenci
          </button>
          <button
            onClick={exportReferencesJson}
            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Export .JSON
          </button>
          <label className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer">
            Import .JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importReferencesJson(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>

        {references.length > 0 && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {references.map((ref) => {
              const checked = selectedReferenceIds.includes(ref.id);
              return (
                <div key={ref.id} className="p-2 border rounded bg-gray-50">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReferenceIds((prev) => [...prev, ref.id]);
                        } else {
                          setSelectedReferenceIds((prev) => prev.filter((id) => id !== ref.id));
                        }
                      }}
                    />
                    <span>{ref.title}</span>
                  </label>
                  <div className="text-[11px] text-gray-500">
                    Autor: {ref.author?.trim() ? ref.author : 'neuveden'}
                  </div>
                  <div className="text-[11px] text-gray-600 line-clamp-2 mt-1">{ref.content}</div>
                  <button
                    onClick={() => deleteReference(ref.id)}
                    className="text-[11px] text-red-600 hover:text-red-800 mt-1"
                  >
                    smazat
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={generateSuggestions}
        disabled={loading || !selectedText.trim()}
        className="w-full mb-4 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Generuji...' : `Vygeneruj (${selectedReferenceIds.length} refs)`}
      </button>

      {selectedText && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Vybraný text:</div>
          <div className="text-xs text-gray-700 font-mono line-clamp-3">{selectedText}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-2 bg-green-50 border border-green-200 rounded cursor-pointer hover:bg-green-100 transition-colors group"
              >
                <div className="text-xs text-gray-700 font-mono mb-1 line-clamp-4">{suggestion}</div>
                <button
                  onClick={() => onInsert?.(suggestion)}
                  className="text-xs text-green-700 hover:text-green-900 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ↳ Vložit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
