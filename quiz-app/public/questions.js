export const CATEGORIES = {
  record_keeping:       { label: 'Record Keeping',         max: 8 },
  financial_separation: { label: 'Financial Separation',   max: 6 },
  board_governance:     { label: 'Board Governance',       max: 8 },
  program_tracking:     { label: 'Program Tracking',       max: 8 },
  compliance:           { label: 'Compliance & Reporting', max: 6 }
};

export const QUESTIONS = [
  { id: 1,  category: 'record_keeping',       text: 'Are all donation receipts saved and organized?' },
  { id: 2,  category: 'record_keeping',       text: 'Do you have records of all grants received?' },
  { id: 3,  category: 'record_keeping',       text: 'Are bank statements reconciled monthly?' },
  { id: 4,  category: 'record_keeping',       text: 'Are expense receipts stored for all purchases?' },

  { id: 5,  category: 'financial_separation', text: 'Is the org bank account separate from personal accounts?' },
  { id: 6,  category: 'financial_separation', text: 'Does the org have its own credit/debit card?' },
  { id: 7,  category: 'financial_separation', text: 'Are payroll records kept separately?' },

  { id: 8,  category: 'board_governance',     text: 'Are board meeting minutes recorded regularly?' },
  { id: 9,  category: 'board_governance',     text: 'Does the board review financial reports quarterly?' },
  { id: 10, category: 'board_governance',     text: 'Is there a written conflict of interest policy?' },
  { id: 11, category: 'board_governance',     text: 'Are board member terms and roles documented?' },

  { id: 12, category: 'program_tracking',     text: 'Are expenses tracked by program/project?' },
  { id: 13, category: 'program_tracking',     text: 'Do you track program outcomes and metrics?' },
  { id: 14, category: 'program_tracking',     text: 'Are grant funds tracked separately per grant?' },
  { id: 15, category: 'program_tracking',     text: 'Is there a written budget for each program?' },

  { id: 16, category: 'compliance',           text: 'Has Form 990 been filed on time in prior years?' },
  { id: 17, category: 'compliance',           text: 'Are tax-exempt status documents accessible?' },
  { id: 18, category: 'compliance',           text: 'Is there a document retention policy in place?' }
];

export const TIPS = {
  record_keeping:       'Use cloud-based accounting software (QuickBooks, Wave) and store all receipts digitally in dated folders.',
  financial_separation: 'Open a dedicated nonprofit bank account and keep all org expenses off personal cards — this is the #1 IRS red flag.',
  board_governance:     'Maintain a shared folder with board minutes, conflict-of-interest policy, and term documentation. Review quarterly.',
  program_tracking:     'Tag every expense with a program code so you can cleanly report program vs admin costs on Schedule O.',
  compliance:           'Check your 990 filing status at IRS.gov/TEOS and set annual calendar reminders 60 days before your deadline.'
};

export const GRADE_LABEL = {
  Green:  '990 Ready',
  Yellow: 'Needs Attention',
  Red:    'At Risk - Get Help'
};
