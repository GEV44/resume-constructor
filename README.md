<div align="center">

# 🤖 AI Resume Builder

### Upload a resume → get an ATS score → optimize with AI → export a polished PDF

[![Live Demo](https://img.shields.io/badge/▲_Live_Demo-Open_App-6366f1?style=for-the-badge&logoColor=white)](https://resume-constructor-gev44.vercel.app)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

**🌐 [resume-constructor-gev44.vercel.app](https://resume-constructor-gev44.vercel.app)**

</div>

---

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

## 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite (route-level code splitting) · Tailwind CSS · shadcn/ui · Framer Motion · Recharts |
| **Backend** | Supabase: Auth, Postgres with RLS, Storage, Edge Functions (Deno) |
| **AI** | Any OpenAI-compatible endpoint. Default: Google Gemini Flash via the Lovable AI Gateway |
| **Exports** | jsPDF (text PDF) · docx (Word) · html2canvas (designed templates) |
| **Quality** | Vitest · ESLint · `deno check` · GitHub Actions CI |
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
npm run ci                # lint + typecheck + tests + production build
npm run check:functions   # type-check edge functions (requires Deno)
```

## 📁 Project Structure

```
src/
├── pages/            Landing · Dashboard · UploadResume · AnalysisResult · Optimizations · Profile · auth pages
├── components/       Seo · DashboardLayout · ProtectedRoute · ErrorBoundary · ui/ (shadcn)
├── contexts/         AuthContext (Supabase session)
├── integrations/     Supabase client & generated types
└── lib/
    ├── resume-pdf.ts     10 designed templates + image-PDF export
    ├── resume-export.ts  ATS text-PDF, DOCX and plain-text export
    ├── scoring.ts        re-exports the shared scoring engine
    └── format.ts         shared UI formatting helpers
supabase/
├── functions/
│   ├── _shared/      scoring.ts · job-roles.ts (shared with the web app) · ai.ts · http.ts
│   ├── parse-resume · score-resume · optimize-resume · delete-account
└── migrations/
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

## 👤 Author

**Gevorg Hovhannisyan** — Data Scientist & ML Engineer · Yerevan, Armenia

[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=flat-square&logo=github)](https://github.com/GEV44)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gevorg-hovhannisyan-arm/)

## 📄 License

Released under the [MIT License](LICENSE).
