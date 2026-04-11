import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { searchGrants } from "@/lib/grants";
import { sendGrantAlert, type GrantEmailData } from "@/lib/email";
import { FOCUS_TO_CATEGORY, NONPROFIT_ELIGIBILITY } from "@/lib/constants";
import { formatDollars } from "@/lib/format";

// Vercel Cron calls this route daily
// Configured in vercel.json: "crons": [{ "path": "/api/cron/grant-alerts", "schedule": "0 14 * * *" }]

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron (not a random visitor)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Step 1: Get all users who want email alerts
    const { data: users, error: dbError } = await supabase
      .from("organizations")
      .select("id, name, email, focus_area, last_notified_at")
      .eq("email_alerts_enabled", true);

    if (dbError) {
      console.error("DB read error:", dbError);
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return Response.json({ message: "No users to notify", sent: 0 });
    }

    // Step 2: Group users by focus_area to minimize API calls
    const categoryGroups = new Map<string, typeof users>();
    for (const user of users) {
      const cat = user.focus_area || "Education";
      if (!categoryGroups.has(cat)) {
        categoryGroups.set(cat, []);
      }
      categoryGroups.get(cat)!.push(user);
    }

    let totalSent = 0;

    // Step 3: For each category, search for recent grants
    for (const [category, categoryUsers] of categoryGroups) {
      const categoryCode = FOCUS_TO_CATEGORY[category] ?? "";

      const result = await searchGrants({
        keyword: categoryCode ? "" : category,
        rows: 5,
        fundingCategories: categoryCode,
        eligibilities: NONPROFIT_ELIGIBILITY,
      });

      if (result.opportunities.length === 0) continue;

      // Build email-friendly grant data
      const grantEmails: GrantEmailData[] = result.opportunities.map((opp) => {
        const floor = 0;
        const ceiling = 0;
        let funding = "Contact agency";
        if (floor && ceiling) {
          funding = `${formatDollars(floor)} - ${formatDollars(ceiling)}`;
        }

        return {
          title: opp.title,
          agency: opp.agency,
          deadline: opp.closeDate || "Open",
          fundingRange: funding,
          url: `https://www.grants.gov/search-results-detail/${opp.id}`,
        };
      });

      // Step 4: Send email to each user in this category
      for (const user of categoryUsers) {
        // Skip if already notified today
        if (user.last_notified_at) {
          const lastNotified = new Date(user.last_notified_at);
          const now = new Date();
          const hoursSince =
            (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);
          if (hoursSince < 23) continue; // Don't send more than once per day
        }

        const sent = await sendGrantAlert(
          user.email,
          user.name,
          category,
          grantEmails
        );

        if (sent) {
          // Update last_notified_at
          await supabase
            .from("organizations")
            .update({ last_notified_at: new Date().toISOString() })
            .eq("id", user.id);

          totalSent++;
        }
      }
    }

    return Response.json({
      message: `Grant alerts sent`,
      sent: totalSent,
      totalUsers: users.length,
    });
  } catch (err) {
    console.error("Cron job failed:", err);
    return Response.json({ error: "Cron job failed" }, { status: 500 });
  }
}
