const CATEGORY_META = {
  record_keeping:       { label: 'Record Keeping' },
  financial_separation: { label: 'Financial Separation' },
  board_governance:     { label: 'Board Governance' },
  program_tracking:     { label: 'Program Tracking' },
  compliance:           { label: 'Compliance & Reporting' }
};

const TIPS = {
  record_keeping:       'Use cloud-based accounting software (QuickBooks, Wave) and store all receipts digitally in dated folders.',
  financial_separation: 'Open a dedicated nonprofit bank account and keep all org expenses off personal cards - this is the #1 IRS red flag.',
  board_governance:     'Maintain a shared folder with board minutes, conflict-of-interest policy, and term documentation. Review quarterly.',
  program_tracking:     'Tag every expense with a program code so you can cleanly report program vs admin costs on Schedule O.',
  compliance:           'Check your 990 filing status at IRS.gov/TEOS and set annual calendar reminders 60 days before your deadline.'
};

const GRADE_CONFIG = {
  Green:  { color: '#10b981', label: '990 Ready',               headline: "You're in great shape.",       summary: "Your nonprofit shows strong 990 filing readiness across all key areas. Keep up the excellent practices - and stay alert for changes that could affect your compliance." },
  Yellow: { color: '#f59e0b', label: 'Needs Attention',         headline: "You're close, but there are gaps.", summary: "Your nonprofit has some important pieces in place but also notable gaps that could cause issues at 990 filing time. Address the weak areas below before your next filing deadline." },
  Red:    { color: '#ef4444', label: 'At Risk - Get Help',      headline: "This deserves urgent attention.",    summary: "Your current systems may put your nonprofit at risk during 990 filing or in the event of an IRS inquiry. The good news: all of these areas can be fixed with the right support." }
};

export function generateEmailHtml({ contactName, orgName, score, grade, weakCategories, consultationUrl }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG.Yellow;

  const weakList = (weakCategories || []).slice(0, 3).map(key => `
    <tr>
      <td style="padding:16px; background:#f8fafc; border-radius:8px; border-left:4px solid ${cfg.color};">
        <div style="font-weight:600; color:#0a2540; margin-bottom:6px; font-size:15px;">
          ${CATEGORY_META[key]?.label || key}
        </div>
        <div style="color:#475569; font-size:14px; line-height:1.5;">
          ${TIPS[key] || ''}
        </div>
      </td>
    </tr>
    <tr><td style="height:12px;"></td></tr>
  `).join('');

  const weakSection = weakCategories && weakCategories.length > 0
    ? `
      <h3 style="color:#0a2540; font-size:18px; margin:32px 0 16px;">
        Your weak areas - and how to fix them
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${weakList}
      </table>
    `
    : `
      <div style="background:#ecfdf5; border-radius:8px; padding:16px; margin:24px 0; color:#065f46; font-size:14px;">
        <strong>No weak areas detected.</strong> Every category scored above 50% - well done.
      </div>
    `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Your 990 Readiness Report</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden;">

          <tr>
            <td style="background:#0a2540; padding:32px 32px 24px; text-align:center;">
              <div style="color:#94a3b8; font-size:12px; letter-spacing:1px; margin-bottom:4px;">GIVINGARC</div>
              <div style="color:#fff; font-size:24px; font-weight:700;">990 Readiness Report</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="font-size:16px; margin:0 0 8px; color:#475569;">Hi ${contactName},</p>
              <p style="font-size:16px; margin:0 0 24px; color:#475569; line-height:1.6;">
                Here's your 990 Readiness Report for <strong style="color:#0a2540;">${orgName}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="padding:32px 24px; background:#f8fafc; border-radius:12px;">
                    <div style="color:#64748b; font-size:13px; margin-bottom:8px;">YOUR SCORE</div>
                    <div style="font-size:56px; font-weight:800; color:#0a2540; line-height:1;">
                      ${score}<span style="color:#94a3b8; font-size:24px;">/36</span>
                    </div>
                    <div style="display:inline-block; margin-top:16px; padding:8px 20px; background:${cfg.color}; color:#fff; border-radius:999px; font-weight:600; font-size:14px;">
                      ${cfg.label}
                    </div>
                  </td>
                </tr>
              </table>

              <h3 style="color:#0a2540; font-size:18px; margin:24px 0 8px;">
                ${cfg.headline}
              </h3>
              <p style="color:#475569; font-size:15px; line-height:1.6; margin:0 0 16px;">
                ${cfg.summary}
              </p>

              ${weakSection}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 16px;">
                <tr>
                  <td align="center" style="background:#0a2540; border-radius:12px; padding:28px 24px;">
                    <div style="color:#fff; font-size:18px; font-weight:700; margin-bottom:8px;">
                      Want a personalized action plan?
                    </div>
                    <div style="color:#cbd5e1; font-size:14px; margin-bottom:20px; line-height:1.5;">
                      Book a free 30-minute consultation with GivingArc.<br>
                      We'll review your gaps and give you next steps - no obligation.
                    </div>
                    <a href="${consultationUrl}"
                       style="display:inline-block; background:#10b981; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
                      Book Free Consultation →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#64748b; font-size:13px; line-height:1.6; margin:32px 0 0; text-align:center;">
                Questions? Just reply to this email - we read every response.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc; padding:24px 32px; text-align:center; color:#94a3b8; font-size:12px; line-height:1.5;">
              <strong style="color:#475569;">GivingArc</strong> - Bookkeeping &amp; 990 services for small nonprofits.<br>
              You received this because you completed our 990 Readiness Quiz.<br>
              &copy; 2026 GivingArc. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
