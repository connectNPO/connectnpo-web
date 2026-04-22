export type ReportType =
  | 'balance_sheet'
  | 'profit_loss'
  | 'profit_loss_by_class'
  | 'project_profit_loss'
  | 'unknown';

export interface ReportMeta {
  reportName: string;
  orgName: string;
  periodLabel: string;
  projectName?: string;
}

export interface AccountLine {
  accountNumber?: string;
  accountName: string;
  amount: number;
  indentLevel: number;
  isSubtotal: boolean;
  memo?: string;
}

export interface BalanceSheet {
  type: 'balance_sheet';
  meta: ReportMeta;
  assets: {
    currentAssets: AccountLine[];
    fixedAssets: AccountLine[];
    otherAssets: AccountLine[];
    total: number;
  };
  liabilities: {
    currentLiabilities: AccountLine[];
    total: number;
  };
  equity: {
    lines: AccountLine[];
    total: number;
  };
  totals: {
    totalAssets: number;
    totalCurrentAssets: number;
    totalFixedAssets: number;
    totalOtherAssets: number;
    totalLiabilities: number;
    totalCurrentLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
  };
}

export interface ProfitLoss {
  type: 'profit_loss';
  meta: ReportMeta;
  revenue: AccountLine[];
  expenditures: AccountLine[];
  otherRevenue: AccountLine[];
  otherExpenditures: AccountLine[];
  totals: {
    totalRevenue: number;
    grossProfit: number;
    totalExpenditures: number;
    netOperatingRevenue: number;
    totalOtherRevenue: number;
    totalOtherExpenditures: number;
    netOtherRevenue: number;
    netRevenue: number;
  };
}

export interface ProfitLossByClass {
  type: 'profit_loss_by_class';
  meta: ReportMeta;
  classes: string[];
  rows: {
    accountName: string;
    accountNumber?: string;
    indentLevel: number;
    isSubtotal: boolean;
    byClass: Record<string, number | null>;
    total: number;
  }[];
  functionalExpenseRatio?: {
    program: number;
    admin: number;
    fundraising: number;
    totalExpenses: number;
  };
}

export interface ProjectProfitLoss {
  type: 'project_profit_loss';
  meta: ReportMeta;
  revenue: AccountLine[];
  expenditures: AccountLine[];
  totals: {
    totalRevenue: number;
    totalExpenditures: number;
    netRevenue: number;
  };
}

export type ParsedReport =
  | BalanceSheet
  | ProfitLoss
  | ProfitLossByClass
  | ProjectProfitLoss
  | { type: 'unknown'; sheetName: string; meta?: ReportMeta };

export interface WorkbookResult {
  sourceFile: string;
  parsedAt: string;
  reports: ParsedReport[];
  derivedMetrics?: DerivedMetrics;
}

export interface BreakdownLine {
  label: string;
  amount: number;
}

export interface CategoryBreakdown {
  label: string;
  value: number;
  amount: number;
  breakdown?: BreakdownLine[];
}

export interface DerivedMetrics {
  cashOnHand?: number;
  unrestrictedCashEstimate?: number;
  currentRatio?: number;
  debtToAssets?: number;
  ytdNetRevenue?: number;
  functionalRatios?: {
    program: number;
    admin: number;
    fundraising: number;
    programAmount: number;
    adminAmount: number;
    fundraisingAmount: number;
  };
  monthlyBurnRate?: number;
  monthsOfRunway?: number;
  projectProfitability?: { name: string; netRevenue: number }[];
  revenueBreakdown?: CategoryBreakdown[];
  expenseBreakdown?: CategoryBreakdown[];
}
