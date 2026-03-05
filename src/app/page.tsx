'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@/components/Editor';
import MetricsPanel from '@/components/MetricsPanel';
import AssistPanel from '@/components/AssistPanel';
import VersionSidebar from '@/components/VersionSidebar';

export default function Home() {
  const [poemId, setPoemId] = useState<number | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const initializingRef = useRef(false);

  // Initialize poem on mount
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initialize = async () => {
      try {
        const res = await fetch('/api/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-poem',
            title: 'Moje báseň',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setPoemId(data.poemId);
        }
      } catch (error) {
        console.error('Failed to initialize poem:', error);
      }
    };

    initialize();
  }, []);

  const handleSave = async (newTitle: string, newContent: string) => {
    setTitle(newTitle);
    setContent(newContent);

    if (poemId) {
      try {
        await fetch('/api/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save-version',
            poemId,
            content: newContent,
          }),
        });
      } catch (error) {
        console.error('Failed to save version:', error);
      }
    }
  };

  const handleRestore = (restoredContent: string) => {
    setContent(restoredContent);
  };

  const handleInsert = (text: string) => {
    setContent((prev) => {
      if (selectedText && prev.includes(selectedText)) {
        return prev.replace(selectedText, text);
      }
      return prev + '\n' + text;
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">🎵 bard-buddy</h1>
        <p className="text-sm text-gray-600">Asistent pro psaní poezie a lyrics v češtině</p>
      </header>

      {/* Main content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor (left, largest) */}
        <div
          className="flex-1 border-r border-gray-200 flex flex-col"
          onMouseUp={() => {
            const selection = window.getSelection();
            setSelectedText(selection?.toString() || '');
          }}
        >
          <Editor
            initialTitle={title}
            initialContent={content}
            onSave={handleSave}
          />
        </div>

        {/* MetricsPanel (middle) */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          <MetricsPanel text={content} />
        </div>

        {/* Right column: Versions + Assist (can toggle) */}
        <div className="w-80 bg-white overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 p-3 flex gap-2">
            <button className="text-xs font-medium px-3 py-1 rounded bg-blue-600 text-white">
              Asistace
            </button>
            <button className="text-xs font-medium px-3 py-1 rounded text-gray-600 hover:bg-gray-100">
              Verze
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <AssistPanel selectedText={selectedText} onInsert={handleInsert} />
          </div>

          {/* Versions always visible at bottom */}
          <div className="border-t border-gray-200 max-h-40 overflow-y-auto">
            <VersionSidebar poemId={poemId || undefined} onRestore={handleRestore} />
          </div>
        </div>
      </div>
    </div>
  );
}
