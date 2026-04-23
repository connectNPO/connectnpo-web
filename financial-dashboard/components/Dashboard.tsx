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
      // Expense accounts conventionally start with 5, 6, 7, 8, or 9
      // (Revenue = 4xxx, Assets/Liabilities/Equity = 1xxx-3xxx).
      (r) => !r.isSubtotal && r.accountNumber && /^[5-9]/.test(r.accountNumber),
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
    // Match children by the Program Fees subtotal's own account-number prefix
    // (first 2 digits) rather than a hardcoded "42". Some charts of accounts
    // put Program Fees at 43xx, 44xx, etc., in which case the hardcoded
    // filter would pair the wrong accounts with this subtotal.
    const programFeesPrefix = programFeesSubtotal?.accountNumber?.slice(0, 2);
    const programFeesChildren = programFeesPrefix
      ? pl.revenue.filter(
          (l) =>
            !l.isSubtotal &&
            l.amount > 0 &&
            l.accountNumber?.startsWith(programFeesPrefix),
        )
      : [];
    const totalRev = pl.totals.totalRevenue;

    if (totalRev > 0) {
      // Only trigger the FASB path when the file has BOTH Restricted and
      // Unrestricted line items (a real FASB-taxonomied CoA). If only one
      // exists and is small (e.g. a single "Unrestricted $1,000" line
      // while 98% of revenue sits under other subtotals), the FASB path
      // would show 1.4% and hide the rest. Fall through to the subtotal-
      // based path in that case so Revenue Composition stays complete.
      if (restricted && unrestricted) {
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
      } else {
        // Fallback: use the top revenue category subtotals (e.g. "Total for Grants",
        // "Total for General Fund") so clients with simpler CoAs still see a
        // meaningful Revenue Composition card.
        const categorySubtotals = pl.revenue
          .filter((l) => l.isSubtotal && l.amount !== 0)
          .map((l) => ({
            label: l.accountName.replace(/^Total (for )?/i, ''),
            rawLabel: l.accountName,
            amount: l.amount,
            accountNumber: l.accountNumber,
          }))
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
          .slice(0, 4);

        for (const cat of categorySubtotals) {
          const children = pl.revenue.filter(
            (l) =>
              !l.isSubtotal &&
              l.amount !== 0 &&
              cat.accountNumber &&
              l.accountNumber &&
              l.accountNumber.startsWith(cat.accountNumber.slice(0, 2)),
          );
          revenueItems.push({
            label: cat.label,
            value: Math.abs(cat.amount) / totalRev,
            amount: cat.amount,
            breakdown:
              children.length > 0
                ? children.map((l) => ({ label: l.accountName, amount: l.amount }))
                : undefined,
          });
        }
      }
    }
  }

  const topPct = revenueItems[0]?.value ?? 0;
  const topLabel = revenueItems[0]?.label?.toLowerCase() ?? '';
  const revenueFootnote =
    topPct > 0.8 && /restricted/.test(topLabel)
      ? `Heavy grant dependency — ${Math.round(topPct * 100)}% of revenue is donor-restricted`
      : topPct > 0.8
        ? `Concentration risk — ${Math.round(topPct * 100)}% of revenue comes from a single category`
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
    <main className="min-h-screen">
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
              footnoteTone={topPct > 0.8 ? 'warning' : 'neutral'}
            />
          )}
        </section>

        {(() => {
          // Revenue Breakdown duplicates Revenue Composition when the latter
          // already renders (Revenue Composition has its own fallback path),
          // so only show Revenue Breakdown when Revenue Composition is empty.
          const showRevenueBreakdown =
            revenueItems.length === 0 && (m.revenueBreakdown?.length ?? 0) > 0;
          const showExpenseBreakdown = (m.expenseBreakdown?.length ?? 0) > 0;
          if (!showRevenueBreakdown && !showExpenseBreakdown) return null;
          // When Expense Breakdown is alone in the row, span both columns so
          // the layout stays balanced with the 2-column rows above.
          const expenseSpansFull = showExpenseBreakdown && !showRevenueBreakdown;
          return (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 print:single-col">
              {showRevenueBreakdown && (
                <RatioBar title="Revenue Breakdown" items={m.revenueBreakdown as RatioItem[]} />
              )}
              {showExpenseBreakdown && (
                <div className={expenseSpansFull ? 'md:col-span-2' : ''}>
                  <RatioBar title="Expense Breakdown" items={m.expenseBreakdown as RatioItem[]} />
                </div>
              )}
            </section>
          );
        })()}

        {projectsWithBreakdown.length > 0 && (
          <section>
            <ProjectTable projects={projectsWithBreakdown} />
          </section>
        )}

        <section className="pt-2 print:break-before pdf-break-before">
          <AiActions workbook={workbook} />
        </section>
      </div>
    </main>
  );
}
