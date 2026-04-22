'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';

export interface ProjectBreakdownLine {
  label: string;
  amount: number;
}

export interface ProjectBreakdown {
  revenue: ProjectBreakdownLine[];
  expenditures: ProjectBreakdownLine[];
  totalRevenue: number;
  totalExpenditures: number;
  netRevenue: number;
}

export interface Project {
  name: string;
  netRevenue: number;
  breakdown?: ProjectBreakdown;
}

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (projects.length === 0) return null;

  const maxAbs = Math.max(...projects.map((p) => Math.abs(p.netRevenue)));

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden pdf-avoid-break">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="text-xs uppercase tracking-wider text-muted font-medium">
          Project Profitability
        </div>
      </div>
      <div>
        {projects.map((p, idx) => {
          const isPositive = p.netRevenue > 0;
          const isNegative = p.netRevenue < 0;
          const widthPct = maxAbs > 0 ? (Math.abs(p.netRevenue) / maxAbs) * 100 : 0;
          const canExpand = !!p.breakdown;
          const isExpanded = expandedIdx === idx;

          return (
            <div key={idx} className="border-b border-border last:border-b-0 pdf-avoid-break">
              <button
                type="button"
                onClick={() => canExpand && setExpandedIdx(isExpanded ? null : idx)}
                disabled={!canExpand}
                className={`w-full px-6 py-5 grid grid-cols-[1fr_auto_120px] gap-4 items-center text-left leading-6 ${canExpand ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} transition-colors`}
              >
                <div className="text-sm text-foreground flex items-center gap-1.5 pr-2">
                  {canExpand && (
                    <span
                      className={`text-xs text-muted transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}
                    >
                      ▸
                    </span>
                  )}
                  {p.name}
                </div>
                <div
                  className={`text-sm font-medium tabular ${
                    isNegative ? 'text-negative' : isPositive ? 'text-foreground' : 'text-muted'
                  }`}
                >
                  {formatCurrency(p.netRevenue, { showSign: true })}
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isNegative ? 'bg-negative' : 'bg-foreground'}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </button>
              {isExpanded && p.breakdown && (
                <div className="px-6 pb-5 pt-1 bg-gray-50 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
                        Revenue · {formatCurrency(p.breakdown.totalRevenue)}
                      </div>
                      <div className="space-y-1.5">
                        {p.breakdown.revenue.length === 0 ? (
                          <div className="text-xs text-muted italic">No revenue</div>
                        ) : (
                          p.breakdown.revenue.map((r, i) => (
                            <div key={i} className="flex items-baseline justify-between text-xs">
                              <span className="text-muted">{r.label}</span>
                              <span className="tabular text-foreground">
                                {formatCurrency(r.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
                        Expenses · {formatCurrency(p.breakdown.totalExpenditures)}
                      </div>
                      <div className="space-y-1.5">
                        {p.breakdown.expenditures.length === 0 ? (
                          <div className="text-xs text-muted italic">No expenses</div>
                        ) : (
                          p.breakdown.expenditures.map((e, i) => (
                            <div key={i} className="flex items-baseline justify-between text-xs">
                              <span className="text-muted">{e.label}</span>
                              <span className="tabular text-foreground">
                                {formatCurrency(e.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
