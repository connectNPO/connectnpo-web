"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { FOCUS_AREAS } from "@/lib/constants";
import type { EnrichedGrant, SearchGrantsResponse } from "@/lib/types";
import GrantCard from "./grant-card";

export default function SearchPage() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [category, setCategory] = useState("Education");
  const [customKeyword, setCustomKeyword] = useState("");

  // App state
  const [submitted, setSubmitted] = useState(false);
  const [grants, setGrants] = useState<EnrichedGrant[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchGrants = useCallback(
    async (cat: string, p: number, keyword?: string) => {
      // Cancel previous request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          category: cat,
          page: String(p),
        });
        if (keyword) params.set("keyword", keyword);

        const res = await fetch(`/api/search-grants?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Search failed");

        const data: SearchGrantsResponse = await res.json();
        setGrants(data.grants);
        setHitCount(data.hitCount);
        setTotalPages(data.totalPages);
        setPage(data.page);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Failed to load grants. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim() || !email.trim() || !orgName.trim()) {
      setSubmitError("All fields are required.");
      return;
    }

    // Save to Supabase
    try {
      await supabase.from("organizations").insert({
        name: orgName.trim(),
        email: email.trim(),
        mission: "",
        focus_area: category,
        annual_budget: "",
        state: "",
      });
    } catch {
      // Non-blocking: don't prevent search if Supabase fails
      console.error("Supabase insert failed");
    }

    setSubmitted(true);
    const kw = category === "Other" ? customKeyword : undefined;
    fetchGrants(category, 1, kw);
  }

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    if (!submitted) return;
    setPage(1);
    const kw = newCategory === "Other" ? customKeyword : undefined;
    fetchGrants(newCategory, 1, kw);
  }

  function handlePageChange(newPage: number) {
    const kw = category === "Other" ? customKeyword : undefined;
    fetchGrants(category, newPage, kw);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadCSV() {
    if (grants.length === 0) return;

    const headers = [
      "Title",
      "Agency",
      "Opportunity Number",
      "Award Floor",
      "Award Ceiling",
      "Total Funding",
      "Deadline",
      "Days Left",
      "501(c)(3) Eligible",
      "Cost Sharing",
      "Category",
      "Grants.gov URL",
    ];

    const rows = grants.map((g) => {
      const days = g.closeDate
        ? Math.ceil(
            (new Date(g.closeDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : "";
      const eligible = g.applicantTypes.some(
        (t) => t.includes("501c3") || t.includes("nonprofit")
      );

      return [
        g.title,
        g.agency,
        g.opportunityNumber,
        g.awardFloor ?? "",
        g.awardCeiling ?? "",
        g.totalFunding ?? "",
        g.closeDate ?? "",
        days,
        eligible ? "Yes" : "Check",
        g.isCostSharing ? "Yes" : "No",
        g.fundingCategories.join("; "),
        `https://www.grants.gov/search-results-detail/${g.id}`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `connectnpo-grants-${category.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 lg:min-h-screen shrink-0 border-b lg:border-b-0 lg:border-r border-border p-6 bg-muted/30">
        <h1 className="text-xl font-bold tracking-tight">ConnectNPO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant Research Tool
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!submitted ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nonprofit.org"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Community Food Bank"
                  required
                />
              </div>
            </>
          ) : (
            <div className="rounded-md bg-card border border-border p-3 text-sm">
              <p className="font-medium">{orgName}</p>
              <p className="text-muted-foreground">{name} · {email}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="category">Focus Area</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {FOCUS_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {category === "Other" && (
            <div className="space-y-1.5">
              <Label htmlFor="keyword">Search Keyword</Label>
              <Input
                id="keyword"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="e.g., youth mentoring"
              />
            </div>
          )}

          {!submitted && (
            <>
              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}
              <Button type="submit" className="w-full">
                Find Grants
              </Button>
            </>
          )}

          {submitted && category === "Other" && (
            <Button
              type="button"
              className="w-full"
              onClick={() => fetchGrants("Other", 1, customKeyword)}
            >
              Search
            </Button>
          )}
        </form>

        {/* GivingArc CTA */}
        {submitted && (
          <div className="mt-8 rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm font-semibold">Need Help Getting Grant-Ready?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              GivingArc provides bookkeeping, 990 filing, and financial
              statement preparation for nonprofits.
            </p>
            <a
              href="https://givingarc.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="mt-3 w-full">
                Request a Free Review
              </Button>
            </a>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-muted/15">
        {!submitted ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold tracking-tight">
                Your Grant Readiness Report
              </h2>
              <p className="mt-3 text-muted-foreground">
                Enter your name, email, and organization to search 1,700+
                federal grant opportunities.
              </p>
            </div>
          </div>
        ) : loading && grants.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Searching grants...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <div className="max-w-4xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {hitCount} Matching Grants
                </h2>
                <p className="text-sm text-muted-foreground">
                  {category} · 501(c)(3) eligible
                </p>
              </div>
              {grants.length > 0 && (
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  Download CSV
                </Button>
              )}
            </div>

            {loading && (
              <p className="mb-4 text-sm text-muted-foreground">
                Updating results...
              </p>
            )}

            {/* Grant Cards */}
            {grants.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No grants found for this category.
              </p>
            ) : (
              <div className="space-y-8">
                {grants.map((grant) => (
                  <GrantCard key={grant.id} grant={grant} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
