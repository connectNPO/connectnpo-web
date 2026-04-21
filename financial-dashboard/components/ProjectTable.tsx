import { formatCurrency } from '@/lib/format';

interface Project {
  name: string;
  netRevenue: number;
}

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) return null;

  const maxAbs = Math.max(...projects.map((p) => Math.abs(p.netRevenue)));

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="text-xs uppercase tracking-wider text-muted font-medium">
          Project Profitability
        </div>
      </div>
      <div>
        {projects.map((p, idx) => {
          const isPositive = p.netRevenue > 0;
          const isNegative = p.netRevenue < 0;
          const widthPct = maxAbs > 0 ? (Math.abs(p.netRevenue) / maxAbs) * 100 : 0;

          return (
            <div
              key={idx}
              className="px-6 py-4 border-b border-border last:border-b-0 grid grid-cols-[1fr_auto_120px] gap-4 items-center"
            >
              <div className="text-sm text-foreground truncate">{p.name}</div>
              <div
                className={`text-sm font-medium tabular ${
                  isNegative ? 'text-negative' : isPositive ? 'text-foreground' : 'text-muted'
                }`}
              >
                {formatCurrency(p.netRevenue, { showSign: true })}
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isNegative ? 'bg-negative' : 'bg-foreground'}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
