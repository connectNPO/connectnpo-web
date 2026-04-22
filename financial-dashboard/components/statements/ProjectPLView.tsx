import { formatCurrency } from '@/lib/format';
import type { ProjectProfitLoss } from '@/lib/types';
import { StatementLine } from './StatementLine';

interface ProjectPLViewProps {
  project: ProjectProfitLoss;
}

export function ProjectPLView({ project }: ProjectPLViewProps) {
  const title = project.meta.projectName || project.meta.orgName || 'Project';
  return (
    <div className="border border-border rounded-xl bg-white p-6 pdf-avoid-break">
      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-4">
        {title}
      </div>

      {project.revenue.length > 0 && (
        <Section title="Revenue">
          {project.revenue.map((line, i) => (
            <StatementLine key={`r-${i}`} line={line} />
          ))}
        </Section>
      )}

      {project.expenditures.length > 0 && (
        <Section title="Expenses">
          {project.expenditures.map((line, i) => (
            <StatementLine key={`x-${i}`} line={line} />
          ))}
        </Section>
      )}

      <div className="grid grid-cols-[1fr_160px] gap-4 py-1 text-sm font-semibold mt-2 pt-2 border-t-2 border-foreground">
        <div>Net Revenue</div>
        <div className="tabular text-right">
          {formatCurrency(project.totals.netRevenue, { showSign: true })}
        </div>
      </div>
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
