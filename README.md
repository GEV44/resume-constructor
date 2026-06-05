# 🤖 AI Resume Builder

> Free AI resume constructor — ATS scores for 36 job roles, AI optimization, and 10 PDF templates.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-resume--constructor--gev44.vercel.app-6366f1?style=for-the-badge)](https://resume-constructor-gev44.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=for-the-badge&logo=github)](https://github.com/GEV44/resume-constructor)

## 🌐 Live Site

**https://resume-constructor-gev44.vercel.app**

> Run `deploy-vercel.bat` once to deploy (free Vercel). The URL contains **"resume-constructor"** — good for Google search.

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
- **Deploy**: Vercel (free)

## 🚀 Deploy (Free — One Click)

Double-click **`deploy-vercel.bat`** in the project folder, or:

```bash
npm install
npx vercel login          # sign in with GitHub (browser opens once)
npx vercel --prod --yes   # deploy to production
```

Set in Vercel Dashboard → Settings → Environment Variables:
- `VITE_SITE_URL` = `https://resume-constructor-gev44.vercel.app`

Every `git push` to `main` auto-redeploys if GitHub is connected to Vercel.

## 🚀 Run Locally

```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env
npm run dev
# http://localhost:5173
```

## 📁 Project Structure

```
src/
├── pages/              Landing, Dashboard, UploadResume, AnalysisResult, Optimizations
├── components/         UI (shadcn), Seo, DashboardLayout, ProtectedRoute
├── lib/
│   ├── resume-pdf.ts   10 PDF templates + export logic
│   ├── job-roles.ts    36 role definitions + scoring weights
│   └── site.ts         Public URL (VITE_SITE_URL)
supabase/functions/     parse-resume, score-resume, optimize-resume
scripts/generate-seo.mjs  Builds sitemap.xml + robots.txt at deploy time
```

## 🔍 Google SEO (Free)

1. Deploy with `deploy-vercel.bat`
2. [Google Search Console](https://search.google.com/search-console) → add your site → verify
3. Submit sitemap: `https://resume-constructor-gev44.vercel.app/sitemap.xml`
4. GitHub repo **About** → set Website to your live URL

Page titles and meta tags include **"Resume Constructor"** and **"AI Resume Builder"** for search visibility.

## 👤 Author

**[@GEV44](https://github.com/GEV44)** — Gevorg Hovhannisyan  
Data Scientist & ML Engineer · Yerevan, Armenia  
🔗 [LinkedIn](https://linkedin.com/in/gevorg-hovhannisyan)

## 📄 License

MIT — see [LICENSE](LICENSE)
