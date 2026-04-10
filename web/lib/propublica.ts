const PROPUBLICA_BASE = "https://projects.propublica.org/nonprofits/api/v2";

export interface NonprofitSearchResult {
  ein: number;
  strein: string;
  name: string;
  city: string;
  state: string;
  ntee_code: string | null;
  score: number;
}

export interface NonprofitFiling {
  tax_prd_yr: number;
  totrevenue: number;
  totfuncexpns: number;
  totassetsend: number;
  totcntrbgfts: number;
  totprgmrevnue: number;
  pdf_url: string | null;
}

export interface NonprofitOrg {
  ein: number;
  name: string;
  city: string;
  state: string;
  ntee_code: string | null;
  income_amount: number;
  revenue_amount: number;
  asset_amount: number;
  filings: NonprofitFiling[];
}

export async function searchNonprofits(
  query: string
): Promise<NonprofitSearchResult[]> {
  const url = `${PROPUBLICA_BASE}/search.json?q=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ProPublica search error: ${res.status}`);
  }

  const json = await res.json();

  return (json.organizations ?? []).map(
    (org: Record<string, unknown>) => ({
      ein: Number(org.ein ?? 0),
      strein: String(org.strein ?? ""),
      name: String(org.name ?? ""),
      city: String(org.city ?? ""),
      state: String(org.state ?? ""),
      ntee_code: org.ntee_code ? String(org.ntee_code) : null,
      score: Number(org.score ?? 0),
    })
  );
}

export async function getOrganization(
  ein: number
): Promise<NonprofitOrg | null> {
  const url = `${PROPUBLICA_BASE}/organizations/${ein}.json`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`ProPublica org error: ${res.status}`);
  }

  const json = await res.json();
  const org = json.organization ?? {};
  const rawFilings = json.filings_with_data ?? [];

  return {
    ein: Number(org.ein ?? 0),
    name: String(org.name ?? ""),
    city: String(org.city ?? ""),
    state: String(org.state ?? ""),
    ntee_code: org.ntee_code ? String(org.ntee_code) : null,
    income_amount: Number(org.income_amount ?? 0),
    revenue_amount: Number(org.revenue_amount ?? 0),
    asset_amount: Number(org.asset_amount ?? 0),
    filings: rawFilings.map((f: Record<string, unknown>) => ({
      tax_prd_yr: Number(f.tax_prd_yr ?? 0),
      totrevenue: Number(f.totrevenue ?? 0),
      totfuncexpns: Number(f.totfuncexpns ?? 0),
      totassetsend: Number(f.totassetsend ?? 0),
      totcntrbgfts: Number(f.totcntrbgfts ?? 0),
      totprgmrevnue: Number(f.totprgmrevnue ?? 0),
      pdf_url: f.pdf_url ? String(f.pdf_url) : null,
    })),
  };
}
