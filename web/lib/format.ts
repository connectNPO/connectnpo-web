export function formatDollars(amount: number): string {
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fundingRange(
  floor: number | null,
  ceiling: number | null
): string | null {
  if (floor && ceiling)
    return `${formatDollars(floor)} - ${formatDollars(ceiling)}`;
  if (ceiling) return `Up to ${formatDollars(ceiling)}`;
  if (floor) return `Starting at ${formatDollars(floor)}`;
  return null;
}
