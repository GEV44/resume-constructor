# Changelog

## 2.0.0 — 2026-09-26

### Added
- Free, sign-up-free **ATS checker** (`/ats-checker`) that runs entirely in the browser.
- **Job-description matching**: deterministic keyword extraction and coverage, weighted at 30% of the score.
- **ATS-readable exports**: real-text PDF, Word (.docx) and plain text, alongside 10 designed templates.
- In-app **editor** for optimized resumes with live re-scoring and `[X]` placeholder tracking.
- Password reset, JSON data export and account deletion.
- Score-trend chart and a next-step card on the dashboard.
- GenAI / LLM Engineer role (36 roles in total).
- Playwright end-to-end tests (public and signed-in flows) and GitHub Actions CI.

### Changed
- One scoring engine shared by the web app and edge functions, with per-category weights and skill aliases.
- AI optimization is merged onto the original facts by position; unevidenced skills become suggestions and missing
  numbers become placeholders. Before/after scores are recomputed by the same engine.
- Edge functions load data from the database, persist AI findings, extract DOCX text server-side, check file
  signatures and enforce per-user hourly limits. The AI provider is configurable.
- Route-level code splitting: main bundle 1.38 MB → ~196 KB.

### Fixed
- Optimized resumes showing old and new bullets together.
- Education relevance matching substrings ("cs" in "physics").
- Admin totals counting only the first page of rows; profile name not loading; oversized section headings.

## 1.0.0

Initial release: upload, AI parsing, role scoring, AI optimization and 10 PDF templates.
