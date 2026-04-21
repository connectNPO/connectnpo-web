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
  const match = trimmed.match(/^(\d{3,4})\s+/);
  return match ? match[1] : undefined;
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

  if (
    name.includes('financial position') ||
    name.includes('balance sheet') ||
    header.includes('statement of financial position') ||
    header.includes('balance sheet')
  ) {
    return 'balance_sheet';
  }

  if (header.includes('statement of activity by class') || name.includes('by class')) {
    return 'profit_loss_by_class';
  }

  if (
    header.includes('project profitability') ||
    header.includes('statement of activity by custom')
  ) {
    return 'project_profit_loss';
  }

  if (header.includes('statement of activity') || name === 'p&l' || name.includes('p & l')) {
    return 'profit_loss';
  }

  return 'unknown';
}
