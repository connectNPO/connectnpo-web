import { redirect } from "next/navigation";
import { calculateScore, type Form990Input } from "@/lib/scoring";
import ScoreCircle from "@/components/ScoreCircle";
import MetricCard from "@/components/MetricCard";
import PdfDownloadButton from "@/components/ReportPDF";

function decode(d: string): Form990Input | null {
  try {
    const raw = Buffer.from(decodeURIComponent(d), "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Form990Input;
  } catch {
    return null;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  if (!d) redirect("/quiz");

  const input = decode(d);
  if (!input) redirect("/quiz");

  const result = calculateScore(input);
  if (!result) redirect("/quiz");

  const recommendations = result.metrics.filter(
    (m) => m.grade === "C" || m.grade === "D" || m.grade === "F",
  );

  return (
    <main className="mx-auto w-full max-w-[800px] px-6 py-12">
      <section className="text-center">
        <div className="inline-block">
          <ScoreCircle score={result.totalScore} grade={result.grade} />
        </div>
        <p className="mt-6 text-lg text-gray-600">
          Better than {result.percentile}% of similar nonprofits
        </p>
      </section>

      <section className="mt-12 grid gap-4 grid-cols-1 md:grid-cols-2">
        {result.metrics.map((m) => (
          <MetricCard key={m.name} metric={m} />
        ))}
      </section>

      {recommendations.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl text-[#1A2E44] tracking-tight">
            Recommendations
          </h2>
          <ul className="mt-4 space-y-3">
            {recommendations.map((m) => (
              <li
                key={m.name}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900"
              >
                <span className="font-medium">{m.name}: </span>
                {m.recommendation}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href="https://givingarc.com/schedule-a-call/"
          className="inline-block rounded-lg bg-[#1A2E44] px-8 py-4 text-center text-white font-medium hover:bg-[#243B57] transition-colors"
        >
          Schedule a Free Consult →
        </a>
        <PdfDownloadButton scoreResult={result} />
      </section>
    </main>
  );
}
