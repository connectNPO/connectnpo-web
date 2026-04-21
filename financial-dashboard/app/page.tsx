'use client';

import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { UploadScreen } from '@/components/UploadScreen';
import type { WorkbookResult } from '@/lib/types';

const STORAGE_KEY = 'financial-dashboard-workbook';

export default function HomePage() {
  const [workbook, setWorkbook] = useState<WorkbookResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWorkbook(JSON.parse(stored) as WorkbookResult);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  function handleParsed(parsed: WorkbookResult) {
    setWorkbook(parsed);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // sessionStorage may fail for very large payloads — ignore silently
    }
  }

  function handleReset() {
    setWorkbook(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('financial-dashboard-ai-results');
  }

  if (!hydrated) {
    return <main className="min-h-screen bg-white" />;
  }

  if (!workbook) {
    return <UploadScreen onParsed={handleParsed} />;
  }

  return <Dashboard workbook={workbook} onReset={handleReset} />;
}
