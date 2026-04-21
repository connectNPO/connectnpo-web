import ExcelJS from 'exceljs';
import type { ParsedReport, WorkbookResult } from './types';
import { detectReportType } from './utils';
import {
  parseBalanceSheet,
  parseProfitLoss,
  parseProfitLossByClass,
  parseProjectProfitLoss,
} from './parsers';
import { deriveMetrics } from './metrics';

type Row = (string | number | null | undefined)[];

function sheetToRows(ws: ExcelJS.Worksheet): Row[] {
  const rows: Row[] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    const values = row.values as unknown[];
    const cleaned: Row = [];
    for (let i = 1; i < values.length; i++) {
      const v = values[i];
      if (v === undefined || v === null) {
        cleaned.push(null);
      } else if (typeof v === 'object' && v !== null && 'result' in v) {
        cleaned.push((v as { result: unknown }).result as string | number | null);
      } else if (typeof v === 'object' && v !== null && 'richText' in v) {
        const rich = (v as { richText: { text: string }[] }).richText;
        cleaned.push(rich.map((r) => r.text).join(''));
      } else {
        cleaned.push(v as string | number);
      }
    }
    rows.push(cleaned);
  });
  return rows;
}

export async function parseWorkbook(source: string | Buffer | ArrayBuffer): Promise<WorkbookResult> {
  const wb = new ExcelJS.Workbook();
  if (typeof source === 'string') {
    await wb.xlsx.readFile(source);
  } else {
    // ExcelJS Buffer type is older than Node 22 Buffer<ArrayBufferLike>; cast to bypass.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(source as any);
  }

  const reports: ParsedReport[] = [];

  for (const ws of wb.worksheets) {
    const rows = sheetToRows(ws);
    const nonEmptyRows = rows.filter((r) => r.some((c) => c !== null && c !== undefined && c !== ''));
    const headerText = nonEmptyRows.slice(0, 3).map((r) => String(r[0] ?? '')).join(' | ');
    const reportType = detectReportType(ws.name, headerText);

    try {
      switch (reportType) {
        case 'balance_sheet':
          reports.push(parseBalanceSheet(rows, ws.name));
          break;
        case 'profit_loss':
          reports.push(parseProfitLoss(rows, ws.name));
          break;
        case 'profit_loss_by_class':
          reports.push(parseProfitLossByClass(rows, ws.name));
          break;
        case 'project_profit_loss':
          reports.push(parseProjectProfitLoss(rows, ws.name));
          break;
        default:
          reports.push({ type: 'unknown', sheetName: ws.name });
      }
    } catch (err) {
      reports.push({
        type: 'unknown',
        sheetName: ws.name,
        meta: { reportName: `ERROR: ${(err as Error).message}`, orgName: '', periodLabel: '' },
      });
    }
  }

  const derivedMetrics = deriveMetrics(reports);

  return {
    sourceFile: typeof source === 'string' ? source : 'uploaded',
    parsedAt: new Date().toISOString(),
    reports,
    derivedMetrics,
  };
}
