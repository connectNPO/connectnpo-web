import type { ReportType } from './types';

export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s$]/g, '').replace(/[()]/g, '');
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    if (value.includes('(') && value.includes(')')) return -parsed;
    return parsed;
  }
  return 0;
}

export function countLeadingSpaces(label: string): number {
  const match = label.match(/^(\s*)/);
  if (!match) return 0;
  return match[1].length;
}

export function indentLevel(label: string): number {
  const spaces = countLeadingSpaces(label);
  return Math.floor(spaces / 3);
}

export function cleanLabel(label: string): string {
  return label.trim();
}

export function extractAccountNumber(label: string): string | undefined {
  const trimmed = label.trim();
  // Normal account line: "4000 Grants"
  const normal = trimmed.match(/^(\d{3,4})\s+/);
  if (normal) return normal[1];
  // Subtotal rows: "Total for 4000 Grants" or "Total 4000 Grants"
  const subtotal = trimmed.match(/^Total (?:for )?(\d{3,4})\s+/i);
  if (subtotal) return subtotal[1];
  return undefined;
}

export function isSubtotalLabel(label: string): boolean {
  const trimmed = label.trim();
  return (
    trimmed.startsWith('Total for ') ||
    trimmed.startsWith('Total ') ||
    trimmed === 'Gross Profit' ||
    trimmed === 'Net Operating Revenue' ||
    trimmed === 'Net Other Revenue' ||
    trimmed === 'Net Revenue' ||
    trimmed === 'Net Income'
  );
}

export function detectReportType(sheetName: string, headerText?: string): ReportType {
  const name = sheetName.toLowerCase();
  const header = (headerText || '').toLowerCase();
  const both = `${name} ${header}`;

  // Balance Sheet
  if (
    both.includes('balance sheet') ||
    both.includes('statement of financial position') ||
    both.includes('statement of assets')
  ) {
    return 'balance_sheet';
  }

  // P&L by Class — check before generic P&L so "by class" wins
  if (
    both.includes('by class') ||
    both.includes('by program') ||
    both.includes('by department') ||
    both.includes('by fund') ||
    both.includes('statement of functional expenses') ||
    header.includes('statement of activity by class')
  ) {
    return 'profit_loss_by_class';
  }

  // Project P&L — check before generic P&L
  if (
    both.includes('project profitability') ||
    both.includes('by project') ||
    both.includes('by customer') ||
    header.includes('statement of activity by custom')
  ) {
    return 'project_profit_loss';
  }

  // Profit & Loss (generic)
  if (
    both.includes('profit and loss') ||
    both.includes('profit & loss') ||
    both.includes('income statement') ||
    both.includes('statement of activity') ||
    both.includes('statement of activities') ||
    both.includes('statement of operations') ||
    both.includes('revenue and expense') ||
    name === 'p&l' ||
    name.includes('p & l')
  ) {
    return 'profit_loss';
  }

  return 'unknown';
}
