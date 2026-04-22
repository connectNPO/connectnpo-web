import type {
  AccountLine,
  BalanceSheet,
  CategoryBreakdown,
  DerivedMetrics,
  ParsedReport,
  ProfitLoss,
  ProfitLossByClass,
  ProjectProfitLoss,
} from './types';

const GRAND_TOTAL_PATTERN = /^Total (for )?(Revenue|Income|Expenditures|Expense|Expenses)$/i;

function buildGenericBreakdown(sections: AccountLine[][], total: number): CategoryBreakdown[] {
  const denom = Math.abs(total);
  if (!denom) return [];

  const allLines = sections.flat();
  const TOP = 8;

  const subtotals = allLines.filter(
    (l) => l.isSubtotal && l.amount !== 0 && !GRAND_TOTAL_PATTERN.test(l.accountName.trim()),
  );

  // Subtotal-based path: QBO CoA with category groupings (Grants / Contributions / etc.).
  if (subtotals.length > 0) {
    const minIndent = Math.min(...subtotals.map((l) => l.indentLevel));
    const categories = subtotals
      .filter((l) => l.indentLevel === minIndent)
      .map((l) => ({
        label: l.accountName.replace(/^Total (for )?/i, ''),
        amount: l.amount,
        accountNumber: l.accountNumber,
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    if (categories.length === 0) return [];

    const primary = categories.length > TOP ? categories.slice(0, TOP - 1) : categories;
    const overflow = categories.length > TOP ? categories.slice(TOP - 1) : [];

    const result: CategoryBreakdown[] = primary.map((c) => {
      const prefix = c.accountNumber ? c.accountNumber.slice(0, 2) : undefined;
      const children = prefix
        ? allLines
            .filter(
              (l) =>
                !l.isSubtotal &&
                l.amount !== 0 &&
                l.accountNumber &&
                l.accountNumber.startsWith(prefix),
            )
            .map((l) => ({ label: l.accountName, amount: l.amount }))
        : [];
      return {
        label: c.label,
        value: Math.abs(c.amount) / denom,
        amount: c.amount,
        breakdown: children.length > 0 ? children : undefined,
      };
    });

    if (overflow.length > 0) {
      const otherAmount = overflow.reduce((s, c) => s + c.amount, 0);
      result.push({
        label: 'Other',
        value: Math.abs(otherAmount) / denom,
        amount: otherAmount,
        breakdown: overflow.map((c) => ({ label: c.label, amount: c.amount })),
      });
    }
    return result;
  }

  // Flat CoA fallback: no subtotals, so each line item becomes a category.
  const lines = allLines
    .filter((l) => !l.isSubtotal && l.amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  if (lines.length === 0) return [];

  const primary = lines.length > TOP ? lines.slice(0, TOP - 1) : lines;
  const overflow = lines.length > TOP ? lines.slice(TOP - 1) : [];

  const result: CategoryBreakdown[] = primary.map((l) => ({
    label: l.accountName,
    value: Math.abs(l.amount) / denom,
    amount: l.amount,
  }));
  if (overflow.length > 0) {
    const otherAmount = overflow.reduce((s, l) => s + l.amount, 0);
    result.push({
      label: 'Other',
      value: Math.abs(otherAmount) / denom,
      amount: otherAmount,
      breakdown: overflow.map((l) => ({ label: l.accountName, amount: l.amount })),
    });
  }
  return result;
}

function monthsInPeriod(periodLabel: string): number {
  const match = periodLabel.match(/([A-Za-z]+)\s+\d+,?\s*(\d{4})\s*-\s*([A-Za-z]+)\s+\d+,?\s*(\d{4})/);
  if (!match) {
    const simple = periodLabel.match(/([A-Za-z]+)\s+(\d{4})\s*-\s*([A-Za-z]+)\s+(\d{4})/);
    if (!simple) return 12;
    return monthDiff(simple[1], Number(simple[2]), simple[3], Number(simple[4]));
  }
  return monthDiff(match[1], Number(match[2]), match[3], Number(match[4]));
}

function monthDiff(m1: string, y1: number, m2: string, y2: number): number {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const a = months.indexOf(m1.slice(0, 3).toLowerCase());
  const b = months.indexOf(m2.slice(0, 3).toLowerCase());
  if (a < 0 || b < 0) return 12;
  return (y2 - y1) * 12 + (b - a) + 1;
}

export function deriveMetrics(reports: ParsedReport[]): DerivedMetrics {
  const bs = reports.find((r) => r.type === 'balance_sheet') as BalanceSheet | undefined;
  const pl = reports.find((r) => r.type === 'profit_loss') as ProfitLoss | undefined;
  const plByClass = reports.find((r) => r.type === 'profit_loss_by_class') as ProfitLossByClass | undefined;
  const projects = reports.filter((r) => r.type === 'project_profit_loss') as ProjectProfitLoss[];

  const metrics: DerivedMetrics = {};

  if (bs) {
    const bankAccounts = bs.assets.currentAssets.filter(
      (l) => l.accountNumber?.startsWith('10') && !l.isSubtotal,
    );
    metrics.cashOnHand = bankAccounts.reduce((sum, l) => sum + l.amount, 0);

    const designatedCash = bankAccounts
      .filter((l) => /designated|restricted/i.test(l.accountName))
      .reduce((sum, l) => sum + l.amount, 0);
    metrics.unrestrictedCashEstimate = metrics.cashOnHand - designatedCash;

    if (bs.totals.totalCurrentLiabilities > 0 && bs.totals.totalCurrentAssets > 0) {
      metrics.currentRatio = bs.totals.totalCurrentAssets / bs.totals.totalCurrentLiabilities;
    }

    if (bs.totals.totalAssets > 0) {
      metrics.debtToAssets = bs.totals.totalLiabilities / bs.totals.totalAssets;
    }
  }

  if (pl) {
    metrics.ytdNetRevenue = pl.totals.netRevenue;

    const months = monthsInPeriod(pl.meta.periodLabel);
    if (months > 0 && pl.totals.totalExpenditures > 0) {
      metrics.monthlyBurnRate = pl.totals.totalExpenditures / months;
      if (metrics.cashOnHand && metrics.monthlyBurnRate > 0) {
        metrics.monthsOfRunway = metrics.cashOnHand / metrics.monthlyBurnRate;
      }
    }

    const revenueTotal = pl.totals.totalRevenue + pl.totals.totalOtherRevenue;
    if (revenueTotal !== 0) {
      const breakdown = buildGenericBreakdown([pl.revenue, pl.otherRevenue], revenueTotal);
      if (breakdown.length > 0) metrics.revenueBreakdown = breakdown;
    }

    const expenseTotal = pl.totals.totalExpenditures + pl.totals.totalOtherExpenditures;
    if (expenseTotal !== 0) {
      const breakdown = buildGenericBreakdown(
        [pl.expenditures, pl.otherExpenditures],
        expenseTotal,
      );
      if (breakdown.length > 0) metrics.expenseBreakdown = breakdown;
    }
  }

  if (plByClass?.functionalExpenseRatio) {
    const fer = plByClass.functionalExpenseRatio;
    metrics.functionalRatios = {
      program: fer.program,
      admin: fer.admin,
      fundraising: fer.fundraising,
      programAmount: fer.program * fer.totalExpenses,
      adminAmount: fer.admin * fer.totalExpenses,
      fundraisingAmount: fer.fundraising * fer.totalExpenses,
    };
  }

  if (projects.length > 0) {
    metrics.projectProfitability = projects
      .map((p) => ({
        name: p.meta.projectName || p.meta.orgName,
        netRevenue: p.totals.netRevenue,
      }))
      .sort((a, b) => b.netRevenue - a.netRevenue);
  }

  return metrics;
}
