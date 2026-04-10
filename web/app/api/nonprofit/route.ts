import { NextRequest } from "next/server";
import { searchNonprofits, getOrganization } from "@/lib/propublica";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const ein = request.nextUrl.searchParams.get("ein");

  // Lookup by EIN (returns single org with filings)
  if (ein) {
    try {
      const org = await getOrganization(Number(ein));
      if (!org) {
        return Response.json({ error: "Organization not found" }, { status: 404 });
      }
      return Response.json(org);
    } catch (err) {
      console.error("ProPublica org lookup failed:", err);
      return Response.json({ error: "Failed to fetch organization" }, { status: 502 });
    }
  }

  // Search by name
  if (name) {
    try {
      const results = await searchNonprofits(name);
      return Response.json({ results });
    } catch (err) {
      console.error("ProPublica search failed:", err);
      return Response.json({ error: "Failed to search nonprofits" }, { status: 502 });
    }
  }

  return Response.json(
    { error: "Provide either 'name' or 'ein' query parameter" },
    { status: 400 }
  );
}
