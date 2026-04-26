"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const d = searchParams.get("d") ?? "";

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Email is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          orgName,
          optIn,
          encodedData: d,
        }),
      });
      router.push(`/results?d=${encodeURIComponent(d)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-[1200px] px-6 py-12">
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-[600px] opacity-40 blur-md pointer-events-none select-none"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex justify-center">
            <div className="w-[180px] h-[180px] rounded-full border-[14px] border-[#1D9E75]/40 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl text-[#1A2E44]">??</div>
                <div className="text-2xl text-[#1D9E75]">?</div>
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg border border-gray-200 bg-gray-50"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-start justify-center px-6 pt-20">
        <div className="w-full min-w-[320px] sm:min-w-[480px] max-w-[560px] rounded-xl border border-gray-100 bg-white p-12 shadow-lg">
          <h2 className="text-2xl font-medium text-[#1A2E44] tracking-tight">
            Your 990 Health Score is ready
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send your full report.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1A2E44]"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-12 rounded-lg border border-gray-200 px-3 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
              />
            </div>
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-[#1A2E44]"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full h-12 rounded-lg border border-gray-200 px-3 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
              />
            </div>
            <div>
              <label
                htmlFor="orgName"
                className="block text-sm font-medium text-[#1A2E44]"
              >
                Organization
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 w-full h-12 rounded-lg border border-gray-200 px-3 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#1D9E75]"
              />
              <span>Send me nonprofit accounting tips</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] rounded-lg bg-[#1A2E44] px-4 text-white font-medium hover:bg-[#243B57] disabled:opacity-60 transition-colors"
            >
              {submitting ? "Sending…" : "Show me my score →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GateInner />
    </Suspense>
  );
}
