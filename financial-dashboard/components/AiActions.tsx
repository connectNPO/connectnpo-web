'use client';

import { useState } from 'react';

type ActionType = 'executive-summary' | 'board-qa' | 'chart-explanations';
type Status = 'idle' | 'loading' | 'success' | 'error';

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

export function AiActions() {
  const [status, setStatus] = useState<Status>('idle');
  const [loadingType, setLoadingType] = useState<ActionType | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string>('');

  async function runAction(action: ActionConfig) {
    setStatus('loading');
    setLoadingType(action.type);
    setError('');

    try {
      const response = await fetch(action.endpoint, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to generate.');
        setStatus('error');
        return;
      }

      setResult({ type: action.type, text: data.text ?? data.summary ?? '', model: data.model ?? '' });
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setStatus('error');
    } finally {
      setLoadingType(null);
    }
  }

  const currentAction = result ? ACTIONS.find((a) => a.type === result.type) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {ACTIONS.map((action) => {
          const isLoading = loadingType === action.type;
          const isActive = result?.type === action.type && status === 'success';
          const primary = action.primary ?? false;
          const baseClass = primary
            ? 'bg-foreground text-white hover:bg-gray-800'
            : 'border border-border bg-white hover:bg-gray-50';
          const activeRing = isActive ? 'ring-2 ring-offset-1 ring-foreground/20' : '';
          return (
            <button
              key={action.type}
              type="button"
              onClick={() => runAction(action)}
              disabled={status === 'loading'}
              className={`text-sm rounded-lg px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${baseClass} ${activeRing}`}
            >
              {isLoading ? 'Generating…' : action.label}
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

      {status === 'success' && result && currentAction && (
        <div className="border border-border rounded-xl p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">
              {currentAction.resultTitle}
            </div>
            {result.model && <div className="text-xs text-muted">{result.model}</div>}
          </div>
          <MarkdownRenderer text={result.text} />
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.text)}
              className="text-xs border border-border rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => runAction(currentAction)}
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
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc ml-5 mb-4 space-y-1 text-sm text-foreground">
          {bulletBuffer.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>,
      );
      bulletBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }
    if (line === '---') {
      flushBullets();
      elements.push(<hr key={key++} className="my-5 border-border" />);
    } else if (line.startsWith('### Q:')) {
      flushBullets();
      elements.push(
        <div key={key++} className="mt-5 first:mt-0 text-sm font-semibold text-foreground">
          Q: {renderInline(line.slice(6).trim())}
        </div>,
      );
    } else if (line.startsWith('### ')) {
      flushBullets();
      elements.push(
        <h3 key={key++} className="text-sm font-semibold text-foreground mt-5 mb-2 first:mt-0">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      flushBullets();
      elements.push(
        <h2 key={key++} className="text-base font-semibold text-foreground mt-6 mb-3 first:mt-0">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith('# ')) {
      flushBullets();
      elements.push(
        <h1 key={key++} className="text-lg font-semibold text-foreground mb-3 first:mt-0">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      bulletBuffer.push(line.slice(2));
    } else {
      flushBullets();
      elements.push(
        <p key={key++} className="text-sm text-foreground mb-3 leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushBullets();

  return <div>{elements}</div>;
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
