import path from 'node:path';
import { parseWorkbook } from '@/lib/workbook';
import { KpiCard } from '@/components/KpiCard';
import { RatioBar } from '@/components/RatioBar';
import { ProjectTable } from '@/components/ProjectTable';
import { PageHeader } from '@/components/PageHeader';
import { AiActions } from '@/components/AiActions';
import { formatCurrency, formatMultiplier, formatNumber } from '@/lib/format';
import type { BalanceSheet, ProfitLoss, ProfitLossByClass } from '@/lib/types';

export default async function DashboardPage() {
  const samplePath = path.join(process.cwd(), 'samples', 'abc-org-july-march-2026.xlsx');
  const result = await parseWorkbook(samplePath);
  const m = result.derivedMetrics ?? {};

  const bs = result.reports.find((r) => r.type === 'balance_sheet') as BalanceSheet | undefined;
  const pl = result.reports.find((r) => r.type === 'profit_loss') as ProfitLoss | undefined;
  const plClass = result.reports.find((r) => r.type === 'profit_loss_by_class') as
    | ProfitLossByClass
    | undefined;

  const orgName = bs?.meta.orgName ?? pl?.meta.orgName ?? 'Organization';
  const period = pl?.meta.periodLabel ?? bs?.meta.periodLabel ?? '';

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

  const functionalItems = m.functionalRatios
    ? [
        {
          label: 'Program Services',
          value: m.functionalRatios.program,
          tone: 'positive' as const,
        },
        { label: 'Management & General', value: m.functionalRatios.admin },
        { label: 'Fundraising', value: m.functionalRatios.fundraising },
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

  const revenueItems: { label: string; value: number; tone?: 'neutral' | 'warning' }[] = [];
  if (pl) {
    const restricted = pl.revenue.find((l) => /temporary restricted/i.test(l.accountName));
    const unrestricted = pl.revenue.find((l) => /unrestricted/i.test(l.accountName));
    const programFees = pl.revenue.find((l) => /program service fees/i.test(l.accountName) && l.isSubtotal);
    const totalRev = pl.totals.totalRevenue;
    if (totalRev > 0) {
      if (restricted) {
        revenueItems.push({
          label: 'Restricted Contributions',
          value: restricted.amount / totalRev,
          tone: 'warning',
        });
      }
      if (unrestricted) {
        revenueItems.push({
          label: 'Unrestricted Contributions',
          value: unrestricted.amount / totalRev,
        });
      }
      if (programFees) {
        revenueItems.push({
          label: 'Program Service Fees',
          value: programFees.amount / totalRev,
        });
      }
    }
  }

  const restrictedPct = revenueItems[0]?.value ?? 0;
  const revenueFootnote =
    restrictedPct > 0.8
      ? `Heavy grant dependency — ${Math.round(restrictedPct * 100)}% of revenue is donor-restricted`
      : undefined;

  return (
    <main className="min-h-screen bg-white">
      <PageHeader orgName={orgName} period={period} />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Cash on hand"
            value={formatCurrency(m.cashOnHand)}
            sublabel={cashSublabel}
          />
          <KpiCard
            label="Months of runway"
            value={runwayValue}
            sublabel={runwaySub}
          />
          <KpiCard
            label="YTD Net Revenue"
            value={ytdValue}
            tone={ytdTone}
            sublabel={`${formatMultiplier(m.currentRatio)} current ratio · ${m.debtToAssets ? `${(m.debtToAssets * 100).toFixed(1)}%` : '—'} debt`}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {m.projectProfitability && m.projectProfitability.length > 0 && (
          <section>
            <ProjectTable projects={m.projectProfitability} />
          </section>
        )}

        <section className="pt-2">
          <AiActions />
        </section>
      </div>
    </main>
  );
}
