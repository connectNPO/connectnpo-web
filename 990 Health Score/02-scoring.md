# Agent 02 — Scoring Engine

## Your job
Implement `lib/scoring.ts` — the entire business logic of the app.
No UI. Just calculation and types.

## Input type
```ts
export interface Form990Input {
  totalRevenue: number
  programRevenue: number
  contributions: number
  totalExpenses: number
  programExpenses: number
  mgmtExpenses: number
  fundraisingExpenses: number
}
```

## 6 metrics to calculate

| Metric | Formula | A grade |
|--------|---------|---------|
| Program Efficiency | programExpenses / totalExpenses | ≥ 75% |
| Admin Overhead | mgmtExpenses / totalExpenses | ≤ 15% |
| Fundraising Efficiency | fundraisingExpenses / contributions | ≤ 10% |
| Revenue Diversity | 1 - (contributions / totalRevenue) | ≥ 30% non-grant |
| Operating Margin | (totalRevenue - totalExpenses) / totalRevenue | ≥ 0% |
| Cost per Dollar Raised | fundraisingExpenses / contributions | ≤ $0.20 |

## Score per metric (0–100)
Each metric converts its raw value to a 0–100 score based on the benchmark.
For "higher is better" metrics: score = (value / benchmark) × 100, capped at 100.
For "lower is better" metrics: score = (1 - value / benchmark) × 100, floored at 0.

## Grade thresholds (applies to both metric score and total score)
A ≥ 85 | B ≥ 70 | C ≥ 55 | D ≥ 40 | F < 40

## Weights for total score
- Program Efficiency: 35%
- Admin Overhead: 20%
- Fundraising Efficiency: 15%
- Revenue Diversity: 10%
- Operating Margin: 15%
- Cost per Dollar Raised: 5%

## Output type
```ts
export interface MetricResult {
  name: string
  value: number
  formatted: string       // e.g. "72.4%" or "$0.18"
  benchmark: string       // e.g. "≥ 75%"
  score: number           // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  insight: string         // 1 sentence, always shown
  recommendation?: string // shown only for C/D/F grades
}

export interface ScoreResult {
  totalScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  percentile: number      // estimate: score - 10, clamped 1–99
  metrics: MetricResult[]
}
```

## Edge cases to handle
- fundraisingExpenses = 0 → Fundraising Efficiency and Cost per Dollar = perfect score
- contributions = 0 → Revenue Diversity = 100 (fully diversified)
- totalExpenses = 0 → return null (invalid input)

## Verify with this test (add at bottom, run with ts-node)
```ts
const result = calculateScore({
  totalRevenue: 500000,
  programRevenue: 50000,
  contributions: 400000,
  totalExpenses: 480000,
  programExpenses: 360000,
  mgmtExpenses: 72000,
  fundraisingExpenses: 48000,
})
console.log(result?.totalScore)  // expect ~62 (C range)
console.log(result?.grade)       // expect 'C'
```

## Done when
`npx ts-node lib/scoring.ts` runs and logs expected values.
