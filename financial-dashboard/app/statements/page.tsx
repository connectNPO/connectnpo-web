'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BalanceSheetView } from '@/components/statements/BalanceSheetView';
import { ProfitLossView } from '@/components/statements/ProfitLossView';
import { ProfitLossByClassView } from '@/components/statements/ProfitLossByClassView';
import { ProjectPLView } from '@/components/statements/ProjectPLView';
import type {
  BalanceSheet,
  ProfitLoss,
  ProfitLossByClass,
  ProjectProfitLoss,
  WorkbookResult,
} from '@/lib/types';

const STORAGE_KEY = 'financial-dashboard-workbook';

type Section = { id: string; label: string };

export default function StatementsPage() {
  const router = useRouter();
  const [workbook, setWorkbook] = useState<WorkbookResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWorkbook(JSON.parse(stored) as WorkbookResult);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <main className="min-h-screen bg-white" />;
  }

  if (!workbook) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            No statements loaded
          </h1>
          <p className="text-sm text-muted mb-5">
            Upload a QuickBooks export on the dashboard first to view full statements.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm bg-foreground text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </main>
    );
  }

  const bs = workbook.reports.find((r) => r.type === 'balance_sheet') as BalanceSheet | undefined;
  const pl = workbook.reports.find((r) => r.type === 'profit_loss') as ProfitLoss | undefined;
  const plByClass = workbook.reports.find(
    (r) => r.type === 'profit_loss_by_class',
  ) as ProfitLossByClass | undefined;
  const projects = workbook.reports.filter(
    (r) => r.type === 'project_profit_loss',
  ) as ProjectProfitLoss[];
  const unknown = workbook.reports.filter((r) => r.type === 'unknown') as {
    type: 'unknown';
    sheetName: string;
  }[];

  const orgName =
    bs?.meta.orgName || pl?.meta.orgName || plByClass?.meta.orgName || 'Organization';
  const period =
    bs?.meta.periodLabel || pl?.meta.periodLabel || plByClass?.meta.periodLabel || '';

  const sections: Section[] = [];
  if (bs) sections.push({ id: 'balance-sheet', label: 'Balance Sheet' });
  if (pl) sections.push({ id: 'profit-loss', label: 'Profit & Loss' });
  if (plByClass) sections.push({ id: 'profit-loss-by-class', label: 'P&L by Class' });
  if (projects.length > 0) {
    projects.forEach((p, i) => {
      const name = p.meta.projectName || p.meta.orgName || `Project ${i + 1}`;
      sections.push({ id: `project-${i}`, label: name });
    });
  }
  if (unknown.length > 0) sections.push({ id: 'unknown', label: 'Unrecognized sheets' });

  return (
    <main className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{orgName}</h1>
            <p className="text-sm text-muted mt-0.5 truncate">{period} · Full Statements</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-[200px_1fr] gap-8">
        <aside className="hidden md:block">
          <div className="sticky top-6">
            <div className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
              Contents
            </div>
            <nav className="flex flex-col gap-1.5 text-sm">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {bs && (
            <section id="balance-sheet" className="scroll-mt-6">
              <BalanceSheetView bs={bs} />
            </section>
          )}
          {pl && (
            <section id="profit-loss" className="scroll-mt-6">
              <ProfitLossView pl={pl} />
            </section>
          )}
          {plByClass && (
            <section id="profit-loss-by-class" className="scroll-mt-6">
              <ProfitLossByClassView plByClass={plByClass} />
            </section>
          )}
          {projects.map((p, i) => (
            <section key={i} id={`project-${i}`} className="scroll-mt-6">
              <ProjectPLView project={p} />
            </section>
          ))}
          {unknown.length > 0 && (
            <section id="unknown" className="scroll-mt-6">
              <div className="border border-warning/40 rounded-xl bg-yellow-50 p-6">
                <div className="text-xs uppercase tracking-wider text-warning font-medium mb-2">
                  Unrecognized sheets
                </div>
                <p className="text-sm text-foreground mb-3">
                  The following sheets were uploaded but we could not detect their report
                  type. They are not shown in Statements.
                </p>
                <ul className="text-sm text-muted list-disc pl-5">
                  {unknown.map((u, i) => (
                    <li key={i}>{u.sheetName}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
