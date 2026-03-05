'use client';

import { useEffect, useRef, useState } from 'react';

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave?: (title: string, content: string) => void;
}

export default function Editor({
  initialTitle = 'Untitled',
  initialContent = '',
  onSave,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-save every 3 seconds
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      onSave?.(title, content);
      setSaving(false);
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, onSave]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název básně..."
          className="w-full text-2xl font-bold outline-none bg-transparent"
        />
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
          <span>Titul</span>
          {saving && <span className="text-amber-600">Ukládám...</span>}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Začni psát svou báseň..."
        className="flex-1 p-4 outline-none resize-none font-mono text-sm leading-relaxed"
      />

      <div className="border-t border-gray-200 p-4 text-sm text-gray-600">
        Řádků: {content.split('\n').length} | Znaků: {content.length}
      </div>
    </div>
  );
}
