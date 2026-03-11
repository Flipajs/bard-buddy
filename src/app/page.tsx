'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@/components/Editor';
import MetricsPanel from '@/components/MetricsPanel';
import AssistPanel from '@/components/AssistPanel';
import VersionSidebar from '@/components/VersionSidebar';
import VariantSidebar from '@/components/VariantSidebar';
import { GuitarPanel } from '@/components/GuitarPanel';
import BottomSheet from '@/components/BottomSheet';

type RightPanelTab = 'assist' | 'guitar' | 'variants' | 'versions';
type MobileToolTab = 'metrics' | 'assist' | 'guitar' | 'variants' | 'versions';

interface RecentPoem {
  id: number;
  title: string;
  updated_at: number;
  latest_content?: string | null;
}

export default function Home() {
  const [poemId, setPoemId] = useState<number | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('assist');
  const [mobileSheet, setMobileSheet] = useState<MobileToolTab | null>(null);
  const [recentPoems, setRecentPoems] = useState<RecentPoem[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const initializingRef = useRef(false);

  const fetchRecentPoems = async () => {
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-poems' }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecentPoems(data.poems || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent poems:', error);
    }
  };

  const loadPoem = async (id: number) => {
    if (isSaving) return;
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load-poem', poemId: id }),
      });

      if (res.ok) {
        const data = await res.json();
        setPoemId(data.poem.id);
        setTitle(data.poem.title || 'Untitled');
        setContent(data.content || '');
        localStorage.setItem('bardBuddy.activePoemId', String(data.poem.id));
        setEditorKey((k) => k + 1);
      }
    } catch (error) {
      console.error('Failed to load poem:', error);
    }
  };

  const createNewPoem = async () => {
    if (isSaving) return;
    const res = await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-poem', title: 'Moje báseň' }),
    });

    if (!res.ok) return;

    const data = await res.json();
    setPoemId(data.poemId);
    setTitle('Moje báseň');
    setContent('');
    localStorage.setItem('bardBuddy.activePoemId', String(data.poemId));
    setEditorKey((k) => k + 1);
    await fetchRecentPoems();
  };

  const deleteCurrentPoem = async () => {
    if (!poemId || isSaving) return;
    const ok = window.confirm('Opravdu smazat aktuální projekt?');
    if (!ok) return;

    const res = await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-poem', poemId }),
    });

    if (!res.ok) return;

    localStorage.removeItem('bardBuddy.activePoemId');
    await fetchRecentPoems();
    await createNewPoem();
  };

  // Initialize poem on mount
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initialize = async () => {
      try {
        await fetchRecentPoems();

        const persisted = localStorage.getItem('bardBuddy.activePoemId');
        const persistedId = persisted ? Number(persisted) : null;

        if (persistedId) {
          const res = await fetch('/api/versions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'load-poem', poemId: persistedId }),
          });

          if (res.ok) {
            const data = await res.json();
            setPoemId(data.poem.id);
            setTitle(data.poem.title || 'Untitled');
            setContent(data.content || '');
            setEditorKey((k) => k + 1);
            return;
          }
        }

        await createNewPoem();
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
            title: newTitle,
            content: newContent,
          }),
        });
        fetchRecentPoems();
      } catch (error) {
        console.error('Failed to save version:', error);
      }
    }
  };

  const handleRestore = (restoredContent: string) => {
    setContent(restoredContent);
    setEditorKey((k) => k + 1);
  };

  const handleInsert = (text: string) => {
    setContent((prev) => {
      if (selectedText && prev.includes(selectedText)) {
        return prev.replace(selectedText, text);
      }
      return prev + '\n' + text;
    });
    setEditorKey((k) => k + 1);
  };

  const renderMobileSheetContent = () => {
    switch (mobileSheet) {
      case 'metrics':
        return <MetricsPanel text={content} />;
      case 'assist':
        return (
          <AssistPanel
            selectedText={selectedText}
            poemId={poemId || undefined}
            onInsert={handleInsert}
          />
        );
      case 'guitar':
        return <GuitarPanel />;
      case 'variants':
        return <VariantSidebar poemId={poemId || undefined} onRestore={handleRestore} />;
      case 'versions':
        return <VersionSidebar poemId={poemId || undefined} onRestore={handleRestore} />;
      default:
        return null;
    }
  };

  const getMobileSheetTitle = (): string => {
    switch (mobileSheet) {
      case 'metrics':
        return 'Metriky';
      case 'assist':
        return 'AI Asistence';
      case 'guitar':
        return 'Kytara';
      case 'variants':
        return 'Varianty';
      case 'versions':
        return 'Historie verzí';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🎵 bard-buddy</h1>
            <p className="text-xs md:text-sm text-gray-600">Asistent pro psaní poezie a lyrics v češtině</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewPoem}
              disabled={isSaving}
              className="text-xs md:text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              + Nový projekt
            </button>
            <button
              onClick={deleteCurrentPoem}
              disabled={isSaving}
              className="text-xs md:text-sm px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Smazat
            </button>
          </div>
        </div>

        {recentPoems.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Rozpracované:</span>
            <select
              className="text-xs md:text-sm border border-gray-300 rounded px-2 py-1 bg-white max-w-full disabled:bg-gray-100 disabled:text-gray-400"
              value={poemId ?? ''}
              onChange={(e) => loadPoem(Number(e.target.value))}
              disabled={isSaving}
            >
              {recentPoems.map((poem) => (
                <option key={poem.id} value={poem.id}>
                  {poem.title || 'Untitled'} · {new Date(poem.updated_at).toLocaleString('cs-CZ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {isSaving && (
          <div className="mt-2 text-xs text-amber-700">
            Máš neuložené změny — přepínání projektu je dočasně zamknuté.
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-gray-200 flex flex-col">
          <Editor
            key={editorKey}
            initialTitle={title}
            initialContent={content}
            onSave={handleSave}
            onSavingChange={setIsSaving}
            onSelectionChange={setSelectedText}
          />
        </div>

        <div className="hidden lg:flex w-80 bg-white overflow-hidden flex-col">
          <div className="border-b border-gray-200 p-2 flex gap-2">
            <button onClick={() => setRightPanelTab('assist')} className={`text-xs font-medium px-3 py-1 rounded transition ${rightPanelTab === 'assist' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Asistace</button>
            <button onClick={() => setRightPanelTab('guitar')} className={`text-xs font-medium px-3 py-1 rounded transition ${rightPanelTab === 'guitar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Kytara</button>
            <button onClick={() => setRightPanelTab('variants')} className={`text-xs font-medium px-3 py-1 rounded transition ${rightPanelTab === 'variants' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Varianty</button>
            <button onClick={() => setRightPanelTab('versions')} className={`text-xs font-medium px-3 py-1 rounded transition ${rightPanelTab === 'versions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Verze</button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'assist' && (
              <AssistPanel
                selectedText={selectedText}
                poemId={poemId || undefined}
                onInsert={handleInsert}
              />
            )}
            {rightPanelTab === 'guitar' && <GuitarPanel />}
            {rightPanelTab === 'variants' && <VariantSidebar poemId={poemId || undefined} onRestore={handleRestore} />}
            {rightPanelTab === 'versions' && <VersionSidebar poemId={poemId || undefined} onRestore={handleRestore} />}
          </div>
        </div>
      </div>

      <div className="lg:hidden bg-white border-t border-gray-200 px-2 py-2 flex justify-between gap-1 sticky bottom-0">
        <button onClick={() => setMobileSheet('metrics')} className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700">📊 Metriky</button>
        <button onClick={() => setMobileSheet('assist')} className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-blue-100 hover:bg-blue-200 text-blue-700">✨ Asist</button>
        <button onClick={() => setMobileSheet('guitar')} className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700">🎸 Kytara</button>
        <button onClick={() => setMobileSheet('variants')} className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700">🔀 Varianty</button>
        <button onClick={() => setMobileSheet('versions')} className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700">📜 Verze</button>
      </div>

      <BottomSheet isOpen={mobileSheet !== null} onClose={() => setMobileSheet(null)} title={getMobileSheetTitle()}>
        {renderMobileSheetContent()}
      </BottomSheet>
    </div>
  );
}
