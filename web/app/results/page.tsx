import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { searchGrants, type GrantOpportunity } from "@/lib/grants";

const PER_PAGE = 10;

// 501(c)(3) nonprofit eligibility code
const NONPROFIT_ELIGIBILITY = "12";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus_area?: string; page?: string }>;
}) {
  const params = await searchParams;
  const keyword = params.focus_area || "nonprofit";
  const page = Math.max(1, Number(params.page) || 1);
  const startRecord = (page - 1) * PER_PAGE;

  let opportunities: GrantOpportunity[] = [];
  let hitCount = 0;
  let error = false;

  try {
    const result = await searchGrants({
      keyword,
      rows: PER_PAGE,
      startRecord,
      eligibilities: NONPROFIT_ELIGIBILITY,
    });
    opportunities = result.opportunities;
    hitCount = result.hitCount;
  } catch {
    error = true;
  }

  const totalPages = Math.ceil(hitCount / PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function pageUrl(p: number) {
    return `/results?focus_area=${encodeURIComponent(keyword)}&page=${p}`;
  }

  return (
    <main className="flex min-h-screen flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Thank You!
          </h1>
          <p className="mt-2 text-muted-foreground">
            We found {hitCount} grants matching &ldquo;{keyword}&rdquo;
          </p>
        </div>

        {error ? (
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
            <div className="space-y-4">
              {opportunities.map((grant) => (
                <div
                  key={grant.id}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <a
                    href={`https://www.grants.gov/search-results-detail/${grant.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold hover:underline"
                  >
                    {grant.title}
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {grant.agency}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {grant.openDate && <span>Opens: {grant.openDate}</span>}
                    {grant.closeDate && <span>Closes: {grant.closeDate}</span>}
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {grant.oppStatus}
                    </span>
                  </div>
                </div>
              ))}
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
                <span className={buttonVariants({ variant: "outline", size: "sm" }) + " pointer-events-none opacity-40"}>
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
                <span className={buttonVariants({ variant: "outline", size: "sm" }) + " pointer-events-none opacity-40"}>
                  Next →
                </span>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-center">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
