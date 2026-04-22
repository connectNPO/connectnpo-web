import { formatCurrency } from '@/lib/format';
import type { AccountLine } from '@/lib/types';

interface StatementLineProps {
  line: AccountLine;
}

/**
 * Renders a single AccountLine using 1:1 Excel-style conventions:
 * - Section headers (e.g. "Bank Accounts"): bold, no amount
 * - Subtotals (e.g. "Total for Bank Accounts"): bold + top border on amount
 * - Regular lines: plain
 * - Indent levels from Excel are preserved via left padding
 * - Memos (Excel column C) appear as muted text under the label
 */
export function StatementLine({ line }: StatementLineProps) {
  const indentPx = line.indentLevel * 16;

  if (line.isSectionHeader) {
    return (
      <div
        className="flex items-baseline py-1.5 text-sm font-semibold text-foreground"
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <span>{line.accountName}</span>
      </div>
    );
  }

  const labelClasses = line.isSubtotal ? 'font-semibold' : '';
  const amountClasses = line.isSubtotal
    ? 'font-semibold border-t border-foreground pt-1 tabular text-right'
    : 'tabular text-right';

  return (
    <div className="grid grid-cols-[1fr_160px] gap-4 py-1 text-sm">
      <div className="min-w-0">
        <div className={labelClasses} style={{ paddingLeft: `${indentPx}px` }}>
          {line.accountName}
        </div>
        {line.memo && (
          <div
            className="text-xs text-muted mt-0.5"
            style={{ paddingLeft: `${indentPx}px` }}
          >
            {line.memo}
          </div>
        )}
      </div>
      <div className={amountClasses}>{formatCurrency(line.amount)}</div>
    </div>
  );
}
