'use client';

import { useEffect, useState } from 'react';
import type { WorkbookResult } from '@/lib/types';

const AI_STORAGE_KEY = 'financial-dashboard-ai-results';

interface StoredAiResults {
  parsedAt: string;
  results: Partial<Record<ActionType, ResultState>>;
}

type ActionType = 'executive-summary' | 'board-qa' | 'chart-explanations';
type Status = 'idle' | 'loading' | 'success' | 'error';

interface AiActionsProps {
  workbook: WorkbookResult;
}

interface ActionConfig {
  type: ActionType;
  label: string;
  endpoint: string;
  resultTitle: string;
  primary?: boolean;
}

const ACTIONS: ActionConfig[] = [
  {
    type: 'executive-summary',
    label: 'Generate Executive Summary',
    endpoint: '/api/executive-summary',
    resultTitle: 'Executive Summary',
    primary: true,
  },
  {
    type: 'board-qa',
    label: 'Board Q&A Prep',
    endpoint: '/api/board-qa',
    resultTitle: 'Anticipated Board Questions',
  },
  {
    type: 'chart-explanations',
    label: 'Explain Charts',
    endpoint: '/api/chart-explanations',
    resultTitle: 'Chart Explanations',
  },
];

interface ResultState {
  type: ActionType;
  text: string;
  model: string;
}

export function AiActions({ workbook }: AiActionsProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [loadingType, setLoadingType] = useState<ActionType | null>(null);
  const [results, setResults] = useState<Partial<Record<ActionType, ResultState>>>({});
  const [activeType, setActiveType] = useState<ActionType | null>(null);
  const [error, setError] = useState<string>('');

  // Load cached AI results for the current workbook on mount / workbook change.
  // If the workbook has been re-uploaded (different parsedAt), discard the old cache.
  useEffect(() => {
    const stored = sessionStorage.getItem(AI_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StoredAiResults;
      if (parsed.parsedAt === workbook.parsedAt) {
        setResults(parsed.results ?? {});
      } else {
        sessionStorage.removeItem(AI_STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(AI_STORAGE_KEY);
    }
  }, [workbook.parsedAt]);

  // Persist results whenever they change
  useEffect(() => {
    if (Object.keys(results).length === 0) return;
    try {
      const payload: StoredAiResults = { parsedAt: workbook.parsedAt, results };
      sessionStorage.setItem(AI_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // sessionStorage may fail (quota); ignore silently
    }
  }, [results, workbook.parsedAt]);

  async function runAction(action: ActionConfig, forceRegenerate = false) {
    // Already have a cached result and not forcing: just switch tab (no API call)
    if (!forceRegenerate && results[action.type]) {
      setActiveType(action.type);
      setStatus('success');
      setError('');
      return;
    }

    setStatus('loading');
    setLoadingType(action.type);
    setActiveType(action.type);
    setError('');

    try {
      const response = await fetch(action.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workbook),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to generate.');
        setStatus('error');
        return;
      }

      const next: ResultState = {
        type: action.type,
        text: data.text ?? data.summary ?? '',
        model: data.model ?? '',
      };
      setResults((prev) => ({ ...prev, [action.type]: next }));
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setStatus('error');
    } finally {
      setLoadingType(null);
    }
  }

  const activeResult = activeType ? results[activeType] : undefined;
  const currentAction = activeType ? ACTIONS.find((a) => a.type === activeType) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 no-print">
        {ACTIONS.map((action) => {
          const isLoading = loadingType === action.type;
          const isActive = activeType === action.type;
          const hasCached = !!results[action.type];
          const primary = action.primary ?? false;
          // Black when this tab is active, OR on initial state if primary
          const isSelected = isActive || (!activeType && primary);
          const baseClass = isSelected
            ? 'bg-foreground text-white hover:bg-gray-800'
            : 'border border-border bg-white hover:bg-gray-50';
          const labelText = isLoading
            ? 'Generating…'
            : hasCached && !isActive
              ? `${action.label} ✓`
              : action.label;
          return (
            <button
              key={action.type}
              type="button"
              onClick={() => runAction(action)}
              disabled={status === 'loading'}
              className={`text-sm rounded-lg px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${baseClass}`}
              title={hasCached && !isActive ? 'Show saved result (click Regenerate for fresh)' : undefined}
            >
              {labelText}
            </button>
          );
        })}
      </div>

      {status === 'error' && (
        <div className="border border-negative/30 bg-red-50 rounded-xl p-4 text-sm text-negative">
          <div className="font-medium mb-1">Couldn&apos;t generate</div>
          <div>{error}</div>
        </div>
      )}

      {status === 'loading' && (
        <div className="border border-border rounded-xl p-6 bg-gray-50">
          <div className="text-sm text-muted flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-foreground rounded-full animate-pulse" />
            Claude is drafting…
          </div>
        </div>
      )}

      {status === 'success' && activeResult && currentAction && (
        <div className="border border-border rounded-xl p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">
              {currentAction.resultTitle}
            </div>
            {activeResult.model && (
              <div className="text-xs text-muted">{activeResult.model}</div>
            )}
          </div>
          <MarkdownRenderer text={activeResult.text} />
          <div className="mt-5 flex gap-2 no-print">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(activeResult.text)}
              className="text-xs border border-border rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => runAction(currentAction, true)}
              className="text-xs border border-border rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  const sections: React.ReactNode[] = [];
  let current: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      current.push(
        <ul key={key++} className="list-disc ml-5 mb-4 space-y-1 text-sm text-foreground">
          {bulletBuffer.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>,
      );
      bulletBuffer = [];
    }
  };

  const flushSection = () => {
    flushBullets();
    if (current.length > 0) {
      sections.push(
        <div key={`sec-${sections.length}`} className="pdf-avoid-break">
          {current}
        </div>,
      );
      current = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }
    if (line === '---') {
      flushSection();
      sections.push(<hr key={`hr-${sections.length}`} className="my-5 border-border" />);
    } else if (line.startsWith('### Q:')) {
      flushSection();
      current.push(
        <div key={key++} className="mt-5 first:mt-0 text-sm font-semibold text-foreground">
          Q: {renderInline(line.slice(6).trim())}
        </div>,
      );
    } else if (line.startsWith('### ')) {
      flushSection();
      current.push(
        <h3 key={key++} className="text-sm font-semibold text-foreground mt-5 mb-2 first:mt-0">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      flushSection();
      current.push(
        <h2 key={key++} className="text-base font-semibold text-foreground mt-6 mb-3 first:mt-0">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith('# ')) {
      flushSection();
      current.push(
        <h1 key={key++} className="text-lg font-semibold text-foreground mb-3 first:mt-0">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      bulletBuffer.push(line.slice(2));
    } else {
      flushBullets();
      current.push(
        <p key={key++} className="text-sm text-foreground mb-3 leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushSection();

  return <div>{sections}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
