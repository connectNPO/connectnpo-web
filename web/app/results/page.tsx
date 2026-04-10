import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { searchGrants, type GrantOpportunity } from "@/lib/grants";
import {
  searchNonprofits,
  getOrganization,
  type NonprofitOrg,
} from "@/lib/propublica";
import {
  fetchGrantDetails,
  stripHtml,
  isNonprofitEligible,
  daysUntil,
  formatInstrument,
  formatCategory,
  type SimplerGrantDetail,
} from "@/lib/simpler-grants";

const PER_PAGE = 5;
const NONPROFIT_ELIGIBILITY = "12";

function formatDollars(amount: number): string {
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fundingRange(
  floor: number | null,
  ceiling: number | null
): string | null {
  if (floor && ceiling) return `${formatDollars(floor)} - ${formatDollars(ceiling)}`;
  if (ceiling) return `Up to ${formatDollars(ceiling)}`;
  if (floor) return `Starting at ${formatDollars(floor)}`;
  return null;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus_area?: string; page?: string; org?: string }>;
}) {
  const params = await searchParams;
  const keyword = params.focus_area || "nonprofit";
  const orgName = params.org || "";
  const page = Math.max(1, Number(params.page) || 1);
  const startRecord = (page - 1) * PER_PAGE;

  // Step 1: Fetch grants + org info in parallel
  let opportunities: GrantOpportunity[] = [];
  let hitCount = 0;
  let grantError = false;
  let orgInfo: NonprofitOrg | null = null;

  const grantsPromise = searchGrants({
    keyword,
    rows: PER_PAGE,
    startRecord,
    eligibilities: NONPROFIT_ELIGIBILITY,
  }).catch(() => {
    grantError = true;
    return null;
  });

  const orgPromise = orgName
    ? searchNonprofits(orgName)
        .then(async (results) => {
          if (results.length > 0) {
            return getOrganization(results[0].ein);
          }
          return null;
        })
        .catch(() => null)
    : Promise.resolve(null);

  const [grantsResult, orgResult] = await Promise.all([
    grantsPromise,
    orgPromise,
  ]);

  if (grantsResult) {
    opportunities = grantsResult.opportunities;
    hitCount = grantsResult.hitCount;
  }
  orgInfo = orgResult;

  // Step 2: Fetch enriched details from Simpler API
  let enriched = new Map<string, SimplerGrantDetail>();
  if (opportunities.length > 0) {
    const ids = opportunities.map((o) => o.id);
    enriched = await fetchGrantDetails(ids);
  }

  const totalPages = Math.ceil(hitCount / PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function pageUrl(p: number) {
    const base = `/results?focus_area=${encodeURIComponent(keyword)}&page=${p}`;
    return orgName ? `${base}&org=${encodeURIComponent(orgName)}` : base;
  }

  const latestFiling = orgInfo?.filings?.[0];
  const currentYear = new Date().getFullYear();
  const isFilingOutdated =
    latestFiling && currentYear - latestFiling.tax_prd_yr >= 2;

  return (
    <main className="flex min-h-screen flex-col items-center py-16 px-4 bg-muted/30">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Your Grant Readiness Report
          </h1>
          <p className="mt-2 text-muted-foreground">
            {orgName
              ? `Here\u2019s what we found for ${orgName}`
              : `Grants matching \u201c${keyword}\u201d for 501(c)(3) organizations`}
          </p>
        </div>

        {/* Section 1: Organization Profile */}
        {orgInfo && (
          <div className="mb-8 rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">{orgInfo.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {orgInfo.city}, {orgInfo.state} &middot; EIN: {orgInfo.ein}
            </p>

            {latestFiling && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-sm font-semibold">
                    {formatDollars(latestFiling.totrevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-sm font-semibold">
                    {formatDollars(latestFiling.totfuncexpns)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assets</p>
                  <p className="text-sm font-semibold">
                    {formatDollars(latestFiling.totassetsend)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Filing Year</p>
                  <p className="text-sm font-semibold">
                    {latestFiling.tax_prd_yr}
                  </p>
                </div>
              </div>
            )}

            {isFilingOutdated && (
              <div className="mt-4 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm">
                <span className="font-medium text-yellow-800">
                  ⚠ Your last 990 filing is from {latestFiling?.tax_prd_yr}.
                </span>{" "}
                <span className="text-yellow-700">
                  Most federal grants require current financial filings.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Matching Grants */}
        {grantError ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
            <p className="font-medium">Unable to load grants right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please try again later or contact us for help.
            </p>
          </div>
        ) : opportunities.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No grants found for &ldquo;{keyword}&rdquo;. We&apos;ll notify you
            when matching opportunities become available.
          </p>
        ) : (
          <>
            <h2 className="mb-4 text-xl font-semibold">
              {hitCount} Matching Grants
            </h2>

            <div className="space-y-8">
              {opportunities.map((grant) => {
                const detail = enriched.get(grant.id);
                const s = detail?.summary;
                const eligible = s
                  ? isNonprofitEligible(s.applicant_types)
                  : null;
                const funding = s
                  ? fundingRange(s.award_floor, s.award_ceiling)
                  : null;
                const remaining = s ? daysUntil(s.close_date) : null;
                const description = s?.summary_description
                  ? stripHtml(s.summary_description)
                  : null;

                const totalFunding = s?.estimated_total_program_funding;
                const expectedAwards = s?.expected_number_of_awards;
                const instruments = s?.funding_instruments ?? [];
                const categories = s?.funding_categories ?? [];
                const eligibilityDesc =
                  s?.applicant_eligibility_description;
                const closeDesc = s?.close_date_description;
                const contactName = s?.agency_contact_description;
                const attachments = detail?.attachments ?? [];

                return (
                  <div
                    key={grant.id}
                    className="rounded-lg border border-border bg-card p-5 space-y-4 transition-shadow hover:shadow-md"
                  >
                    {/* Title & Agency & Number */}
                    <div>
                      <a
                        href={`https://www.grants.gov/search-results-detail/${grant.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold hover:underline"
                      >
                        {grant.title}
                      </a>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {detail?.agency_name || grant.agency}
                        {detail?.opportunity_number &&
                          ` · ${detail.opportunity_number}`}
                      </p>
                    </div>

                    {/* Description */}
                    {description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {description.length > 250
                          ? description.slice(0, 250) + "..."
                          : description}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {funding && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          {funding}
                        </span>
                      )}
                      {eligible === true && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                          ✓ 501(c)(3) Eligible
                        </span>
                      )}
                      {eligible === false && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                          ✗ Check Eligibility
                        </span>
                      )}
                      {s?.is_cost_sharing && (
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200">
                          ⚠ Cost Sharing Required
                        </span>
                      )}
                      {remaining !== null && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            remaining <= 14
                              ? "bg-red-50 text-red-700 border-red-200"
                              : remaining <= 30
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {remaining > 0
                            ? `${remaining} days left`
                            : remaining === 0
                              ? "Closes today"
                              : "Closed"}
                        </span>
                      )}
                      {instruments.map((inst) => (
                        <span
                          key={inst}
                          className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200"
                        >
                          {formatInstrument(inst)}
                        </span>
                      ))}
                    </div>

                    {/* Key Details Grid */}
                    {s && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                        {totalFunding && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Total Program Funding
                            </p>
                            <p className="font-medium">
                              {formatDollars(totalFunding)}
                            </p>
                          </div>
                        )}
                        {expectedAwards && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Expected Awards
                            </p>
                            <p className="font-medium">{expectedAwards}</p>
                          </div>
                        )}
                        {(s.close_date || grant.closeDate) && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Deadline
                            </p>
                            <p className="font-medium">
                              {formatDate(s.close_date ?? null) ||
                                grant.closeDate}
                            </p>
                          </div>
                        )}
                        {categories.length > 0 && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-xs text-muted-foreground">
                              Category
                            </p>
                            <p className="font-medium">
                              {categories.map(formatCategory).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Eligibility Details */}
                    {eligibilityDesc && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Eligibility Requirements
                        </p>
                        <p className="text-sm leading-relaxed">
                          {eligibilityDesc.length > 300
                            ? eligibilityDesc.slice(0, 300) + "..."
                            : eligibilityDesc}
                        </p>
                      </div>
                    )}

                    {/* Deadline Note */}
                    {closeDesc && (
                      <p className="text-xs text-muted-foreground italic">
                        {closeDesc}
                      </p>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Documents ({attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {attachments.slice(0, 5).map((att) => (
                            <a
                              key={att.download_path}
                              href={att.download_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-xs text-primary hover:underline"
                            >
                              {att.file_name.length > 30
                                ? att.file_name.slice(0, 27) + "..."
                                : att.file_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
                      {contactName && (
                        <span>Contact: {contactName.split("\n")[0]}</span>
                      )}
                      {s?.agency_email_address && (
                        <a
                          href={`mailto:${s.agency_email_address}`}
                          className="hover:underline text-primary"
                        >
                          {s.agency_email_address}
                        </a>
                      )}
                      {s?.additional_info_url && (
                        <a
                          href={s.additional_info_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-primary"
                        >
                          More Info
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-4">
              {hasPrev ? (
                <Link
                  href={pageUrl(page - 1)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  ← Previous
                </Link>
              ) : (
                <span
                  className={
                    buttonVariants({ variant: "outline", size: "sm" }) +
                    " pointer-events-none opacity-40"
                  }
                >
                  ← Previous
                </span>
              )}

              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              {hasNext ? (
                <Link
                  href={pageUrl(page + 1)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Next →
                </Link>
              ) : (
                <span
                  className={
                    buttonVariants({ variant: "outline", size: "sm" }) +
                    " pointer-events-none opacity-40"
                  }
                >
                  Next →
                </span>
              )}
            </div>
          </>
        )}

        {/* Section 3: GivingArc CTA */}
        <div className="mt-10 rounded-lg bg-primary/5 border border-primary/20 p-6">
          <h2 className="text-xl font-semibold">
            Get Grant-Ready with GivingArc
          </h2>

          {isFilingOutdated && (
            <p className="mt-2 text-sm font-medium text-yellow-800">
              Your last 990 filing is from {latestFiling?.tax_prd_yr}. Grant
              applications typically require up-to-date financial records and
              current IRS filings.
            </p>
          )}

          <p className="mt-3 text-sm text-muted-foreground">
            GivingArc helps nonprofits stay grant-ready with:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Bookkeeping review and cleanup</li>
            <li>990 tax filing preparation</li>
            <li>Financial statement preparation for grant applications</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://givingarc.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Request a Free Review</Button>
            </a>
            <a
              href="mailto:info@givingarc.com"
              className={buttonVariants({ variant: "outline" })}
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
