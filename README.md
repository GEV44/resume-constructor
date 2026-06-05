# AI Resume Builder

> Upload a resume, get a deterministic ATS score for 36 job roles, let AI sharpen the wording, and export a polished PDF in any of 10 professional templates.

[![Live Demo](https://img.shields.io/badge/Live_Demo-resume--constructor--gev44.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://resume-constructor-gev44.vercel.app)
[![GitHub](https://img.shields.io/badge/Source-GEV44-181717?style=for-the-badge&logo=github)](https://github.com/GEV44/resume-constructor)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

**Live site → https://resume-constructor-gev44.vercel.app**

---

## Overview

AI Resume Builder is a full-stack web application that helps job seekers measure and improve their resumes objectively. A user uploads a PDF or DOCX file; the app parses it into structured data, scores it against a chosen job role using a **deterministic** scoring engine (same input always yields the same score — no randomness), and offers AI-generated optimizations that improve wording and keyword coverage **without inventing experience**. The result can be exported as a print-ready PDF in ten distinct templates.

## Features

| Feature | Description |
|---|---|
| Resume parsing | Upload PDF/DOCX — AI extracts contact details, experience, skills, and education into structured data |
| Deterministic ATS scoring | Transparent, repeatable score across **36 job roles** in Tech, Business, Finance, HR, and Design |
| AI optimization | Improves phrasing, impact metrics, and ATS keywords — never fabricates roles or dates |
| 10 PDF templates | ATS Plain, Executive, Modern, Minimal, Creative, Tech, Elegant, Bold, Editorial, Compact |
| Progress tracking | Compare scores over time and review every individual change the AI suggested |
| PDF export | Pixel-accurate, multi-page PDF download for any template |
| Auth & privacy | Supabase authentication with row-level security — each user only sees their own data |

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase (Auth, Postgres, Edge Functions) |
| AI | Google Gemini Flash via the Lovable AI Gateway |
| PDF engine | html2canvas + jsPDF (10 HTML templates rendered in `resume-pdf.ts`) |
| Hosting | Vercel |

## Run Locally

**Prerequisites:** Node.js 18+ and a Supabase project for auth and storage.

```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env      # then fill in your Supabase values
npm run dev               # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── pages/            Landing, Login, Signup, Dashboard, UploadResume,
│                     AnalysisResult, Analyses, Optimizations, Profile, AdminDashboard
├── components/       Seo, DashboardLayout, ProtectedRoute, ui/ (shadcn components)
├── contexts/         AuthContext (Supabase session)
├── integrations/     Supabase client and generated types
└── lib/
    ├── resume-pdf.ts 10 PDF templates + export logic
    ├── job-roles.ts  36 role definitions and scoring weights
    ├── scoring.ts    deterministic ATS scoring engine
    └── site.ts       canonical site URL (VITE_SITE_URL)
supabase/
└── functions/        parse-resume, score-resume, optimize-resume (edge functions)
scripts/
└── generate-seo.mjs  generates sitemap.xml + robots.txt at build time
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SITE_URL` | Canonical URL used for SEO, sitemap, and Open Graph tags |
| `VITE_API_URL` | Optional API base URL override |

Supabase keys are configured in `src/integrations/supabase`.

## Author

**Gevorg Hovhannisyan** — Data Scientist & ML Engineer, Yerevan, Armenia
[GitHub @GEV44](https://github.com/GEV44) · [LinkedIn](https://linkedin.com/in/gevorg-hovhannisyan)

## License

Released under the [MIT License](LICENSE).
