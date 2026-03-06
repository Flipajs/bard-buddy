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

export default function Home() {
  const [poemId, setPoemId] = useState<number | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('assist');
  const [mobileSheet, setMobileSheet] = useState<MobileToolTab | null>(null);
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

  const renderMobileSheetContent = () => {
    switch (mobileSheet) {
      case 'metrics':
        return <MetricsPanel text={content} />;
      case 'assist':
        return <AssistPanel selectedText={selectedText} onInsert={handleInsert} />;
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
      {/* Header - responsive sizing */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🎵 bard-buddy</h1>
        <p className="text-xs md:text-sm text-gray-600">Asistent pro psaní poezie a lyrics v češtině</p>
      </header>

      {/* Main content: responsive grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor (full-width on mobile, flex-1 on desktop) */}
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

        {/* Middle: MetricsPanel (hidden on mobile < 1024px) */}
        <div className="hidden lg:flex w-80 border-r border-gray-200 bg-white overflow-hidden flex-col">
          <MetricsPanel text={content} />
        </div>

        {/* Right: Assist + Variants tabs (hidden on mobile < 1024px) */}
        <div className="hidden lg:flex w-80 bg-white overflow-hidden flex-col">
          <div className="border-b border-gray-200 p-2 flex gap-2">
            <button
              onClick={() => setRightPanelTab('assist')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                rightPanelTab === 'assist'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Asistace
            </button>
            <button
              onClick={() => setRightPanelTab('guitar')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                rightPanelTab === 'guitar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Kytara
            </button>
            <button
              onClick={() => setRightPanelTab('variants')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                rightPanelTab === 'variants'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Varianty
            </button>
            <button
              onClick={() => setRightPanelTab('versions')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                rightPanelTab === 'versions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Verze
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'assist' && (
              <AssistPanel selectedText={selectedText} onInsert={handleInsert} />
            )}
            {rightPanelTab === 'guitar' && <GuitarPanel />}
            {rightPanelTab === 'variants' && (
              <VariantSidebar poemId={poemId || undefined} onRestore={handleRestore} />
            )}
            {rightPanelTab === 'versions' && (
              <VersionSidebar poemId={poemId || undefined} onRestore={handleRestore} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (visible only on mobile < 1024px) */}
      <div className="lg:hidden bg-white border-t border-gray-200 px-2 py-2 flex justify-between gap-1 sticky bottom-0">
        <button
          onClick={() => setMobileSheet('metrics')}
          className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          📊 Metriky
        </button>
        <button
          onClick={() => setMobileSheet('assist')}
          className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-blue-100 hover:bg-blue-200 text-blue-700"
        >
          ✨ Asist
        </button>
        <button
          onClick={() => setMobileSheet('guitar')}
          className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          🎸 Kytara
        </button>
        <button
          onClick={() => setMobileSheet('variants')}
          className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          🔀 Varianty
        </button>
        <button
          onClick={() => setMobileSheet('versions')}
          className="flex-1 py-2 px-2 text-xs font-medium rounded transition bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          📜 Verze
        </button>
      </div>

      {/* Bottom Sheet (mobile only) */}
      <BottomSheet
        isOpen={mobileSheet !== null}
        onClose={() => setMobileSheet(null)}
        title={getMobileSheetTitle()}
      >
        {renderMobileSheetContent()}
      </BottomSheet>
    </div>
  );
}
