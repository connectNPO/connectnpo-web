@AGENTS.md

## ConnectNPO Web App
Grant-matching tool for US nonprofits, built as GivingArc's lead magnet.

## Repo & Deploy
- GitHub: https://github.com/connectNPO/connectnpo-web
- Production: https://connectnpo-web.vercel.app
- Branch: `main` (auto-deploys to Vercel on push)

## Tech Stack
- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4
- shadcn/ui (components in `components/ui/`)
- Supabase (DB + Auth) — env vars in `.env.local`
- Vercel (hosting)

## Structure
```
web/
├── app/           ← pages & routes
├── lib/           ← shared utilities (supabase.ts)
├── components/ui/ ← shadcn/ui components
└── supabase/      ← SQL schema files
```

## Rules
- Use Server Actions ("use server") for form handling
- Read `node_modules/next/dist/docs/` before using any Next.js API (v16 has breaking changes)
- Keep it simple: no premature abstractions

## Dev Commands
```bash
npm run dev          # localhost:3000
npm run build        # production build test
npx tsc --noEmit     # type check
npx shadcn@latest add [name]  # add shadcn component
```

## Routes
- `/` — Landing page with CTA
- `/onboarding` — NPO registration form → Supabase insert
- `/onboarding/thank-you` — Submission confirmation

## Supabase
- Table: organizations (id, created_at, name, email, mission, focus_area, annual_budget, state)
- RLS: anon insert allowed, no public read
- Schema: `supabase/schema.sql`
