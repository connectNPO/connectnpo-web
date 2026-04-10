import { NextRequest } from "next/server";
import { searchGrants } from "@/lib/grants";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword") ?? "";

  if (!keyword) {
    return Response.json(
      { error: "keyword query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await searchGrants({ keyword, rows: 10 });
    return Response.json(result);
  } catch (err) {
    console.error("Grant search failed:", err);
    return Response.json(
      { error: "Failed to fetch grants from Grants.gov" },
      { status: 502 }
    );
  }
}
