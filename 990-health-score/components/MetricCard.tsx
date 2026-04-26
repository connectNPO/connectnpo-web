import type { Grade, MetricResult } from "@/lib/scoring";

const GRADE_BADGE_CLASS: Record<Grade, string> = {
  A: "bg-[#1D9E75]",
  B: "bg-[#3B82F6]",
  C: "bg-[#F59E0B]",
  D: "bg-[#F97316]",
  F: "bg-[#EF4444]",
};

export default function MetricCard({ metric }: { metric: MetricResult }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-gray-500">{metric.name}</h3>
          <p className="mt-1 text-3xl text-[#1A2E44] font-medium">{metric.formatted}</p>
          <p className="mt-1 text-xs text-gray-500">Benchmark: {metric.benchmark}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-medium ${GRADE_BADGE_CLASS[metric.grade]}`}
          aria-label={`Grade ${metric.grade}`}
        >
          {metric.grade}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-600">{metric.insight}</p>

      {metric.recommendation && (
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          <span className="font-medium">Recommendation: </span>
          {metric.recommendation}
        </div>
      )}
    </div>
  );
}
