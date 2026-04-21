import { formatPct } from '@/lib/format';

export interface RatioItem {
  label: string;
  value: number;
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

interface RatioBarProps {
  title: string;
  items: RatioItem[];
  footnote?: string;
  footnoteTone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

function barColor(tone?: RatioItem['tone']): string {
  switch (tone) {
    case 'positive':
      return 'bg-positive';
    case 'negative':
      return 'bg-negative';
    case 'warning':
      return 'bg-warning';
    default:
      return 'bg-foreground';
  }
}

function footnoteColor(tone?: RatioBarProps['footnoteTone']): string {
  switch (tone) {
    case 'positive':
      return 'text-positive';
    case 'negative':
      return 'text-negative';
    case 'warning':
      return 'text-warning';
    default:
      return 'text-muted';
  }
}

export function RatioBar({ title, items, footnote, footnoteTone }: RatioBarProps) {
  return (
    <div className="border border-border rounded-xl p-6 bg-white">
      <div className="text-xs uppercase tracking-wider text-muted font-medium mb-5">{title}</div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-sm font-medium tabular">{formatPct(item.value)}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor(item.tone)} rounded-full`}
                style={{ width: `${Math.min(100, item.value * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {footnote && (
        <div className={`mt-5 text-xs ${footnoteColor(footnoteTone)}`}>{footnote}</div>
      )}
    </div>
  );
}
