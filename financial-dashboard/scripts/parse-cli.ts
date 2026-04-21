import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { parseWorkbook } from '../lib/workbook';

function formatCurrency(n: number | undefined): string {
  if (n === undefined) return 'n/a';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatPct(n: number | undefined): string {
  if (n === undefined) return 'n/a';
  return `${(n * 100).toFixed(1)}%`;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npm run parse -- <path-to-xlsx>');
    process.exit(1);
  }

  const absPath = resolve(inputPath);
  console.log(`\nParsing: ${absPath}\n`);

  const result = await parseWorkbook(absPath);

  const outDir = resolve(dirname(absPath), '..', 'output');
  await mkdir(outDir, { recursive: true });
  const outPath = resolve(outDir, `${basename(absPath, '.xlsx')}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');

  console.log('='.repeat(70));
  console.log('SHEET DETECTION RESULTS');
  console.log('='.repeat(70));
  for (const r of result.reports) {
    const meta = 'meta' in r ? r.meta : undefined;
    const type = r.type.padEnd(22);
    const sheetName = 'sheetName' in r ? r.sheetName : meta?.reportName ?? '';
    console.log(`  ${type}  ${sheetName}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('DERIVED METRICS (for dashboard cards)');
  console.log('='.repeat(70));
  const m = result.derivedMetrics ?? {};
  console.log(`  Cash on hand                ${formatCurrency(m.cashOnHand)}`);
  console.log(`  Unrestricted cash (est.)    ${formatCurrency(m.unrestrictedCashEstimate)}`);
  console.log(`  Current ratio               ${m.currentRatio?.toFixed(2) ?? 'n/a'}x`);
  console.log(`  Debt to assets              ${formatPct(m.debtToAssets)}`);
  console.log(`  YTD Net Revenue             ${formatCurrency(m.ytdNetRevenue)}`);
  console.log(`  Monthly burn rate           ${formatCurrency(m.monthlyBurnRate)}`);
  console.log(`  Months of runway            ${m.monthsOfRunway?.toFixed(1) ?? 'n/a'}`);

  if (m.functionalRatios) {
    console.log(`\n  Functional Expense Ratios (990 Part IX):`);
    console.log(`    Program                 ${formatPct(m.functionalRatios.program)}`);
    console.log(`    Management & General    ${formatPct(m.functionalRatios.admin)}`);
    console.log(`    Fundraising             ${formatPct(m.functionalRatios.fundraising)}`);
  }

  if (m.projectProfitability?.length) {
    console.log(`\n  Project Profitability:`);
    for (const p of m.projectProfitability) {
      console.log(`    ${p.name.padEnd(40)}  ${formatCurrency(p.netRevenue)}`);
    }
  }

  console.log(`\nFull JSON written to: ${outPath}\n`);
}

main().catch((err) => {
  console.error('Parse failed:', err);
  process.exit(1);
});
