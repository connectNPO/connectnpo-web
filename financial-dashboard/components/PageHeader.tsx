'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  async function handleExport() {
    if (exporting) return;
    const element = document.querySelector('main');
    if (!element) return;

    setExporting(true);
    document.body.classList.add('exporting-pdf');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `${slugify(orgName) || 'dashboard'}-${slugify(period) || 'report'}.pdf`;

      // html2pdf.js TypeScript types don't include every runtime option (e.g. pagebreak),
      // so we cast the options object to bypass strict type checking.
      const options = {
        margin: [10, 10, 12, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#f8f8f6',
          ignoreElements: (el: Element) => el.classList?.contains('no-print'),
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: '.pdf-avoid-break',
          before: '.pdf-break-before',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      await html2pdf().set(options).from(element).save();
    } finally {
      document.body.classList.remove('exporting-pdf');
      setExporting(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-border pdf-avoid-break">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{orgName}</h1>
          <p className="text-sm text-muted mt-0.5 truncate">{period}</p>
        </div>
        <div className="flex items-center gap-2 no-print shrink-0">
          {userEmail && (
            <span className="hidden md:inline text-xs text-muted mr-2" title={userEmail}>
              {userEmail}
            </span>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Upload new file
            </button>
          )}
          <Link
            href="/statements"
            className="text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Statements
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="text-sm bg-foreground text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Generating PDF…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-muted hover:text-foreground transition-colors px-2"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
