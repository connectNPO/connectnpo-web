# Agent 04 — Email & API

## Your job
Implement the email pipeline end-to-end.

---

## 1. app/api/send-report/route.ts

POST handler. Expected request body:
```ts
{
  email: string
  firstName?: string
  orgName?: string
  encodedData: string   // the base64 ?d= param
  optIn: boolean
}
```

Steps:
1. Validate email is present
2. Decode `encodedData` → call `calculateScore()` from lib/scoring.ts
3. Send email via Resend SDK using `EmailTemplate`
4. Return `{ success: true }` or `{ success: false, error: string }`

Resend setup:
```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({
  from: process.env.FROM_EMAIL!,
  to: email,
  subject: `Your 990 Health Score — ${orgName || 'Your Nonprofit'}`,
  react: EmailTemplate({ firstName, orgName, scoreResult, encodedData }),
})
```

---

## 2. lib/email-template.tsx

A React Email component. Show:
- GivingArc header (teal bar, "GivingArc" text)
- "Hi {firstName || 'there'},"
- Large score number + grade in a colored box
- "Your top areas to improve:" — list the 2 lowest-scoring metrics with their recommendations
- CTA button: "View Full Report" → `${NEXT_PUBLIC_BASE_URL}/results?d=${encodedData}`
- Footer: givingarc.com | Unsubscribe

Keep styles inline (React Email requirement — no Tailwind).
Use `#1D9E75` for teal elements.

---

## Done when
Submitting the gate form sends a real email that arrives in inbox.
Email contains correct score and links back to results page.
