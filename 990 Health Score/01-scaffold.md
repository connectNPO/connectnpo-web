# Agent 01 — Scaffold

## Your job
Initialize the entire Next.js project. Create every file and folder.
Do NOT implement logic yet — stubs and placeholder content only.

## Commands to run
```bash
npx create-next-app@latest . --ts --tailwind --app --no-src-dir --import-alias "@/*"
npm install resend @react-pdf/renderer
npm install -D @types/node
```

## Create these files with stubs

**app/layout.tsx** — Import Inter from Google Fonts, wrap children, add footer.

**app/page.tsx** — Return `<main>Landing page coming soon</main>`

**app/quiz/page.tsx** — Return `<main>Quiz coming soon</main>`

**app/results/gate/page.tsx** — Return `<main>Gate coming soon</main>`

**app/results/page.tsx** — Return `<main>Results coming soon</main>`

**app/api/send-report/route.ts** — Return `NextResponse.json({ success: true })`

**lib/scoring.ts** — Export empty `calculateScore()` that returns null.

**lib/email-template.tsx** — Export empty `EmailTemplate` component.

**components/ScoreCircle.tsx** — Export empty component.

**components/MetricCard.tsx** — Export empty component.

**components/QuizForm.tsx** — Export empty component.

**components/ReportPDF.tsx** — Export empty component.

**.env.example**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@givingarc.com
NEXT_PUBLIC_BASE_URL=https://990score.givingarc.com
```

## Done when
`npm run dev` starts without errors at localhost:3000.
Every route returns its stub page with no TypeScript errors.
