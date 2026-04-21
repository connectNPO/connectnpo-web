import type { DerivedMetrics, ParsedReport, BalanceSheet, ProfitLoss, ProfitLossByClass } from './types';

export const EXECUTIVE_SUMMARY_SYSTEM_PROMPT = `You are a senior nonprofit finance communicator writing for a board of directors. Your audience is board members who are dedicated to the mission but often not finance specialists.

Your job is to translate financial data into a clear, board-ready executive summary that supports informed decision-making.

## Tone and Style
- Professional but accessible — avoid jargon without explanation
- Confident, not alarmist — flag concerns factually
- Forward-looking where appropriate, grounded in the numbers provided
- Concise — board members are busy; every sentence should earn its place

## Strict Rules
1. **Use only the numbers provided.** Never calculate, estimate, or infer values beyond what is given. If a metric is missing, omit it rather than guessing.
2. **Restricted vs. Unrestricted is critical.** When cash or net assets include restricted funds, make that distinction explicit. Board members often misread a large cash balance as operational flexibility.
3. **Contextualize ratios.** When mentioning Program Services ratio, briefly reference that 65%+ is typical guidance and 85%+ is considered excellent — only if the data justifies the framing.
4. **Flag material observations.** If a project lost money, a single revenue source dominates income, or restricted funds make up most of the position, surface it neutrally.
5. **No fictional context.** Do not invent prior-year comparisons, benchmarks, or narrative that the data does not support.

## Required Structure

Output a Markdown document with exactly these sections:

### Financial Snapshot
One paragraph summarizing overall financial position (cash, net revenue, runway). Lead with the unrestricted position if the data supports that distinction.

### Revenue & Operations
One paragraph covering revenue composition and expense discipline (Program/Admin/Fundraising). Call out the Program Services ratio if available.

### Notable Observations
2-4 bullet points highlighting anything the board should understand but might miss from the topline numbers. Examples: large restricted balances, dependency on a single grant, underperforming projects, unusual liabilities.

### Looking Ahead
One paragraph with a neutral forward-looking framing based on the current position. No prescriptions — just what the data suggests for the coming period.

Keep the entire summary under 400 words. Use bold sparingly for key figures.`;

interface SummaryInput {
  orgName: string;
  periodLabel: string;
  metrics: DerivedMetrics;
  balanceSheet?: BalanceSheet;
  profitLoss?: ProfitLoss;
  profitLossByClass?: ProfitLossByClass;
}

export function buildExecutiveSummaryUserPrompt(input: SummaryInput): string {
  const { orgName, periodLabel, metrics, balanceSheet, profitLoss, profitLossByClass } = input;

  const lines: string[] = [];
  lines.push(`Please draft an executive summary for the following organization and reporting period.`);
  lines.push('');
  lines.push(`**Organization:** ${orgName}`);
  lines.push(`**Period:** ${periodLabel}`);
  lines.push('');
  lines.push(`## Key Financial Data`);

  if (metrics.cashOnHand !== undefined) {
    lines.push(`- Cash on hand: $${metrics.cashOnHand.toLocaleString()}`);
  }
  if (metrics.unrestrictedCashEstimate !== undefined && metrics.cashOnHand !== undefined && metrics.unrestrictedCashEstimate !== metrics.cashOnHand) {
    lines.push(`- Unrestricted cash (estimate): $${metrics.unrestrictedCashEstimate.toLocaleString()}`);
  }
  if (metrics.ytdNetRevenue !== undefined) {
    lines.push(`- YTD Net Revenue: ${metrics.ytdNetRevenue >= 0 ? '+' : ''}$${metrics.ytdNetRevenue.toLocaleString()}`);
  }
  if (metrics.monthsOfRunway !== undefined) {
    lines.push(`- Months of runway: ${metrics.monthsOfRunway.toFixed(1)}`);
  }
  if (metrics.monthlyBurnRate !== undefined) {
    lines.push(`- Monthly burn rate: $${Math.round(metrics.monthlyBurnRate).toLocaleString()}`);
  }
  if (metrics.currentRatio !== undefined) {
    lines.push(`- Current ratio: ${metrics.currentRatio.toFixed(2)}x`);
  }
  if (metrics.debtToAssets !== undefined) {
    lines.push(`- Debt to assets: ${(metrics.debtToAssets * 100).toFixed(1)}%`);
  }

  if (metrics.functionalRatios) {
    lines.push('');
    lines.push(`## Functional Expense Ratios (990 Part IX)`);
    lines.push(`- Program Services: ${(metrics.functionalRatios.program * 100).toFixed(1)}%`);
    lines.push(`- Management & General: ${(metrics.functionalRatios.admin * 100).toFixed(1)}%`);
    lines.push(`- Fundraising: ${(metrics.functionalRatios.fundraising * 100).toFixed(1)}%`);
  }

  if (profitLoss && profitLoss.totals.totalRevenue > 0) {
    lines.push('');
    lines.push(`## Revenue Composition`);
    lines.push(`- Total revenue: $${profitLoss.totals.totalRevenue.toLocaleString()}`);
    const revenueItems = profitLoss.revenue.filter((r) => !r.isSubtotal && r.amount > 0);
    for (const r of revenueItems) {
      const pct = ((r.amount / profitLoss.totals.totalRevenue) * 100).toFixed(1);
      lines.push(`  - ${r.accountName}: $${r.amount.toLocaleString()} (${pct}%)`);
    }
  }

  if (metrics.projectProfitability && metrics.projectProfitability.length > 0) {
    lines.push('');
    lines.push(`## Project Profitability`);
    for (const p of metrics.projectProfitability) {
      lines.push(`- ${p.name}: ${p.netRevenue >= 0 ? '+' : ''}$${p.netRevenue.toLocaleString()}`);
    }
  }

  if (balanceSheet) {
    lines.push('');
    lines.push(`## Balance Sheet Highlights`);
    lines.push(`- Total assets: $${balanceSheet.totals.totalAssets.toLocaleString()}`);
    lines.push(`- Total liabilities: $${balanceSheet.totals.totalLiabilities.toLocaleString()}`);
    lines.push(`- Total equity (net assets): $${balanceSheet.totals.totalEquity.toLocaleString()}`);

    const restrictedEquity = balanceSheet.equity.lines.find((l) => /with.*restriction/i.test(l.accountName));
    const unrestrictedEquity = balanceSheet.equity.lines.find((l) => /without.*restriction/i.test(l.accountName));
    if (restrictedEquity) {
      lines.push(`- Net Assets With Donor Restrictions: $${restrictedEquity.amount.toLocaleString()}`);
    }
    if (unrestrictedEquity) {
      lines.push(`- Net Assets Without Donor Restrictions: $${unrestrictedEquity.amount.toLocaleString()}`);
    }
  }

  lines.push('');
  lines.push(`Draft the executive summary now. Follow the required structure exactly.`);

  return lines.join('\n');
}

