'use client';

import { useRef, useState } from 'react';
import type { WorkbookResult } from '@/lib/types';

interface UploadScreenProps {
  onParsed: (workbook: WorkbookResult) => void;
}

export function UploadScreen({ onParsed }: UploadScreenProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Upload failed.');
        return;
      }
      onParsed(data as WorkbookResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Financial Dashboard</h1>
          <p className="text-sm text-muted mt-2">
            Upload a QuickBooks financial reports export to generate a board-ready dashboard.
          </p>
        </div>

        <label
          htmlFor="file-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-foreground bg-gray-50'
              : 'border-border hover:border-gray-300'
          } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            id="file-input"
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="text-sm text-muted flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-foreground rounded-full animate-pulse" />
              Parsing file…
            </div>
          ) : (
            <>
              <div className="text-sm text-foreground font-medium mb-1">
                Drop a .xlsx file here, or click to select
              </div>
              <div className="text-xs text-muted">
                QuickBooks export with Balance Sheet, P&amp;L, or P&amp;L by Class
              </div>
            </>
          )}
        </label>

        {error && (
          <div className="mt-4 border border-negative/30 bg-red-50 rounded-xl p-4 text-sm text-negative">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={async () => {
              setError('');
              setUploading(true);
              try {
                const response = await fetch('/api/sample');
                const data = await response.json();
                if (!response.ok) {
                  setError(data.error ?? 'Failed to load sample.');
                  return;
                }
                onParsed(data as WorkbookResult);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load sample.');
              } finally {
                setUploading(false);
              }
            }}
            className="text-xs text-muted underline hover:text-foreground"
            disabled={uploading}
          >
            Or try with sample data (ABC Organization)
          </button>
        </div>
      </div>
    </main>
  );
}
