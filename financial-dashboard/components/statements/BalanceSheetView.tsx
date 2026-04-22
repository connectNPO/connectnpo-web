import type { BalanceSheet } from '@/lib/types';
import { StatementLine } from './StatementLine';

interface BalanceSheetViewProps {
  bs: BalanceSheet;
}

export function BalanceSheetView({ bs }: BalanceSheetViewProps) {
  const allAssets = [...bs.assets.currentAssets, ...bs.assets.fixedAssets, ...bs.assets.otherAssets];
  return (
    <div className="border border-border rounded-xl bg-white p-6 pdf-avoid-break">
      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-4">
        Balance Sheet
      </div>

      {allAssets.length > 0 && (
        <Section title="Assets">
          {allAssets.map((line, i) => (
            <StatementLine key={`a-${i}`} line={line} />
          ))}
        </Section>
      )}

      {bs.liabilities.currentLiabilities.length > 0 && (
        <Section title="Liabilities">
          {bs.liabilities.currentLiabilities.map((line, i) => (
            <StatementLine key={`l-${i}`} line={line} />
          ))}
        </Section>
      )}

      {bs.equity.lines.length > 0 && (
        <Section title="Equity">
          {bs.equity.lines.map((line, i) => (
            <StatementLine key={`e-${i}`} line={line} />
          ))}
        </Section>
      )}
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
