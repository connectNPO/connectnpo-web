# 990 Health Score

## What this is
A free web tool for GivingArc (givingarc.com).
Nonprofits enter 7 numbers from their filed Form 990 → receive a 0–100 score,
letter grade (A–F), and a personalized report emailed to them.
Primary goal: capture email leads for GivingArc's bookkeeping service.

## Tech stack
- Next.js 14 (App Router)
- Tailwind CSS
- Resend (email)
- @react-pdf/renderer (PDF download)
- Vercel (deploy)

## Brand
- Primary color: #1D9E75 (GivingArc teal)
- Font: Inter (Google Fonts)
- Logo: text "GivingArc" — or /public/logo.svg if it exists
- Footer: "© 2026 GivingArc. All rights reserved. | givingarc.com"
- Light mode only

## App pages
| Route | Purpose |
|-------|---------|
| / | Landing — hero + CTA |
| /quiz | Input form — 7 Form 990 fields |
| /results/gate | Email capture (blurred score preview) |
| /results | Full score report + PDF download |

## Data flow (stateless — no database)
Form inputs → base64 JSON → URL query param `?d=` → decoded on /results
This keeps the results page shareable from email links.

## File structure
```
app/
  page.tsx
  quiz/page.tsx
  results/gate/page.tsx
  results/page.tsx
  api/send-report/route.ts
lib/
  scoring.ts
  email-template.tsx
components/
  ScoreCircle.tsx
  MetricCard.tsx
  QuizForm.tsx
  ReportPDF.tsx
```

## Environment variables (.env.local)
```
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@givingarc.com
NEXT_PUBLIC_BASE_URL=https://990score.givingarc.com
```

## Key URLs
- Schedule call CTA: https://givingarc.com/schedule-a-call/
- Main site: https://givingarc.com
