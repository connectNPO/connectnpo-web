import { GRADE_COLORS, type Grade } from "@/lib/scoring";

const GRADE_TEXT_CLASS: Record<Grade, string> = {
  A: "text-[#1D9E75]",
  B: "text-[#3B82F6]",
  C: "text-[#F59E0B]",
  D: "text-[#F97316]",
  F: "text-[#EF4444]",
};

export default function ScoreCircle({
  score,
  grade,
}: {
  score: number;
  grade: Grade;
}) {
  const size = 180;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (circumference * clamped) / 100;
  const color = GRADE_COLORS[grade];

  return (
    <div className="relative w-[180px] h-[180px]">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-gray-900 leading-none">
          {Math.round(clamped)}
        </span>
        <span className={`mt-1 text-2xl font-semibold ${GRADE_TEXT_CLASS[grade]}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}
