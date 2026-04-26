"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/scoring";

interface Props {
  scoreResult: ScoreResult;
  orgName?: string;
}

export default function PdfDownloadButton({ scoreResult, orgName }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const [{ pdf }, { ReportPDF }, fileSaver] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ReportPDFDocument"),
        import("file-saver"),
      ]);
      const saveAs = fileSaver.saveAs ?? fileSaver.default;
      const blob = await pdf(
        <ReportPDF scoreResult={scoreResult} orgName={orgName} />,
      ).toBlob();
      saveAs(blob, "990-health-score.pdf");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="inline-block rounded-lg border border-gray-200 bg-white px-8 py-4 text-center text-[#1A2E44] font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
    >
      {downloading ? "Generating PDF…" : "Download PDF Report"}
    </button>
  );
}
