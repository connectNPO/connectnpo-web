import { KpiCard } from '@/components/KpiCard';
import { RatioBar, type RatioItem } from '@/components/RatioBar';
import { ProjectTable, type Project } from '@/components/ProjectTable';
import { PageHeader } from '@/components/PageHeader';
import { AiActions } from '@/components/AiActions';
import { formatCurrency, formatMultiplier, formatNumber } from '@/lib/format';
import type {
  BalanceSheet,
  ProfitLoss,
  ProfitLossByClass,
  ProjectProfitLoss,
  WorkbookResult,
} from '@/lib/types';

interface DashboardProps {
  workbook: WorkbookResult;
  onReset: () => void;
}

export function Dashboard({ workbook, onReset }: DashboardProps) {
  const m = workbook.derivedMetrics ?? {};

  const bs = workbook.reports.find((r) => r.type === 'balance_sheet') as BalanceSheet | undefined;
  const pl = workbook.reports.find((r) => r.type === 'profit_loss') as ProfitLoss | undefined;
  const plClass = workbook.reports.find((r) => r.type === 'profit_loss_by_class') as
    | ProfitLossByClass
    | undefined;
  const projects = workbook.reports.filter(
    (r) => r.type === 'project_profit_loss',
  ) as ProjectProfitLoss[];

  const orgName = bs?.meta.orgName ?? pl?.meta.orgName ?? plClass?.meta.orgName ?? 'Organization';
  const period = pl?.meta.periodLabel ?? bs?.meta.periodLabel ?? plClass?.meta.periodLabel ?? '';

  const cashBank = bs?.assets.currentAssets.find((l) => l.accountNumber?.startsWith('10'));
  const cashSublabel = cashBank ? cashBank.accountName : undefined;

  const runwayValue = m.monthsOfRunway ? formatNumber(m.monthsOfRunway, 1) : '—';
  const runwaySub = m.monthlyBurnRate
    ? `at ${formatCurrency(m.monthlyBurnRate)}/mo burn`
    : undefined;

  const ytdValue = formatCurrency(m.ytdNetRevenue, { showSign: true });
  const ytdTone: 'positive' | 'negative' | 'neutral' =
    m.ytdNetRevenue && m.ytdNetRevenue > 0
      ? 'positive'
      : m.ytdNetRevenue && m.ytdNetRevenue < 0
        ? 'negative'
        : 'neutral';

  // --- Functional Expense breakdowns from P&L by Class ---
  const expenseBreakdown = (classPatterns: RegExp[]) => {
    if (!plClass) return undefined;
    const relevantClasses = plClass.classes.filter((c) =>
      classPatterns.some((p) => p.test(c)) && !/total/i.test(c),
    );
    if (relevantClasses.length === 0) return undefined;

    const expenseRows = plClass.rows.filter(
      (r) => !r.isSubtotal && r.accountNumber && r.accountNumber.startsWith('5'),
    );

    const lines: { label: string; amount: number }[] = [];
    for (const row of expenseRows) {
      let total = 0;
      for (const cls of relevantClasses) {
        const v = row.byClass[cls];
        if (typeof v === 'number') total += v;
      }
      if (total > 0) lines.push({ label: row.accountName, amount: total });
    }
    return lines.sort((a, b) => b.amount - a.amount);
  };

  const programBreakdown = expenseBreakdown([/^100 Programs$/, /^110 /, /^120 /, /^130 /]);
  const adminBreakdown = expenseBreakdown([/management|general|admin/i]);
  const fundraisingBreakdown = expenseBreakdown([/fundraising/i]);

  const functionalItems: RatioItem[] = m.functionalRatios
    ? [
        {
          label: 'Program Expenses',
          value: m.functionalRatios.program,
          amount: m.functionalRatios.programAmount,
          tone: 'positive',
          breakdown: programBreakdown,
        },
        {
          label: 'Management & General',
          value: m.functionalRatios.admin,
          amount: m.functionalRatios.adminAmount,
          breakdown: adminBreakdown,
        },
        {
          label: 'Fundraising',
          value: m.functionalRatios.fundraising,
          amount: m.functionalRatios.fundraisingAmount,
          breakdown: fundraisingBreakdown,
        },
      ]
    : [];

  const programPctDisplay = m.functionalRatios ? m.functionalRatios.program * 100 : 0;
  const functionalFootnote = m.functionalRatios
    ? programPctDisplay >= 85
      ? `Excellent — Program ratio exceeds 85% benchmark (top tier)`
      : programPctDisplay >= 65
        ? `Healthy — Program ratio meets 65% minimum`
        : `Below 65% benchmark — consider expense reallocation`
    : undefined;
  const functionalTone: 'positive' | 'warning' | 'negative' | 'neutral' = m.functionalRatios
    ? programPctDisplay >= 85
      ? 'positive'
      : programPctDisplay >= 65
        ? 'neutral'
        : 'warning'
    : 'neutral';

  // --- Revenue composition ---
  const revenueItems: RatioItem[] = [];
  if (pl) {
    const restricted = pl.revenue.find((l) => /temporary restricted/i.test(l.accountName));
    const unrestricted = pl.revenue.find((l) => /unrestricted/i.test(l.accountName));
    const programFeesSubtotal = pl.revenue.find(
      (l) => l.isSubtotal && /program service fees/i.test(l.accountName),
    );
    const programFeesChildren = pl.revenue.filter(
      (l) => !l.isSubtotal && l.accountNumber?.startsWith('42') && l.amount > 0,
    );
    const totalRev = pl.totals.totalRevenue;

    if (totalRev > 0) {
      if (restricted) {
        revenueItems.push({
          label: 'Restricted Contributions',
          value: restricted.amount / totalRev,
          amount: restricted.amount,
          tone: 'warning',
          breakdown: [{ label: restricted.accountName, amount: restricted.amount }],
        });
      }
      if (unrestricted) {
        revenueItems.push({
          label: 'Unrestricted Contributions',
          value: unrestricted.amount / totalRev,
          amount: unrestricted.amount,
          breakdown: [{ label: unrestricted.accountName, amount: unrestricted.amount }],
        });
      }
      if (programFeesSubtotal && programFeesSubtotal.amount > 0) {
        revenueItems.push({
          label: 'Program Service Fees',
          value: programFeesSubtotal.amount / totalRev,
          amount: programFeesSubtotal.amount,
          breakdown: programFeesChildren.map((l) => ({
            label: l.accountName,
            amount: l.amount,
          })),
        });
      }
    }
  }

  const restrictedPct = revenueItems[0]?.value ?? 0;
  const revenueFootnote =
    restrictedPct > 0.8
      ? `Heavy grant dependency — ${Math.round(restrictedPct * 100)}% of revenue is donor-restricted`
      : undefined;

  // --- Project Profitability breakdowns ---
  const projectsWithBreakdown: Project[] = (m.projectProfitability ?? []).map((p) => {
    const match = projects.find(
      (proj) => (proj.meta.projectName || proj.meta.orgName) === p.name,
    );
    if (!match) return p;
    return {
      ...p,
      breakdown: {
        revenue: match.revenue
          .filter((l) => !l.isSubtotal && l.amount > 0)
          .map((l) => ({ label: l.accountName, amount: l.amount })),
        expenditures: match.expenditures
          .filter((l) => !l.isSubtotal && l.amount > 0)
          .map((l) => ({ label: l.accountName, amount: l.amount })),
        totalRevenue: match.totals.totalRevenue,
        totalExpenditures: match.totals.totalExpenditures,
        netRevenue: match.totals.netRevenue,
      },
    };
  });

  return (
    <main className="min-h-screen bg-white">
      <PageHeader orgName={orgName} period={period} onReset={onReset} />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 print:single-col">
          <KpiCard
            label="Cash on hand"
            value={formatCurrency(m.cashOnHand)}
            sublabel={cashSublabel}
          />
          <KpiCard label="Months of runway" value={runwayValue} sublabel={runwaySub} />
          <KpiCard
            label="YTD Net Revenue"
            value={ytdValue}
            tone={ytdTone}
            sublabel={`${formatMultiplier(m.currentRatio)} current ratio · ${m.debtToAssets ? `${(m.debtToAssets * 100).toFixed(1)}%` : '—'} debt`}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 print:single-col">
          {functionalItems.length > 0 && (
            <RatioBar
              title="Functional Expenses (990 Part IX)"
              items={functionalItems}
              footnote={functionalFootnote}
              footnoteTone={functionalTone}
            />
          )}
          {revenueItems.length > 0 && (
            <RatioBar
              title="Revenue Composition"
              items={revenueItems}
              footnote={revenueFootnote}
              footnoteTone={restrictedPct > 0.8 ? 'warning' : 'neutral'}
            />
          )}
        </section>

        {projectsWithBreakdown.length > 0 && (
          <section>
            <ProjectTable projects={projectsWithBreakdown} />
          </section>
        )}

        <section className="pt-2 print:break-before">
          <AiActions workbook={workbook} />
        </section>
      </div>
    </main>
  );
}
