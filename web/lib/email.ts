import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

// Resend free plan: send from onboarding@resend.dev
// After adding a custom domain in Resend, change to your own (e.g. grants@connectnpo.com)
const FROM_EMAIL = "ConnectNPO <onboarding@resend.dev>";

export interface GrantEmailData {
  title: string;
  agency: string;
  deadline: string;
  fundingRange: string;
  url: string;
}

/**
 * Send a grant alert email to a single user
 */
export async function sendGrantAlert(
  to: string,
  recipientName: string,
  category: string,
  grants: GrantEmailData[]
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return false;
  }

  const grantRows = grants
    .map(
      (g) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;">
        <a href="${g.url}" style="color:#2D5F8A;font-weight:600;text-decoration:none;">${g.title}</a>
        <br><span style="color:#666;font-size:13px;">${g.agency}</span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;white-space:nowrap;color:#333;">${g.fundingRange}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;white-space:nowrap;color:#333;">${g.deadline}</td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f8f6;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <div style="background:#fff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden;">
      <!-- Header -->
      <div style="padding:24px;border-bottom:1px solid #e5e5e5;">
        <h1 style="margin:0;font-size:20px;color:#1a1a1a;">New Grants in ${category}</h1>
        <p style="margin:8px 0 0;color:#666;font-size:14px;">
          Hi ${recipientName}, we found ${grants.length} new grant${grants.length > 1 ? "s" : ""} matching your focus area.
        </p>
      </div>

      <!-- Grant Table -->
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:10px 16px;text-align:left;color:#666;font-weight:500;">Grant</th>
            <th style="padding:10px 16px;text-align:left;color:#666;font-weight:500;">Funding</th>
            <th style="padding:10px 16px;text-align:left;color:#666;font-weight:500;">Deadline</th>
          </tr>
        </thead>
        <tbody>
          ${grantRows}
        </tbody>
      </table>

      <!-- CTA -->
      <div style="padding:24px;text-align:center;">
        <a href="https://connectnpo-web.vercel.app/search"
           style="display:inline-block;padding:12px 32px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
          View All Grants
        </a>
      </div>
    </div>

    <!-- GivingArc Footer -->
    <div style="padding:24px;text-align:center;font-size:12px;color:#999;">
      <p style="margin:0 0 8px;">
        Need help with 990 filing or bookkeeping?
        <a href="https://givingarc.com" style="color:#2D5F8A;">GivingArc</a> can help.
      </p>
      <p style="margin:0;">
        ConnectNPO · Powered by GivingArc
      </p>
    </div>

  </div>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${grants.length} New Grant${grants.length > 1 ? "s" : ""} in ${category}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}
