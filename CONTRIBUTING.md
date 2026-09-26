# Contributing

Thanks for your interest! Issues and pull requests are welcome.

## Setup

```bash
npm install
cp .env.example .env   # add Supabase URL + publishable key
npm run dev            # http://localhost:5173
```

## Before opening a pull request

```bash
npm run ci                # lint + typecheck + unit tests + production build
npm run test:e2e          # Playwright (builds and serves the app itself)
npm run check:functions   # Deno type-check of supabase/functions (needs Deno)
```

## Conventions

- **Scoring logic lives in one place**: `supabase/functions/_shared/scoring.ts` is imported by both the web app
  (via the `@shared` alias) and the edge functions. Keep it free of browser- or Deno-specific APIs and add a test in
  `src/test/scoring.test.ts` for every behaviour change — scores must stay deterministic.
- **The AI must never invent facts.** Prompt or merge changes in `optimize-resume` must keep employers, titles,
  dates, degrees and metrics intact; unknown numbers are `[X]` placeholders.
- TypeScript everywhere, no `any` outside generated code; match the surrounding style.
- UI changes: include before/after screenshots. `SCREENSHOTS=1 npx playwright test --project=desktop`
  regenerates the images in `docs/screenshots/`.
- Database changes go in a new file under `supabase/migrations/`, and code must keep working until it is applied.
