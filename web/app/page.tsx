import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 sm:py-32 text-center">
        <p className="text-sm font-medium text-primary tracking-wide uppercase">
          Free Grant Readiness Report
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
          Find Grants Your Nonprofit Actually Qualifies For
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Get a personalized report with matching federal grants, eligibility
          checks, funding details, and deadlines — in under 2 minutes.
        </p>
        <Link
          href="/search"
          className={buttonVariants({ size: "lg" }) + " mt-2 text-base px-8"}
        >
          Get Your Free Report
        </Link>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                1
              </div>
              <h3 className="mt-4 font-semibold">Tell Us About Your NPO</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Name, focus area, budget — takes 60 seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                2
              </div>
              <h3 className="mt-4 font-semibold">We Search Federal Grants</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Matching your profile against 100+ open opportunities on
                Grants.gov.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                3
              </div>
              <h3 className="mt-4 font-semibold">Get Your Report</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Eligibility, funding amounts, deadlines, and documents — all in
                one page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            What&apos;s in Your Report
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">Eligibility Check</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Instantly see which grants your 501(c)(3) qualifies for — no
                guesswork.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">Funding Details</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Award ranges, total program funding, and expected number of
                awards for each grant.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">Deadline Alerts</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Color-coded countdowns so you never miss an application window.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">Application Documents</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Download budget templates, NOFOs, and required forms directly
                from your report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / CTA */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 sm:py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to Find Your Grants?
          </h2>
          <p className="mt-3 text-muted-foreground">
            100% free. No credit card. No login required.
          </p>
          <Link
            href="/search"
            className={
              buttonVariants({ size: "lg" }) + " mt-6 text-base px-8"
            }
          >
            Get Your Free Report
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <p>
          Powered by{" "}
          <a
            href="https://givingarc.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            GivingArc
          </a>{" "}
          — Bookkeeping &amp; 990 Filing for Nonprofits
        </p>
      </footer>
    </main>
  );
}
