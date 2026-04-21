import { NextRequest, NextResponse } from 'next/server';
import { parseWorkbook } from '@/lib/workbook';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024}MB.` },
        { status: 413 },
      );
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Only .xlsx files are supported.' },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await parseWorkbook(buffer);

    const hasStructuredReports = result.reports.some((r) => r.type !== 'unknown');
    if (!hasStructuredReports) {
      return NextResponse.json(
        {
          error:
            'Could not recognize any financial reports in this file. Expected QuickBooks export with Statement of Financial Position, P&L, or P&L by Class.',
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ...result,
      sourceFile: file.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
