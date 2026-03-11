'use client';

import { useEffect, useState } from 'react';
import type { LineMetrics } from '@/lib/czech-metrics';

interface MetricsPanelProps {
  text: string;
}

export default function MetricsPanel({ text }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<LineMetrics[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!text.trim()) {
        setMetrics([]);
        setSummary(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const data = await res.json();
          setMetrics(data.lines);
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
      setLoading(false);
    };

    // Debounce metrics calculation
    const timer = setTimeout(fetchMetrics, 1000);
    return () => clearTimeout(timer);
  }, [text]);

  if (loading) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Počítám metriky...
      </div>
    );
  }

  if (!metrics.length) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Začni psát, abych mohl analyzovat metriky.
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      {summary && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="font-bold text-sm mb-2 text-gray-700">Souhrn</h3>
          <div className="text-xs space-y-1 text-gray-600">
            <div>Řádků: <strong>{summary.totalLines}</strong></div>
            <div>Slabik: <strong>{summary.totalSyllables}</strong></div>
            <div>Prům. slabik/řádek: <strong>{summary.avgSyllablesPerLine}</strong></div>
            <div>Zpěvnost: <strong>{(parseFloat(summary.avgSingability) * 100).toFixed(0)}%</strong></div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Detailní analýza je teď přímo navázaná na řádky v editoru (pravý sloupec u každého řádku).
      </div>
    </div>
  );
}
