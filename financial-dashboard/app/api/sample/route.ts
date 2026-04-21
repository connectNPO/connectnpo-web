import path from 'node:path';
import { NextResponse } from 'next/server';
import { parseWorkbook } from '@/lib/workbook';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const samplePath = path.join(process.cwd(), 'samples', 'abc-org-july-march-2026.xlsx');
    const result = await parseWorkbook(samplePath);
    return NextResponse.json({ ...result, sourceFile: 'abc-org-july-march-2026.xlsx (sample)' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load sample';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
