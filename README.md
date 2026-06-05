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

**AI Resume Builder** is a full-stack web app that helps job seekers measure and improve their resumes objectively. Upload a PDF or DOCX, and the app parses it into structured data, scores it against a chosen job role with a **deterministic engine** (same input → same score, no randomness), and offers AI optimizations that improve wording and keyword coverage **without inventing experience**. Export the result as a print-ready PDF in ten distinct templates.

## 🎯 Features

| | Feature | Description |
|:---:|---|---|
| 📄 | **Resume Parsing** | AI extracts contact details, experience, skills, and education from PDF/DOCX |
| 📊 | **Deterministic Scoring** | Transparent, repeatable score across **36 job roles** |
| 🤖 | **AI Optimization** | Sharper phrasing and ATS keywords — never fabricates roles or dates |
| 🎨 | **10 PDF Templates** | ATS Plain, Executive, Modern, Minimal, Creative, Tech, Elegant, Bold, Editorial, Compact |
| 📈 | **Progress Tracking** | Compare scores over time and review every AI suggestion |
| 🔒 | **Auth & Privacy** | Supabase auth + row-level security — each user sees only their own data |

## 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion |
| **Backend** | Supabase — Auth, Postgres, Edge Functions |
| **AI** | Google Gemini Flash via the Lovable AI Gateway |
| **PDF Engine** | html2canvas + jsPDF (10 HTML templates in `resume-pdf.ts`) |
| **Hosting** | Vercel |

## 🚀 Getting Started

**Prerequisites:** Node.js 18+ and a Supabase project.

```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env      # add your Supabase values
npm run dev               # http://localhost:5173
```

Production build:

```bash
npm run build && npm run preview
```

## 📁 Project Structure

```
src/
├── pages/            Landing · Dashboard · UploadResume · AnalysisResult · Optimizations · Profile
├── components/       Seo · DashboardLayout · ProtectedRoute · ui/ (shadcn)
├── contexts/         AuthContext (Supabase session)
├── integrations/     Supabase client & generated types
└── lib/
    ├── resume-pdf.ts 10 PDF templates + export logic
    ├── job-roles.ts  36 role definitions & scoring weights
    ├── scoring.ts    deterministic ATS scoring engine
    └── site.ts       canonical site URL
supabase/functions/   parse-resume · score-resume · optimize-resume
```

## 🔧 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SITE_URL` | Canonical URL for SEO, sitemap, and Open Graph tags |
| `VITE_API_URL` | Optional API base URL override |

## 👤 Author

**Gevorg Hovhannisyan** — Data Scientist & ML Engineer · Yerevan, Armenia

[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=flat-square&logo=github)](https://github.com/GEV44)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/YOUR-LINKEDIN-URL)

## 📄 License

Released under the [MIT License](LICENSE).
