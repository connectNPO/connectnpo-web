export interface Form990Input {
  totalRevenue: number;
  programRevenue: number;
  contributions: number;
  totalExpenses: number;
  programExpenses: number;
  mgmtExpenses: number;
  fundraisingExpenses: number;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export const GRADE_COLORS: Record<Grade, string> = {
  A: "#1D9E75",
  B: "#3B82F6",
  C: "#F59E0B",
  D: "#F97316",
  F: "#EF4444",
};

export interface MetricResult {
  name: string;
  value: number;
  formatted: string;
  benchmark: string;
  score: number;
  grade: Grade;
  insight: string;
  recommendation?: string;
}

export interface ScoreResult {
  totalScore: number;
  grade: Grade;
  percentile: number;
  metrics: MetricResult[];
}

function gradeFromScore(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function fmtPct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtMoney(v: number): string {
  return `$${v.toFixed(2)}`;
}

function buildMetric(
  name: string,
  value: number,
  formatted: string,
  benchmark: string,
  rawScore: number,
  insight: string,
  recommendation: string,
): MetricResult {
  const score = Math.round(clamp(rawScore, 0, 100));
  const grade = gradeFromScore(score);
  const m: MetricResult = { name, value, formatted, benchmark, score, grade, insight };
  if (grade === "C" || grade === "D" || grade === "F") {
    m.recommendation = recommendation;
  }
  return m;
}

export function calculateScore(input: Form990Input): ScoreResult | null {
  const {
    totalRevenue,
    contributions,
    totalExpenses,
    programExpenses,
    mgmtExpenses,
    fundraisingExpenses,
  } = input;

  if (totalExpenses <= 0) return null;

  // 1. Program Efficiency — higher is better, ≥ 75%
  const programEff = programExpenses / totalExpenses;
  const programScore = (programEff / 0.75) * 100;

  // 2. Admin Overhead — lower is better, ≤ 15%
  const adminOverhead = mgmtExpenses / totalExpenses;
  const adminScore = (1 - adminOverhead / 0.15) * 100;

  // 3. Fundraising Efficiency — lower is better, ≤ 10%
  let fundraisingEff: number;
  let fundraisingScore: number;
  if (fundraisingExpenses === 0) {
    fundraisingEff = 0;
    fundraisingScore = 100;
  } else if (contributions <= 0) {
    fundraisingEff = 0;
    fundraisingScore = 0;
  } else {
    fundraisingEff = fundraisingExpenses / contributions;
    fundraisingScore = (1 - fundraisingEff / 0.1) * 100;
  }

  // 4. Revenue Diversity — higher is better, ≥ 30% non-grant
  let revenueDiversity: number;
  let revenueScore: number;
  if (contributions <= 0) {
    revenueDiversity = 1;
    revenueScore = 100;
  } else if (totalRevenue <= 0) {
    revenueDiversity = 0;
    revenueScore = 0;
  } else {
    revenueDiversity = 1 - contributions / totalRevenue;
    revenueScore = (revenueDiversity / 0.3) * 100;
  }

  // 5. Operating Margin — higher is better, benchmark ≥ 0%.
  // Benchmark of 0 makes the (value/benchmark) ratio undefined, so:
  //   margin ≥ 0  → 100 (passing)
  //   margin < 0  → linearly down to 0 at -10%
  const operatingMargin =
    totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : -1;
  const operatingScore =
    operatingMargin >= 0 ? 100 : 100 + operatingMargin * 1000;

  // 6. Cost per Dollar Raised — lower is better, ≤ $0.20
  let costPerDollar: number;
  let costScore: number;
  if (fundraisingExpenses === 0) {
    costPerDollar = 0;
    costScore = 100;
  } else if (contributions <= 0) {
    costPerDollar = 0;
    costScore = 0;
  } else {
    costPerDollar = fundraisingExpenses / contributions;
    costScore = (1 - costPerDollar / 0.2) * 100;
  }

  const metrics: MetricResult[] = [
    buildMetric(
      "Program Efficiency",
      programEff,
      fmtPct(programEff),
      "≥ 75%",
      programScore,
      `${fmtPct(programEff)} of every dollar spent goes to programs.`,
      "Reclassify shared costs into programs where appropriate, and shift overhead spending toward direct service delivery.",
    ),
    buildMetric(
      "Admin Overhead",
      adminOverhead,
      fmtPct(adminOverhead),
      "≤ 15%",
      adminScore,
      `Management costs are ${fmtPct(adminOverhead)} of total spending.`,
      "Audit non-program overhead and trim it under 15% of total expenses to free more dollars for the mission.",
    ),
    buildMetric(
      "Fundraising Efficiency",
      fundraisingEff,
      fmtPct(fundraisingEff),
      "≤ 10%",
      fundraisingScore,
      `You spent ${fmtPct(fundraisingEff)} of contributions on fundraising.`,
      "Audit fundraising channels and aim to keep total fundraising spend under 10% of contributions.",
    ),
    buildMetric(
      "Revenue Diversity",
      revenueDiversity,
      fmtPct(revenueDiversity),
      "≥ 30% non-grant",
      revenueScore,
      `${fmtPct(revenueDiversity)} of revenue comes from sources other than contributions.`,
      "Build earned-income streams, fees-for-service, or program revenue to reduce dependence on grants and donations.",
    ),
    buildMetric(
      "Operating Margin",
      operatingMargin,
      fmtPct(operatingMargin),
      "≥ 0%",
      operatingScore,
      `Operating margin is ${fmtPct(operatingMargin)}.`,
      "Close the revenue gap or trim non-essential expenses to operate at break-even or better.",
    ),
    buildMetric(
      "Cost per Dollar Raised",
      costPerDollar,
      fmtMoney(costPerDollar),
      "≤ $0.20",
      costScore,
      `It costs you ${fmtMoney(costPerDollar)} to raise $1.`,
      "Test more efficient fundraising channels — recurring giving, peer-to-peer, major donor cultivation — to lower cost per dollar raised.",
    ),
  ];

  const total =
    clamp(programScore, 0, 100) * 0.35 +
    clamp(adminScore, 0, 100) * 0.2 +
    clamp(fundraisingScore, 0, 100) * 0.15 +
    clamp(revenueScore, 0, 100) * 0.1 +
    clamp(operatingScore, 0, 100) * 0.15 +
    clamp(costScore, 0, 100) * 0.05;

  const totalScore = Math.round(total);
  const grade = gradeFromScore(totalScore);
  const percentile = clamp(totalScore - 10, 1, 99);

  return { totalScore, grade, percentile, metrics };
}

// --- Verification: run with `npx ts-node lib/scoring.ts` ---
declare const require: { main?: unknown } | undefined;
declare const module: unknown;
const isMainCJS =
  typeof require !== "undefined" && require !== null && require.main === module;
const isMainArgv =
  typeof process !== "undefined" &&
  typeof process.argv?.[1] === "string" &&
  /scoring\.[mc]?[jt]s$/.test(process.argv[1]);
if (isMainCJS || isMainArgv) {
  const result = calculateScore({
    totalRevenue: 500000,
    programRevenue: 50000,
    contributions: 400000,
    totalExpenses: 480000,
    programExpenses: 360000,
    mgmtExpenses: 72000,
    fundraisingExpenses: 48000,
  });
  console.log(result?.totalScore); // expect ~62 (C range)
  console.log(result?.grade); // expect 'C'
}
