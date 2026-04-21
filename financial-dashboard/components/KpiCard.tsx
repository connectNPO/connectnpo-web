interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

export function KpiCard({ label, value, sublabel, tone = 'neutral' }: KpiCardProps) {
  const toneClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : tone === 'warning'
          ? 'text-warning'
          : 'text-foreground';

  return (
    <div className="border border-border rounded-xl p-6 bg-white">
      <div className="text-xs uppercase tracking-wider text-muted font-medium">{label}</div>
      <div className={`mt-3 text-3xl font-semibold tabular ${toneClass}`}>{value}</div>
      {sublabel && <div className="mt-2 text-sm text-muted">{sublabel}</div>}
    </div>
  );
}
