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

/**
 * Walk through the P&L line items in order and emit one category per logical
 * grouping. Handles three QBO patterns that commonly appear in the same file:
 *
 *   1. Subtotal group — a category header with no amount ("5200 Contract &
 *      Professional Fees"), child line items indented under it, and a
 *      matching "Total for 5200 ..." trailer. Emit the trailer amount as the
 *      category and keep the children as its accordion breakdown.
 *
 *   2. Standalone account — a numbered account with an amount that is NOT
 *      wrapped in a subtotal group ("5430 Event Sponsorship Expense
 *      $50,000"). Emit each as its own category. Without this branch the
 *      amount would be silently dropped from the breakdown, which is how
 *      $50K went missing on the Test Company file.
 *
 *   3. Flat CoA — a file with no subtotals at all. Every line item becomes
 *      its own category (same as the current flat-fallback behavior).
 *
 * Every number that reaches the dashboard comes directly from an Excel cell;
 * this function only decides how to group the rows, never what the numbers
 * should be.
 */
function collectCategories(
  allLines: AccountLine[],
): { label: string; amount: number; accountNumber?: string; children: AccountLine[] }[] {
  const categories: {
    label: string;
    amount: number;
    accountNumber?: string;
    children: AccountLine[];
  }[] = [];

  let pendingHeader: AccountLine | null = null;
  let groupChildren: AccountLine[] = [];

  const headerPrefix = (l: AccountLine) => l.accountNumber?.slice(0, 2);

  function flushOrphanGroup() {
    // An "open" group with no matching "Total for X" trailer. Emit collected
    // children as standalone categories so their amounts are not lost.
    for (const child of groupChildren) {
      if (child.amount !== 0) {
        categories.push({
          label: child.accountName,
          amount: child.amount,
          accountNumber: child.accountNumber,
          children: [],
        });
      }
    }
    pendingHeader = null;
    groupChildren = [];
  }

  for (const line of allLines) {
    const isGrandTotal =
      line.isSubtotal && GRAND_TOTAL_PATTERN.test(line.accountName.trim());
    if (isGrandTotal) continue; // Never emit the grand total line itself.

    // Subtotal trailer that closes the currently open group ("Total for 5200
    // Contract & Professional Fees" matching "5200 Contract & Professional
    // Fees" header).
    if (
      line.isSubtotal &&
      pendingHeader &&
      headerPrefix(line) &&
      headerPrefix(line) === headerPrefix(pendingHeader)
    ) {
      if (line.amount !== 0) {
        categories.push({
          label: line.accountName.replace(/^Total (for )?/i, ''),
          amount: line.amount,
          accountNumber: line.accountNumber,
          children: groupChildren.filter((c) => c.amount !== 0),
        });
      }
      pendingHeader = null;
      groupChildren = [];
      continue;
    }

    // Category header: a numbered row with no amount that is not itself a
    // subtotal or section header. "5200 Contract & Professional Fees" with
    // empty column B is the canonical example.
    const isHeader =
      !!line.accountNumber &&
      !line.isSubtotal &&
      !line.isSectionHeader &&
      line.amount === 0;
    if (isHeader) {
      // If a previous group was still open without a matching trailer, flush
      // it so we do not silently merge two unrelated groups.
      if (pendingHeader) flushOrphanGroup();
      pendingHeader = line;
      groupChildren = [];
      continue;
    }

    // Inside an open group: non-subtotal lines are collected as children;
    // subtotals that do not match the header prefix are unexpected but are
    // treated as closing-and-reopening events.
    if (pendingHeader) {
      if (!line.isSubtotal) {
        groupChildren.push(line);
      } else if (line.amount !== 0) {
        // Unmatched subtotal — emit as its own category and keep the group
        // open (rare: typically indicates a malformed P&L).
        categories.push({
          label: line.accountName.replace(/^Total (for )?/i, ''),
          amount: line.amount,
          accountNumber: line.accountNumber,
          children: [],
        });
      }
      continue;
    }

    // Outside any group: emit standalone accounts (the key fix) and any
    // stray subtotals as their own categories.
    if (line.isSubtotal) {
      if (line.amount !== 0) {
        categories.push({
          label: line.accountName.replace(/^Total (for )?/i, ''),
          amount: line.amount,
          accountNumber: line.accountNumber,
          children: [],
        });
      }
    } else if (!line.isSectionHeader && line.amount !== 0) {
      categories.push({
        label: line.accountName,
        amount: line.amount,
        accountNumber: line.accountNumber,
        children: [],
      });
    }
  }

  if (pendingHeader) flushOrphanGroup();
  return categories;
}

function buildGenericBreakdown(sections: AccountLine[][], total: number): CategoryBreakdown[] {
  const denom = Math.abs(total);
  if (!denom) return [];

  const allLines = sections.flat();
  const TOP = 8;

  const categories = collectCategories(allLines).sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
  );

  if (categories.length === 0) return [];

  const primary = categories.length > TOP ? categories.slice(0, TOP - 1) : categories;
  const overflow = categories.length > TOP ? categories.slice(TOP - 1) : [];

  const result: CategoryBreakdown[] = primary.map((c) => ({
    label: c.label,
    value: Math.abs(c.amount) / denom,
    amount: c.amount,
    breakdown:
      c.children.length > 0
        ? c.children.map((l) => ({ label: l.accountName, amount: l.amount }))
        : undefined,
  }));

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