export const BOARD_QA_SYSTEM_PROMPT = `You are a nonprofit finance communicator helping an Executive Director prepare for a board meeting. Your task is to anticipate the questions board members will ask about the financial data, and provide clear, board-ready answer drafts the ED can adapt.

## Audience
Board members — dedicated to the mission, often with non-finance backgrounds. They tend to ask:
- "Are we okay?" questions (liquidity, runway, solvency)
- "What does this number mean?" questions (ratios, restricted vs. unrestricted)
- "Why" questions about changes, concentrations, or unusual items
- Forward-looking questions (sustainability, risk, opportunity)

## Strict Rules
1. **Use only the numbers provided.** Never estimate or infer beyond the data.
2. **Draft 4-6 questions total.** Mix "reassuring" questions with "probing" questions a thoughtful board member would raise.
3. **Restricted vs. Unrestricted:** If the data suggests a gap between total cash and unrestricted cash, at least one question must address this.
4. **Answers should be 2-4 sentences.** Plain language, confident but not defensive.
5. **No fictional data.** Don't invent prior-year comparisons, peer benchmarks not stated in the data, or future plans.

## Required Output Format

Markdown with this exact structure for each Q&A:

### Q: [The question in the voice of a board member]
**A:** [Answer draft for the ED, 2-4 sentences, plain language]

Separate each Q&A with a blank line. No introduction or conclusion — just the questions and answers.`;

export function buildBoardQAUserPrompt(input: SummaryInput): string {
  return buildExecutiveSummaryUserPrompt(input).replace(
    'Draft the executive summary now. Follow the required structure exactly.',
    'Now draft 4-6 likely board questions and ED answer drafts based on this data. Follow the Q&A format exactly.',
  );
}

export const CHART_EXPLANATIONS_SYSTEM_PROMPT = `You are a nonprofit finance communicator writing plain-language captions for a board meeting dashboard. For each metric or chart listed, produce a 1-2 sentence caption that explains **why it matters** to the board — not what it is.

## Audience
Board members seeing the dashboard for the first time during a meeting. They glance at numbers; your captions tell them what to take away.

## Strict Rules
1. **Each caption is 1-2 sentences, maximum 30 words.**
2. **Focus on the "so what," not the "what."** Don't restate the number — interpret it.
3. **Use only the data provided.** No external benchmarks, no invented comparisons.
4. **Neutral, informative tone.** Not alarmist, not sycophantic.

## Required Output Format

Markdown with one caption per metric. Use this exact format:

**[Metric Name]:** [1-2 sentence caption.]

Cover these metrics in this order:
1. Cash on Hand
2. Months of Runway
3. YTD Net Revenue
4. Functional Expenses (Program ratio)
5. Revenue Composition (restricted vs. unrestricted)
6. Project Profitability

Skip any metric if the data is missing or zero. No headings, intro, or conclusion — just the labeled captions.`;

export function buildChartExplanationsUserPrompt(input: SummaryInput): string {
  return buildExecutiveSummaryUserPrompt(input).replace(
    'Draft the executive summary now. Follow the required structure exactly.',
    'Now write a short caption for each metric listed in the required output format. Each caption must explain why that metric matters for this specific organization.',
  );
}

export function extractSummaryInput(reports: ParsedReport[], metrics: DerivedMetrics): SummaryInput | null {
  const bs = reports.find((r) => r.type === 'balance_sheet') as BalanceSheet | undefined;
  const pl = reports.find((r) => r.type === 'profit_loss') as ProfitLoss | undefined;
  const plClass = reports.find((r) => r.type === 'profit_loss_by_class') as ProfitLossByClass | undefined;

  const orgName = bs?.meta.orgName ?? pl?.meta.orgName ?? plClass?.meta.orgName;
  const periodLabel = pl?.meta.periodLabel ?? bs?.meta.periodLabel ?? plClass?.meta.periodLabel;
  if (!orgName || !periodLabel) return null;

  return {
    orgName,
    periodLabel,
    metrics,
    balanceSheet: bs,
    profitLoss: pl,
    profitLossByClass: plClass,
  };
}
