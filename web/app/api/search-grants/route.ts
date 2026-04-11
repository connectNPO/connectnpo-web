import { NextRequest } from "next/server";
import { searchGrants } from "@/lib/grants";
import { fetchGrantDetails, stripHtml } from "@/lib/simpler-grants";
import {
  PER_PAGE,
  NONPROFIT_ELIGIBILITY,
  FOCUS_TO_CATEGORY,
} from "@/lib/constants";
import type { EnrichedGrant, SearchGrantsResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? "";
  const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const startRecord = (page - 1) * PER_PAGE;

  const categoryCode = FOCUS_TO_CATEGORY[category] ?? "";
  const searchKeyword = categoryCode ? "" : keyword || category;

  try {
    // Step 1: Search grants
    const result = await searchGrants({
      keyword: searchKeyword,
      rows: PER_PAGE,
      startRecord,
      fundingCategories: categoryCode,
      eligibilities: NONPROFIT_ELIGIBILITY,
    });

    // Step 2: Enrich with Simpler API
    const ids = result.opportunities.map((o) => o.id);
    const enriched = await fetchGrantDetails(ids);

    // Step 3: Merge into flat EnrichedGrant objects
    const grants: EnrichedGrant[] = result.opportunities.map((opp) => {
      const detail = enriched.get(opp.id);
      const s = detail?.summary;

      return {
        id: opp.id,
        title: opp.title,
        agency: detail?.agency_name || opp.agency,
        opportunityNumber: detail?.opportunity_number || opp.number,
        openDate: opp.openDate,
        closeDate: s?.close_date || opp.closeDate,
        oppStatus: opp.oppStatus,
        description: s?.summary_description
          ? stripHtml(s.summary_description)
          : null,
        awardFloor: s?.award_floor ?? null,
        awardCeiling: s?.award_ceiling ?? null,
        totalFunding: s?.estimated_total_program_funding ?? null,
        expectedAwards: s?.expected_number_of_awards ?? null,
        isCostSharing: s?.is_cost_sharing ?? false,
        closeDateDescription: s?.close_date_description ?? null,
        applicantTypes: s?.applicant_types ?? [],
        eligibilityDescription: s?.applicant_eligibility_description ?? null,
        fundingCategories: s?.funding_categories ?? [],
        fundingInstruments: s?.funding_instruments ?? [],
        agencyEmail: s?.agency_email_address ?? null,
        contactDescription: s?.agency_contact_description ?? null,
        additionalInfoUrl: s?.additional_info_url ?? null,
        attachments: (detail?.attachments ?? []).map((a) => ({
          fileName: a.file_name,
          mimeType: a.mime_type,
          downloadPath: a.download_path,
        })),
      };
    });

    const totalPages = Math.ceil(result.hitCount / PER_PAGE);

    const response: SearchGrantsResponse = {
      hitCount: result.hitCount,
      page,
      totalPages,
      grants,
    };

    return Response.json(response);
  } catch (err) {
    console.error("Search grants failed:", err);
    return Response.json(
      { error: "Failed to search grants" },
      { status: 502 }
    );
  }
}
