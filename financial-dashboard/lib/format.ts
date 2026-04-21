export function formatCurrency(n: number | undefined | null, opts?: { showSign?: boolean }): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  if (opts?.showSign && n > 0) return `+${formatted}`;
  if (n < 0) return `−${formatted.replace('-', '')}`;
  return formatted;
}

export function formatPct(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatNumber(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return n.toFixed(digits);
}

export function formatMultiplier(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (n >= 100) return `${n.toFixed(0)}×`;
  if (n >= 10) return `${n.toFixed(1)}×`;
  return `${n.toFixed(2)}×`;
}
