'use client';

import { useEffect, useState } from 'react';

interface Version {
  id: number;
  content: string;
  created_at: number;
}

interface VersionSidebarProps {
  poemId?: number;
  onRestore?: (content: string) => void;
}

export default function VersionSidebar({ poemId, onRestore }: VersionSidebarProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    if (!poemId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-versions',
          poemId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVersions();
    // Poll every 10 seconds
    const interval = setInterval(fetchVersions, 10000);
    return () => clearInterval(interval);
  }, [poemId]);

  if (!poemId) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Vytvořit báseň, aby se verze zobrazily.
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      <h3 className="font-bold text-sm mb-3 text-gray-700">Verze</h3>

      {loading && <div className="text-xs text-gray-500">Načítám...</div>}

      {versions.length === 0 && !loading && (
        <div className="text-xs text-gray-400">Zatím žádné verze.</div>
      )}

      <div className="space-y-2">
        {versions.map((version, idx) => (
          <button
            key={version.id}
            onClick={() => onRestore?.(version.content)}
            className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors border border-gray-200 text-xs"
          >
            <div className="text-gray-700 font-mono line-clamp-2 mb-1">
              {version.content.substring(0, 50)}...
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(version.created_at).toLocaleTimeString('cs-CZ')}
            </div>
            {idx === 0 && (
              <div className="text-green-600 text-xs font-bold mt-1">Aktuální</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
