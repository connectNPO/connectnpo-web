const USASPENDING_BASE = "https://api.usaspending.gov/api/v2";

export interface TopRecipient {
  name: string;
  amount: number;
}

export interface SpendingSummary {
  totalAmount: number;
  topRecipients: TopRecipient[];
}

/**
 * Get top grant recipients for a keyword (e.g. "education", "health")
 * from USAspending.gov. Shows who is actually receiving federal grants
 * in a given area. No auth required.
 */
export async function getTopGrantRecipients(
  keyword: string,
  limit: number = 5
): Promise<SpendingSummary> {
  const body = {
    filters: {
      award_type_codes: ["02", "03", "04", "05"],
      keywords: [keyword],
      time_period: [
        {
          start_date: "2023-01-01",
          end_date: "2026-12-31",
        },
      ],
    },
    category: "recipient",
    limit,
    page: 1,
  };

  const res = await fetch(
    `${USASPENDING_BASE}/search/spending_by_category/recipient/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 86400 },
    }
  );

  if (!res.ok) {
    throw new Error(`USAspending API error: ${res.status}`);
  }

  const json = await res.json();
  const results = json.results ?? [];

  const topRecipients: TopRecipient[] = results.map(
    (r: Record<string, unknown>) => ({
      name: String(r.name ?? ""),
      amount: Number(r.amount ?? 0),
    })
  );

  const totalAmount = topRecipients.reduce((sum, r) => sum + r.amount, 0);

  return { totalAmount, topRecipients };
}
