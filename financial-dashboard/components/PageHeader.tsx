'use client';

import { useState } from 'react';

interface PageHeaderProps {
  orgName: string;
  period: string;
  onReset?: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function PageHeader({ orgName, period, onReset }: PageHeaderProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    const element = document.querySelector('main');
    if (!element) return;

    setExporting(true);
    document.body.classList.add('exporting-pdf');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `${slugify(orgName) || 'dashboard'}-${slugify(period) || 'report'}.pdf`;

      await html2pdf()
        .set({
          margin: [10, 10, 12, 10],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            ignoreElements: (el: Element) => el.classList?.contains('no-print'),
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(element)
        .save();
    } finally {
      document.body.classList.remove('exporting-pdf');
      setExporting(false);
    }
  }

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{orgName}</h1>
          <p className="text-sm text-muted mt-0.5">{period}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Upload new file
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="text-sm bg-foreground text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </header>
  );
}
