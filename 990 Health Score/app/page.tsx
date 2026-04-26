import Link from "next/link";

const features = [
  {
    title: "7 Key Metrics",
    description: "Across all major Form 990 financial ratios",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Instant Score",
    description: "Color-coded grade with category breakdown",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Full Report",
    description: "Personalized PDF emailed in minutes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-16">
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-[#1D9E75]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#1D9E75]">
          Free &middot; 3 minutes
        </span>
        <h1 className="mt-6 text-4xl md:text-5xl text-[#1A2E44] leading-tight tracking-tight">
          Is Your Nonprofit&apos;s 990 Telling a Good Story?
        </h1>
        <p className="mt-5 text-lg text-gray-600">
          Enter 7 numbers from your Form 990. Get your financial health score
          in 60 seconds.
        </p>
        <div className="mt-10">
          <Link
            href="/quiz"
            className="inline-block rounded-lg bg-[#1A2E44] px-8 py-4 text-white font-medium hover:bg-[#243B57] transition-colors"
          >
            Get My Score →
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          No credit card. No spam. Your answers stay private.
        </p>
      </section>

      <section className="mt-20 grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl bg-white p-8 shadow-sm border border-gray-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D9E75]/10 text-[#1D9E75]">
              {f.icon}
            </div>
            <h3 className="mt-5 text-lg text-[#1A2E44]">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
