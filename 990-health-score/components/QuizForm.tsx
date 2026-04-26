"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  totalRevenue: string;
  programRevenue: string;
  contributions: string;
  totalExpenses: string;
  programExpenses: string;
  mgmtExpenses: string;
  fundraisingExpenses: string;
}

type FieldKey = keyof FormState;

interface FieldConfig {
  key: FieldKey;
  label: string;
  ref: string;
}

const REVENUE_FIELDS: FieldConfig[] = [
  { key: "totalRevenue", label: "Total Revenue", ref: "Part VIII, Line 12" },
  { key: "programRevenue", label: "Program Service Revenue", ref: "Part VIII, Line 2g" },
  { key: "contributions", label: "Contributions & Grants", ref: "Part VIII, Line 1h" },
];

const EXPENSE_FIELDS: FieldConfig[] = [
  { key: "totalExpenses", label: "Total Expenses", ref: "Part IX, Line 25" },
  { key: "programExpenses", label: "Program Service Expenses", ref: "Part IX, Line 25, Col B" },
  { key: "mgmtExpenses", label: "Management & General", ref: "Part IX, Line 25, Col C" },
  { key: "fundraisingExpenses", label: "Fundraising Expenses", ref: "Part IX, Line 25, Col D" },
];

const EMPTY: FormState = {
  totalRevenue: "",
  programRevenue: "",
  contributions: "",
  totalExpenses: "",
  programExpenses: "",
  mgmtExpenses: "",
  fundraisingExpenses: "",
};

function parseAmount(s: string): number {
  return parseFloat(s.replace(/[,$\s]/g, ""));
}

function formatAmount(s: string): string {
  if (s.trim() === "") return s;
  const n = parseAmount(s);
  if (Number.isNaN(n)) return s;
  return n.toLocaleString("en-US");
}

export default function QuizForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: FieldKey, raw: string) {
    setValues((v) => ({ ...v, [key]: raw }));
  }

  function handleBlur(key: FieldKey) {
    setValues((v) => ({ ...v, [key]: formatAmount(v[key]) }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed: Record<FieldKey, number> = {} as Record<FieldKey, number>;
    for (const k of Object.keys(values) as FieldKey[]) {
      const n = parseAmount(values[k]);
      if (Number.isNaN(n) || n < 0) {
        setError("Please enter a valid non-negative number for every field.");
        return;
      }
      parsed[k] = n;
    }

    if (parsed.totalRevenue <= 0 || parsed.totalExpenses <= 0) {
      setError("Total Revenue and Total Expenses must be greater than zero.");
      return;
    }

    if (
      parsed.programExpenses + parsed.mgmtExpenses + parsed.fundraisingExpenses >
      parsed.totalExpenses
    ) {
      setError(
        "Program + Management + Fundraising expenses cannot exceed Total Expenses.",
      );
      return;
    }

    setSubmitting(true);
    const encoded = encodeURIComponent(btoa(JSON.stringify(parsed)));
    router.push(`/results/gate?d=${encoded}`);
  }

  function renderField(f: FieldConfig) {
    return (
      <div key={f.key} className="space-y-1">
        <label htmlFor={f.key} className="block text-sm font-medium text-gray-900">
          {f.label}
        </label>
        <p className="text-xs text-gray-500">{f.ref}</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id={f.key}
            type="text"
            inputMode="decimal"
            required
            value={values[f.key]}
            onChange={(e) => update(f.key, e.target.value)}
            onBlur={() => handleBlur(f.key)}
            placeholder="0"
            className="w-full h-12 rounded-lg border border-gray-200 pl-7 pr-3 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 bg-white"
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-base font-medium text-[#1D9E75] uppercase tracking-wider">Revenue (Part VIII)</h2>
        <div className="grid gap-4">{REVENUE_FIELDS.map(renderField)}</div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-[#1D9E75] uppercase tracking-wider">Expenses (Part IX)</h2>
        <div className="grid gap-4">{EXPENSE_FIELDS.map(renderField)}</div>
      </section>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#1A2E44] px-8 py-4 text-white font-medium hover:bg-[#243B57] disabled:opacity-60 transition-colors"
      >
        {submitting ? "Calculating…" : "Get My Score →"}
      </button>
    </form>
  );
}
