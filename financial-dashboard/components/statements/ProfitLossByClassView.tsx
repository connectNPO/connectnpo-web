import { formatCurrency } from '@/lib/format';
import type { ProfitLossByClass } from '@/lib/types';

interface ProfitLossByClassViewProps {
  plByClass: ProfitLossByClass;
}

export function ProfitLossByClassView({ plByClass }: ProfitLossByClassViewProps) {
  const { classes, rows } = plByClass;

  return (
    <div className="border border-border rounded-xl bg-white p-6 pdf-avoid-break overflow-x-auto">
      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-4">
        Profit & Loss by Class
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-semibold text-foreground py-2 pr-4 min-w-[240px]">
              Account
            </th>
            {classes.map((c) => (
              <th
                key={c}
                className="text-right font-semibold text-foreground py-2 px-3 min-w-[110px]"
              >
                {c}
              </th>
            ))}
            <th className="text-right font-semibold text-foreground py-2 pl-3 min-w-[120px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const indentPx = row.indentLevel * 12;
            const rowClasses = row.isSubtotal
              ? 'font-semibold border-t border-foreground'
              : '';
            return (
              <tr key={i} className={`${rowClasses}`}>
                <td className="py-1 pr-4" style={{ paddingLeft: `${indentPx}px` }}>
                  {row.accountName}
                </td>
                {classes.map((c) => {
                  const v = row.byClass[c];
                  return (
                    <td key={c} className="py-1 px-3 text-right tabular">
                      {v === null || v === undefined ? '' : formatCurrency(v)}
                    </td>
                  );
                })}
                <td className="py-1 pl-3 text-right tabular">
                  {formatCurrency(row.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
