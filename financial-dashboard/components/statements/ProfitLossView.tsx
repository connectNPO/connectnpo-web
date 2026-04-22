import { formatCurrency } from '@/lib/format';
import type { ProfitLoss } from '@/lib/types';
import { StatementLine } from './StatementLine';

interface ProfitLossViewProps {
  pl: ProfitLoss;
  title?: string;
}

export function ProfitLossView({ pl, title = 'Profit & Loss' }: ProfitLossViewProps) {
  return (
    <div className="border border-border rounded-xl bg-white p-6 pdf-avoid-break">
      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-4">
        {title}
      </div>

      {pl.revenue.length > 0 && (
        <Section title="Revenue">
          {pl.revenue.map((line, i) => (
            <StatementLine key={`r-${i}`} line={line} />
          ))}
          <GrandTotal label="Total Revenue" amount={pl.totals.totalRevenue} />
        </Section>
      )}

      {pl.expenditures.length > 0 && (
        <Section title="Expenses">
          {pl.expenditures.map((line, i) => (
            <StatementLine key={`x-${i}`} line={line} />
          ))}
          <GrandTotal label="Total Expenses" amount={pl.totals.totalExpenditures} />
          <GrandTotal
            label="Net Operating Revenue"
            amount={pl.totals.netOperatingRevenue || pl.totals.totalRevenue - pl.totals.totalExpenditures}
          />
        </Section>
      )}

      {(pl.otherRevenue.length > 0 || pl.otherExpenditures.length > 0) && (
        <Section title="Other">
          {pl.otherRevenue.map((line, i) => (
            <StatementLine key={`or-${i}`} line={line} />
          ))}
          {pl.otherRevenue.length > 0 && (
            <GrandTotal label="Total Other Revenue" amount={pl.totals.totalOtherRevenue} />
          )}
          {pl.otherExpenditures.map((line, i) => (
            <StatementLine key={`ox-${i}`} line={line} />
          ))}
          {pl.otherExpenditures.length > 0 && (
            <GrandTotal label="Total Other Expenses" amount={pl.totals.totalOtherExpenditures} />
          )}
        </Section>
      )}

      <GrandTotal label="Net Revenue" amount={pl.totals.netRevenue} emphasize />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-foreground mb-2 pb-1 border-b border-border">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function GrandTotal({
  label,
  amount,
  emphasize,
}: {
  label: string;
  amount: number;
  emphasize?: boolean;
}) {
  if (amount === 0) return null;
  return (
    <div
      className={`grid grid-cols-[1fr_160px] gap-4 py-1 text-sm font-semibold ${
        emphasize ? 'mt-2 pt-2 border-t-2 border-foreground' : ''
      }`}
    >
      <div>{label}</div>
      <div className="tabular text-right border-t border-foreground pt-1">
        {formatCurrency(amount, { showSign: emphasize })}
      </div>
    </div>
  );
}
