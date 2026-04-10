const GRANTS_API_URL = "https://api.grants.gov/v1/api/search2";

export interface GrantOpportunity {
  id: string;
  number: string;
  title: string;
  agency: string;
  openDate: string;
  closeDate: string;
  oppStatus: string;
}

export interface GrantSearchParams {
  keyword: string;
  rows?: number;
  oppStatuses?: string;
  fundingCategories?: string;
  eligibilities?: string;
  agencies?: string;
}

export interface GrantSearchResult {
  hitCount: number;
  opportunities: GrantOpportunity[];
}

export async function searchGrants(
  params: GrantSearchParams
): Promise<GrantSearchResult> {
  const body = {
    keyword: params.keyword,
    rows: params.rows ?? 10,
    oppStatuses: params.oppStatuses ?? "posted",
    fundingCategories: params.fundingCategories ?? "",
    eligibilities: params.eligibilities ?? "",
    agencies: params.agencies ?? "",
    aln: "",
    oppNum: "",
  };

  const res = await fetch(GRANTS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Grants.gov API error: ${res.status}`);
  }

  const json = await res.json();

  if (json.errorcode !== 0) {
    throw new Error(`Grants.gov returned error: ${json.msg}`);
  }

  const opportunities: GrantOpportunity[] = (json.data?.oppHits ?? []).map(
    (hit: Record<string, unknown>) => ({
      id: String(hit.id ?? ""),
      number: String(hit.number ?? ""),
      title: String(hit.title ?? ""),
      agency: String(hit.agency ?? ""),
      openDate: String(hit.openDate ?? ""),
      closeDate: String(hit.closeDate ?? ""),
      oppStatus: String(hit.oppStatus ?? ""),
    })
  );

  return {
    hitCount: json.data?.hitCount ?? 0,
    opportunities,
  };
}
