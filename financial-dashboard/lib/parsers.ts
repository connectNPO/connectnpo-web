import type {
  AccountLine,
  BalanceSheet,
  ProfitLoss,
  ProfitLossByClass,
  ProjectProfitLoss,
  ReportMeta,
} from './types';
import {
  cleanLabel,
  countLeadingSpaces,
  extractAccountNumber,
  indentLevel,
  isSubtotalLabel,
  toNumber,
} from './utils';

type Row = (string | number | null | undefined)[];

function nonEmpty(row: Row): boolean {
  return row.some((c) => c !== null && c !== undefined && c !== '');
}

function extractMeta(rows: Row[], sheetName: string): ReportMeta {
  const nonEmptyRows = rows.filter(nonEmpty);
  const reportName = String(nonEmptyRows[0]?.[0] ?? sheetName).trim();
  const orgName = String(nonEmptyRows[1]?.[0] ?? '').trim();
  const periodLabel = String(nonEmptyRows[2]?.[0] ?? '').trim();

  let projectName: string | undefined;
  const projectMatch = orgName.match(/Project Profitability for (.+)/i);
  if (projectMatch) {
    projectName = projectMatch[1].replace(/['"]s /, ': ').trim();
  }

  return { reportName, orgName, periodLabel, projectName };
}

function toAccountLine(label: string, amount: unknown, memo?: unknown): AccountLine {
  const spaces = countLeadingSpaces(label);
  const cleaned = cleanLabel(label);
  return {
    accountNumber: extractAccountNumber(label),
    accountName: cleaned,
    amount: toNumber(amount),
    indentLevel: indentLevel(label),
    isSubtotal: isSubtotalLabel(label),
    memo: memo ? String(memo).trim() : undefined,
  };
}

export function parseBalanceSheet(rows: Row[], sheetName: string): BalanceSheet {
  const meta = extractMeta(rows, sheetName);

  const assets: BalanceSheet['assets'] = {
    currentAssets: [],
    fixedAssets: [],
    otherAssets: [],
    total: 0,
  };
  const liabilities: BalanceSheet['liabilities'] = {
    currentLiabilities: [],
    total: 0,
  };
  const equity: BalanceSheet['equity'] = {
    lines: [],
    total: 0,
  };
  const totals = {
    totalAssets: 0,
    totalCurrentAssets: 0,
    totalFixedAssets: 0,
    totalOtherAssets: 0,
    totalLiabilities: 0,
    totalCurrentLiabilities: 0,
    totalEquity: 0,
    totalLiabilitiesAndEquity: 0,
  };

  const SECTION_HEADERS = new Set([
    'Bank Accounts',
    'Accounts Receivable',
    'Other Current Assets',
    'Accounts Payable',
    'Credit Cards',
    'Other Current Liabilities',
  ]);

  type Section = 'none' | 'current_assets' | 'fixed_assets' | 'other_assets' | 'liabilities' | 'equity';
  let section: Section = 'none';

  for (const row of rows) {
    if (!nonEmpty(row)) continue;
    const label = String(row[0] ?? '');
    const labelClean = label.trim();
    if (!labelClean) continue;
    const amount = row[1];
    const memo = row[2];

    if (labelClean === 'Assets') continue;
    if (labelClean === 'Current Assets') { section = 'current_assets'; continue; }
    if (labelClean === 'Fixed Assets') { section = 'fixed_assets'; continue; }
    if (labelClean === 'Other Assets') { section = 'other_assets'; continue; }
    if (labelClean === 'Liabilities' || labelClean === 'Liabilities and Equity') continue;
    if (labelClean === 'Current Liabilities') { section = 'liabilities'; continue; }
    if (labelClean === 'Equity') { section = 'equity'; continue; }

    if (SECTION_HEADERS.has(labelClean)) continue;

    if (labelClean === 'Total for Current Assets') {
      totals.totalCurrentAssets = toNumber(amount);
      continue;
    }
    if (labelClean === 'Total for Fixed Assets') {
      totals.totalFixedAssets = toNumber(amount);
      continue;
    }
    if (labelClean === 'Total for Other Assets') {
      totals.totalOtherAssets = toNumber(amount);
      continue;
    }
    if (labelClean === 'Total for Assets') {
      totals.totalAssets = toNumber(amount);
      assets.total = totals.totalAssets;
      continue;
    }
    if (labelClean === 'Total for Current Liabilities') {
      totals.totalCurrentLiabilities = toNumber(amount);
      continue;
    }
    if (labelClean === 'Total for Liabilities') {
      totals.totalLiabilities = toNumber(amount);
      liabilities.total = totals.totalLiabilities;
      continue;
    }
    if (labelClean === 'Total for Equity') {
      totals.totalEquity = toNumber(amount);
      equity.total = totals.totalEquity;
      continue;
    }
    if (labelClean === 'Total for Liabilities and Equity') {
      totals.totalLiabilitiesAndEquity = toNumber(amount);
      continue;
    }

    if (labelClean.startsWith('Total for ')) continue;
    if (labelClean.includes('Accrual Basis') || labelClean.includes('GMT')) continue;

    const line = toAccountLine(label, amount, memo);

    switch (section) {
      case 'current_assets': assets.currentAssets.push(line); break;
      case 'fixed_assets': assets.fixedAssets.push(line); break;
      case 'other_assets': assets.otherAssets.push(line); break;
      case 'liabilities': liabilities.currentLiabilities.push(line); break;
      case 'equity': equity.lines.push(line); break;
    }
  }

  return { type: 'balance_sheet', meta, assets, liabilities, equity, totals };
}

export function parseProfitLoss(rows: Row[], sheetName: string): ProfitLoss {
  const meta = extractMeta(rows, sheetName);

  const result: ProfitLoss = {
    type: 'profit_loss',
    meta,
    revenue: [],
    expenditures: [],
    otherRevenue: [],
    otherExpenditures: [],
    totals: {
      totalRevenue: 0,
      grossProfit: 0,
      totalExpenditures: 0,
      netOperatingRevenue: 0,
      totalOtherRevenue: 0,
      totalOtherExpenditures: 0,
      netOtherRevenue: 0,
      netRevenue: 0,
    },
  };

  type Section = 'none' | 'revenue' | 'expenditures' | 'other_revenue' | 'other_expenditures';
  let section: Section = 'none';

  for (const row of rows) {
    if (!nonEmpty(row)) continue;
    const label = String(row[0] ?? '').trim();
    if (!label) continue;
    const amount = row[1];
    const memo = row[2];

    if (label === 'Revenue') { section = 'revenue'; continue; }
    if (label === 'Expenditures') { section = 'expenditures'; continue; }
    if (label === 'Other Revenue') { section = 'other_revenue'; continue; }
    if (label === 'Other Expenditures') { section = 'other_expenditures'; continue; }
    if (label === 'Cost of Goods Sold') continue;

    if (label === 'Total for Revenue') {
      result.totals.totalRevenue = toNumber(amount);
      continue;
    }
    if (label === 'Gross Profit') {
      result.totals.grossProfit = toNumber(amount);
      continue;
    }
    if (label === 'Total for Expenditures') {
      result.totals.totalExpenditures = toNumber(amount);
      continue;
    }
    if (label === 'Net Operating Revenue') {
      result.totals.netOperatingRevenue = toNumber(amount);
      continue;
    }
    if (label === 'Total for Other Revenue') {
      result.totals.totalOtherRevenue = toNumber(amount);
      continue;
    }
    if (label === 'Total for Other Expenditures') {
      result.totals.totalOtherExpenditures = toNumber(amount);
      continue;
    }
    if (label === 'Net Other Revenue') {
      result.totals.netOtherRevenue = toNumber(amount);
      continue;
    }
    if (label === 'Net Revenue') {
      result.totals.netRevenue = toNumber(amount);
      continue;
    }
    if (label.includes('Accrual Basis') || label.includes('GMT')) continue;

    const line = toAccountLine(String(row[0]), amount, memo);

    switch (section) {
      case 'revenue': result.revenue.push(line); break;
      case 'expenditures': result.expenditures.push(line); break;
      case 'other_revenue': result.otherRevenue.push(line); break;
      case 'other_expenditures': result.otherExpenditures.push(line); break;
    }
  }

  return result;
}

export function parseProjectProfitLoss(rows: Row[], sheetName: string): ProjectProfitLoss {
  const pl = parseProfitLoss(rows, sheetName);
  return {
    type: 'project_profit_loss',
    meta: pl.meta,
    revenue: pl.revenue,
    expenditures: pl.expenditures,
    totals: {
      totalRevenue: pl.totals.totalRevenue,
      totalExpenditures: pl.totals.totalExpenditures,
      netRevenue: pl.totals.netRevenue,
    },
  };
}

export function parseProfitLossByClass(rows: Row[], sheetName: string): ProfitLossByClass {
  const meta = extractMeta(rows, sheetName);

  const nonEmptyRows = rows.filter(nonEmpty);
  const headerRowIdx = nonEmptyRows.findIndex((r) => {
    const firstCell = String(r[0] ?? '').trim();
    return firstCell === '' && r.slice(1).some((c) => c && String(c).trim() !== '');
  });

  const headerRow = headerRowIdx >= 0 ? nonEmptyRows[headerRowIdx] : [];
  const classes: string[] = [];
  for (let i = 1; i < headerRow.length; i++) {
    const val = String(headerRow[i] ?? '').trim();
    if (val) classes.push(val);
  }

  const dataRows = rows.slice(rows.indexOf(headerRow) + 1);
  const parsedRows: ProfitLossByClass['rows'] = [];

  for (const row of dataRows) {
    if (!nonEmpty(row)) continue;
    const rawLabel = String(row[0] ?? '');
    const label = rawLabel.trim();
    if (!label) continue;
    if (label.includes('Accrual Basis') || label.includes('GMT')) continue;

    const byClass: Record<string, number | null> = {};
    for (let i = 0; i < classes.length; i++) {
      const cell = row[i + 1];
      byClass[classes[i]] = cell === null || cell === undefined || cell === '' ? null : toNumber(cell);
    }
    const total = toNumber(row[classes.length] ?? 0);

    parsedRows.push({
      accountName: label,
      accountNumber: extractAccountNumber(rawLabel),
      indentLevel: indentLevel(rawLabel),
      isSubtotal: isSubtotalLabel(rawLabel),
      byClass,
      total,
    });
  }

  const functionalExpenseRatio = calculateFunctionalRatio(parsedRows, classes);

  return {
    type: 'profit_loss_by_class',
    meta,
    classes,
    rows: parsedRows,
    functionalExpenseRatio,
  };
}

function calculateFunctionalRatio(
  rows: ProfitLossByClass['rows'],
  classes: string[],
): ProfitLossByClass['functionalExpenseRatio'] {
  const totalExpRow = rows.find((r) => r.accountName === 'Total for Expenditures');
  if (!totalExpRow) return undefined;

  const programClass = classes.find((c) => /programs?/i.test(c) && /total/i.test(c));
  const adminClass = classes.find((c) => /management|general|admin/i.test(c));
  const fundraisingClass = classes.find((c) => /fundraising/i.test(c));

  if (!programClass || !adminClass || !fundraisingClass) return undefined;

  const program = Number(totalExpRow.byClass[programClass] ?? 0);
  const admin = Number(totalExpRow.byClass[adminClass] ?? 0);
  const fundraising = Number(totalExpRow.byClass[fundraisingClass] ?? 0);
  const totalExpenses = program + admin + fundraising;

  if (totalExpenses === 0) return undefined;

  return {
    program: program / totalExpenses,
    admin: admin / totalExpenses,
    fundraising: fundraising / totalExpenses,
    totalExpenses,
  };
}
