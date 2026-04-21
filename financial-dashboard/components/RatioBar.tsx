'use client';

import { useState } from 'react';
import { formatCurrency, formatPct } from '@/lib/format';

export interface BreakdownLine {
  label: string;
  amount: number;
}

export interface RatioItem {
  label: string;
  value: number;
  amount?: number;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
  breakdown?: BreakdownLine[];
}

interface RatioBarProps {
  title: string;
  items: RatioItem[];
  footnote?: string;
  footnoteTone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

function barColor(tone?: RatioItem['tone']): string {
  switch (tone) {
    case 'positive':
      return 'bg-positive';
    case 'negative':
      return 'bg-negative';
    case 'warning':
      return 'bg-warning';
    default:
      return 'bg-foreground';
  }
}

function footnoteColor(tone?: RatioBarProps['footnoteTone']): string {
  switch (tone) {
    case 'positive':
      return 'text-positive';
    case 'negative':
      return 'text-negative';
    case 'warning':
      return 'text-warning';
    default:
      return 'text-muted';
  }
}

export function RatioBar({ title, items, footnote, footnoteTone }: RatioBarProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="border border-border rounded-xl p-6 bg-white">
      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-5">{title}</div>
      <div className="space-y-4">
        {items.map((item, idx) => {
          const canExpand = !!item.breakdown && item.breakdown.length > 0;
          const isExpanded = expandedIdx === idx;
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => canExpand && setExpandedIdx(isExpanded ? null : idx)}
                disabled={!canExpand}
                className={`w-full text-left ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm text-foreground flex items-center gap-1.5">
                    {canExpand && (
                      <span
                        className={`text-xs text-muted transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        ▸
                      </span>
                    )}
                    {item.label}
                  </span>
                  <span className="text-sm font-medium tabular flex items-baseline gap-2">
                    {item.amount !== undefined && (
                      <>
                        <span>{formatCurrency(item.amount)}</span>
                        <span className="text-muted font-normal">·</span>
                      </>
                    )}
                    <span>{formatPct(item.value)}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor(item.tone)} rounded-full`}
                    style={{ width: `${Math.min(100, item.value * 100)}%` }}
                  />
                </div>
              </button>
              {isExpanded && item.breakdown && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-border space-y-1.5">
                  {item.breakdown.map((b, i) => (
                    <div key={i} className="flex items-baseline justify-between text-xs">
                      <span className="text-muted">{b.label}</span>
                      <span className="tabular text-foreground">{formatCurrency(b.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {footnote && (
        <div className={`mt-5 text-xs ${footnoteColor(footnoteTone)}`}>{footnote}</div>
      )}
    </div>
  );
}
