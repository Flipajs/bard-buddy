'use client';

import { useState } from 'react';

interface AssistPanelProps {
  selectedText: string;
  onInsert?: (text: string) => void;
}

type Mode = 'alternatives' | 'continuation' | 'chorus';

export default function AssistPanel({ selectedText, onInsert }: AssistPanelProps) {
  const [mode, setMode] = useState<Mode>('alternatives');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    if (!selectedText.trim()) {
      alert('Vyber text, aby mohl asistent pomoci.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          mode,
          theme: mode === 'chorus' ? selectedText : undefined,
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
    <div className="p-4 flex flex-col h-full">
      <h3 className="font-bold text-sm mb-3 text-gray-700">Asistace</h3>

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

      <button
        onClick={generateSuggestions}
        disabled={loading || !selectedText.trim()}
        className="w-full mb-4 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Generuji...' : 'Vygeneruj'}
      </button>

      {selectedText && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Vybraný text:</div>
          <div className="text-xs text-gray-700 font-mono line-clamp-3">
            {selectedText}
          </div>
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
                <div className="text-xs text-gray-700 font-mono mb-1 line-clamp-3">
                  {suggestion}
                </div>
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
