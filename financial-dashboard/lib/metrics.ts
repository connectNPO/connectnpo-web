import type {
  BalanceSheet,
  DerivedMetrics,
  ParsedReport,
  ProfitLoss,
  ProfitLossByClass,
  ProjectProfitLoss,
} from './types';

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
  }

  if (plByClass?.functionalExpenseRatio) {
    metrics.functionalRatios = {
      program: plByClass.functionalExpenseRatio.program,
      admin: plByClass.functionalExpenseRatio.admin,
      fundraising: plByClass.functionalExpenseRatio.fundraising,
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
