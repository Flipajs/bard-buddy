'use client';

interface Version {
  id: number;
  content: string;
  created_at: number;
}

interface BranchTimelineViewProps {
  versions: Version[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
}

export default function BranchTimelineView({ versions, selectedId, onSelect }: BranchTimelineViewProps) {
  if (versions.length === 0) {
    return <div className="text-xs text-gray-400">Zatím není co zobrazit ve stromu.</div>;
  }

  // MVP heuristic: sequential branch chain from oldest -> newest
  const chronological = [...versions].sort((a, b) => a.created_at - b.created_at);

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-2">
        Timeline (MVP): lineární větev verzí, další krok bude skutečný DAG s parent_id.
      </div>
      {chronological.map((version, idx) => {
        const isSelected = selectedId === version.id;
        const isLatest = idx === chronological.length - 1;

        return (
          <div key={version.id} className="flex items-start gap-2">
            <div className="flex flex-col items-center pt-1">
              <div
                className={`h-3 w-3 rounded-full border ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'
                }`}
              />
              {!isLatest && <div className="w-px h-8 bg-gray-300 mt-1" />}
            </div>

            <button
              onClick={() => onSelect?.(version.id)}
              className={`flex-1 text-left rounded border p-2 text-xs transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-800">Node v{idx + 1}</div>
              <div className="text-gray-600 line-clamp-2 mt-1">{version.content || '(prázdné)'}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {new Date(version.created_at).toLocaleTimeString('cs-CZ')}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
