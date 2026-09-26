<div align="center">

# 🤖 AI Resume Builder

### Score your resume against any job → rewrite it with AI that never invents facts → export ATS-readable PDF & Word

[![Live Demo](https://img.shields.io/badge/▲_Live_Demo-Open_App-6366f1?style=for-the-badge&logoColor=white)](https://resume-constructor-gev44.vercel.app)
&nbsp;
[![Free ATS Checker](https://img.shields.io/badge/Try-Free_ATS_Checker-06b6d4?style=for-the-badge)](https://resume-constructor-gev44.vercel.app/ats-checker)
&nbsp;
[![CI](https://img.shields.io/github/actions/workflow/status/GEV44/resume-constructor/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/GEV44/resume-constructor/actions/workflows/ci.yml)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)

**🌐 [resume-constructor-gev44.vercel.app](https://resume-constructor-gev44.vercel.app)**

</div>

---

<p align="center">
  <img src="docs/screenshots/landing.png" alt="Landing page" width="100%" />
</p>

## ✨ Overview

**AI Resume Builder** is a full-stack web app that helps job seekers measure and improve their resumes objectively. Upload a PDF or DOCX and the app parses it into structured data, then scores it against one of **36 job roles**, and optionally a specific job posting, with a **deterministic engine**: the same input always gives the same score. AI rewrites make bullets sharper and add keywords **without inventing facts**. Where a number would help, the AI leaves an `[X]` placeholder for you to fill in. Export an **ATS-readable PDF or Word file**, or choose one of 10 designed templates.

## 🎯 Features

| | Feature | Description |
|:---:|---|---|
| 📄 | **Resume Parsing** | AI extracts contact details, experience, skills, projects and education. DOCX text is extracted on the server; file signatures are checked. |
| 📊 | **Deterministic Scoring** | One transparent engine shared by the browser and the server. Weights differ by role category. Skill aliases (JS, k8s, Postgres…) are recognised. |
| 🎯 | **Job-Description Match** | Paste a job posting to see which hard-skill keywords you cover and which you're missing. The match counts for 30% of the score. |
| 🤖 | **Honest AI Optimization** | Rewrites are merged back into your original facts by position, so employers, titles, dates and degrees can't change. A new skill is kept only if your resume already shows evidence of it. |
| ✍️ | **In-app Editor** | Fill in `[X]` placeholders and tweak bullets while the ATS score updates live. |
| 🧾 | **ATS-Readable Exports** | Real-text PDF, Word (.docx) and plain text, plus 10 designed PDF templates for printing and email. |
| 📈 | **Progress Tracking** | Score-trend chart, full analysis history, and a before/after comparison re-scored by the same engine. |
| 🔒 | **Privacy & Security** | Row-level security, per-user hourly AI limits, security headers, one-click data export and account deletion. |

## 📸 Screenshots

| Dashboard: score trend and next step | Analysis: AI findings and job match |
|:---:|:---:|
| <img src="docs/screenshots/dashboard.png" alt="Dashboard" /> | <img src="docs/screenshots/analysis.png" alt="Analysis result" /> |
| **Optimization: tracked changes and honest suggestions** | **Export: ATS-readable PDF, Word and text** |
| <img src="docs/screenshots/optimization-changes.png" alt="Optimization changes" /> | <img src="docs/screenshots/export.png" alt="Export options" /> |
| **Live template preview** | **Free ATS checker (no signup, runs in the browser)** |
| <img src="docs/screenshots/preview.png" alt="Template preview" /> | <img src="docs/screenshots/ats-checker.png" alt="ATS checker" /> |

## 🏗️ Architecture

```mermaid
flowchart LR
  subgraph Browser["Browser · React + Vite"]
    UI[Pages & live editor]
    ENG1[(Scoring engine)]
    EXP[PDF · DOCX · TXT export]
  end
  subgraph Supabase
    AUTH[Auth]
    ST[(Private storage)]
    DB[(Postgres + RLS)]
    subgraph Edge["Edge Functions · Deno"]
      FN[parse · score · optimize · delete]
      ENG2[(Scoring engine)]
    end
  end
  AI[[LLM · OpenAI-compatible]]

  UI --> ENG1
  UI --> EXP
  UI -->|sign in| AUTH
  UI -->|upload| ST
  UI -->|RLS-scoped queries| DB
  UI -->|invoke| FN
  FN --> ENG2
  FN -->|parse · review · rewrite| AI
  FN --> DB
  FN --> ST
```

The **same `scoring.ts` module** runs in the browser (live editor, free checker) and in the edge functions (stored scores), so the score a user sees is always the one that gets saved.

### How the score works

| Component | What it measures |
|---|---|
| **Skills** | Required skills found (100%) plus preferred skills (up to +50%), with aliases and multi-word matching |
| **Experience** | Years against the role's minimum, plus role keywords in context |
| **Projects** | Share of projects using role-relevant technology, with outcomes stated |
| **Education** | Degree level plus a bonus for a relevant field (whole-word matching) |
| **Impact** | Quantified achievements: how many there are and what share of bullets have one |
| **Job match** *(optional)* | Coverage of hard-skill keywords extracted from the pasted job description (30% of the total) |

Component weights depend on the role category. Tech roles, for example, weight projects at 20%, while Business, Finance and HR roles weight them at 5%.

### Why the AI can't make things up

1. The model only returns rewritten **bullets and a summary, keyed by position**. The server merges them onto the original parse, so employers, titles, dates and degrees are never taken from the model.
2. A skill the model adds is kept **only if the resume already shows evidence of it**. Anything else becomes an "add only if true" suggestion.
3. Numbers not in the source become **`[X]` placeholders**. The editor tracks them and warns before export.
4. Before and after scores are both **recomputed by the deterministic engine**, never estimated by the model.

## 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite (route-level code splitting) · Tailwind CSS · shadcn/ui · Framer Motion · Recharts |
| **Backend** | Supabase: Auth, Postgres with RLS, Storage, Edge Functions (Deno) |
| **AI** | Any OpenAI-compatible endpoint. Default: Google Gemini Flash via the Lovable AI Gateway |
| **Exports** | jsPDF (text PDF) · docx (Word) · html2canvas (designed templates) |
| **Quality** | Vitest (unit) · Playwright (E2E on desktop and mobile) · ESLint · `deno check` · GitHub Actions CI · Dependabot |
| **Hosting** | Vercel |

## 🚀 Getting Started

**Prerequisites:** Node.js 20+, a Supabase project and, to deploy functions, the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env      # add your Supabase URL and publishable key
npm run dev               # http://localhost:5173
```

### Backend (Supabase)

```bash
supabase link --project-ref <your-project-ref>
supabase db push                                   # apply migrations
supabase secrets set AI_API_KEY=... ALLOWED_ORIGINS=https://your-domain.com
supabase functions deploy parse-resume score-resume optimize-resume delete-account
```

In **Auth → URL Configuration**, add `https://your-domain.com/reset-password` as a redirect URL so password-reset emails work.

### Quality checks

```bash
npm run ci                # lint + typecheck + unit tests + production build
npm run test:e2e          # Playwright: public pages + signed-in flows against a mocked backend
npm run check:functions   # type-check edge functions (requires Deno)
```

CI runs all three on every push and pull request. The end-to-end suite also downloads the ATS PDF and checks that it contains real text.

## 📁 Project Structure

```
src/
├── pages/            Landing · AtsChecker · Dashboard · UploadResume · AnalysisResult · Optimizations · Profile · auth pages
├── components/       Seo · DashboardLayout · ProtectedRoute · ErrorBoundary · ui/ (shadcn)
├── contexts/         AuthContext (Supabase session)
├── integrations/     Supabase client & generated types
└── lib/
    ├── resume-pdf.ts     10 designed templates + image-PDF export
    ├── resume-export.ts  ATS text-PDF, DOCX and plain-text export
    ├── scoring.ts        re-exports the shared scoring engine
    ├── quick-parse.ts    offline text parser for the free checker
    └── format.ts         shared UI formatting helpers
supabase/
├── functions/
│   ├── _shared/      scoring.ts · job-roles.ts (shared with the web app) · ai.ts · http.ts
│   ├── parse-resume · score-resume · optimize-resume · delete-account
└── migrations/
e2e/                  Playwright specs + mocked Supabase backend
docs/screenshots/     README images (regenerated by the E2E suite)
```

## 🔧 Configuration

**Web app (`.env`)**

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase project URL and public (anon/publishable) key |
| `VITE_SITE_URL` | Canonical URL for SEO, the sitemap and Open Graph tags |

**Edge function secrets (`supabase secrets set`)**

| Secret | Default | Purpose |
|---|---|---|
| `AI_API_KEY` | falls back to `LOVABLE_API_KEY` | Key for the AI endpoint |
| `AI_BASE_URL` | `https://ai.gateway.lovable.dev/v1` | Any OpenAI-compatible `/chat/completions` base URL |
| `AI_MODEL` | `google/gemini-3-flash-preview` | Model id |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS allow-list |
| `PARSE_LIMIT_PER_HOUR` / `SCORE_LIMIT_PER_HOUR` / `OPTIMIZE_LIMIT_PER_HOUR` | 20 / 30 / 15 | Per-user hourly AI quotas |

## 🤝 Contributing & security

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and the [CHANGELOG](CHANGELOG.md).

## 👤 Author

**Gevorg Hovhannisyan** — Data Scientist & ML Engineer · Yerevan, Armenia

[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=flat-square&logo=github)](https://github.com/GEV44)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gevorg-hovhannisyan-arm/)

## 📄 License

Released under the [MIT License](LICENSE).
