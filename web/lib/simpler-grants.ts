const SIMPLER_API_BASE = "https://api.simpler.grants.gov/v1";

export interface SimplerGrantSummary {
  applicant_types: string[];
  award_floor: number | null;
  award_ceiling: number | null;
  is_cost_sharing: boolean;
  close_date: string | null;
  post_date: string | null;
  summary_description: string | null;
  applicant_eligibility_description: string | null;
  funding_categories: string[];
  funding_instruments: string[];
  agency_email_address: string | null;
  additional_info_url: string | null;
}

export interface SimplerGrantDetail {
  opportunity_id: string;
  opportunity_title: string;
  agency_name: string;
  opportunity_status: string;
  legacy_opportunity_id: number;
  summary: SimplerGrantSummary;
}

/**
 * Fetch detailed grant info from Simpler.Grants.gov by legacy ID
 * (the same ID returned by Grants.gov search2 API)
 */
export async function fetchGrantDetail(
  legacyId: string
): Promise<SimplerGrantDetail | null> {
  const apiKey = process.env.SIMPLER_GRANTS_API_KEY;
  if (!apiKey) {
    console.warn("SIMPLER_GRANTS_API_KEY not set, skipping enrichment");
    return null;
  }

  try {
    const res = await fetch(
      `${SIMPLER_API_BASE}/opportunities/${legacyId}`,
      {
        headers: { "X-Api-Key": apiKey },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data;
    if (!data || !data.summary) return null;

    const s = data.summary;
    return {
      opportunity_id: String(data.opportunity_id ?? ""),
      opportunity_title: String(data.opportunity_title ?? ""),
      agency_name: String(data.agency_name ?? ""),
      opportunity_status: String(data.opportunity_status ?? ""),
      legacy_opportunity_id: Number(data.legacy_opportunity_id ?? 0),
      summary: {
        applicant_types: Array.isArray(s.applicant_types)
          ? s.applicant_types.map(String)
          : [],
        award_floor: s.award_floor != null ? Number(s.award_floor) : null,
        award_ceiling: s.award_ceiling != null ? Number(s.award_ceiling) : null,
        is_cost_sharing: Boolean(s.is_cost_sharing),
        close_date: s.close_date ? String(s.close_date) : null,
        post_date: s.post_date ? String(s.post_date) : null,
        summary_description: s.summary_description
          ? String(s.summary_description)
          : null,
        applicant_eligibility_description:
          s.applicant_eligibility_description
            ? String(s.applicant_eligibility_description)
            : null,
        funding_categories: Array.isArray(s.funding_categories)
          ? s.funding_categories.map(String)
          : [],
        funding_instruments: Array.isArray(s.funding_instruments)
          ? s.funding_instruments.map(String)
          : [],
        agency_email_address: s.agency_email_address
          ? String(s.agency_email_address)
          : null,
        additional_info_url: s.additional_info_url
          ? String(s.additional_info_url)
          : null,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Fetch details for multiple grants in parallel.
 * Uses allSettled so one failure doesn't block others.
 */
export async function fetchGrantDetails(
  legacyIds: string[]
): Promise<Map<string, SimplerGrantDetail>> {
  const results = await Promise.allSettled(
    legacyIds.map((id) => fetchGrantDetail(id))
  );

  const map = new Map<string, SimplerGrantDetail>();
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      map.set(legacyIds[index], result.value);
    }
  });

  return map;
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .trim();
}

/** Check if a grant accepts 501(c)(3) nonprofits */
export function isNonprofitEligible(applicantTypes: string[]): boolean {
  return applicantTypes.some(
    (t) => t.includes("501c3") || t.includes("nonprofit")
  );
}

/** Calculate days from today until a given date string */
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
