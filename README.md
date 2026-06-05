# 🤖 AI Resume Builder

> Upload your resume, get an ATS score for 36 job roles, and download AI-optimized PDFs in 10 professional templates.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-resume--constructor.vercel.app-6366f1?style=for-the-badge)](https://resume-constructor.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=for-the-badge&logo=github)](https://github.com/GEV44/resume-constructor)

## 🌐 Live Site

**https://resume-constructor.vercel.app**

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 ATS Scoring | Deterministic score against **36 job roles** (Tech, Business, Finance, HR, Design) |
| 🤖 AI Optimization | Google Gemini via Lovable AI Gateway — better wording & keywords, never fake experience |
| 📋 **10 PDF Templates** | ATS Plain, Executive, Modern, Minimal, Creative, Tech, Elegant, Bold, Editorial, Compact |
| ⚡ Resume Parsing | Upload PDF/DOCX — AI extracts contact, experience, skills, education |
| 📊 Progress Tracking | Compare scores over time and review every AI change |
| 📄 PDF Export | Pixel-perfect multi-page PDF download for any template |
| 🔒 Private & Secure | Supabase auth, row-level security, your data stays yours |

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini Flash via Lovable AI Gateway
- **PDF**: html2canvas + jsPDF (10 built-in HTML templates in `resume-pdf.ts`)
- **Icons**: lucide-react
- **Deploy**: Vercel

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- Supabase project (for auth & resume storage)
- No AI API key needed locally if using Lovable-hosted Supabase functions

### Setup
```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env
```

```bash
npm run dev
# http://localhost:5173
```

### Build
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── pages/              Landing, Dashboard, UploadResume, AnalysisResult, Optimizations
├── components/         UI (shadcn), Seo, DashboardLayout, ProtectedRoute
├── lib/
│   ├── resume-pdf.ts   10 PDF templates + export logic
│   ├── job-roles.ts    36 role definitions + scoring weights
│   └── scoring.ts      Deterministic ATS scoring engine
├── contexts/           AuthContext
└── integrations/       Supabase client & types
supabase/
└── functions/          parse-resume, score-resume, optimize-resume
public/                 sitemap.xml, robots.txt (SEO)
```

## 🌍 Custom Domain & Google SEO

Yes — you can use **your own domain** instead of `lovable.app` or `vercel.app`:

1. Buy a domain (e.g. `resume-constructor.com` or `gevorg.dev`)
2. In [Vercel Dashboard](https://vercel.com) → your project → **Settings → Domains** → add domain
3. Set DNS records as Vercel instructs (usually a CNAME)
4. Set in `.env`: `VITE_SITE_URL=https://yourdomain.com`
5. Redeploy: `vercel --prod`

SEO files (`sitemap.xml`, `robots.txt`, canonical URLs) use `VITE_SITE_URL`. After adding a custom domain, update `.env` and redeploy so Google indexes **your** site when people search "resume constructor".

Google Search Console: verify at [search.google.com/search-console](https://search.google.com/search-console) and submit your sitemap (`/sitemap.xml`).

## 👤 Author

**[@GEV44](https://github.com/GEV44)** — Gevorg Hovhannisyan  
Data Scientist & ML Engineer · Yerevan, Armenia  
🔗 [LinkedIn](https://linkedin.com/in/gevorg-hovhannisyan)

## 📄 License

MIT — see [LICENSE](LICENSE)
