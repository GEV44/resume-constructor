# 🤖 AI Resume Builder

> Multi-agent AI that scores, optimizes, and builds  
> professional resumes in seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-6366f1?style=for-the-badge)](https://resume-constructor.lovable.app)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://resume-constructor.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=for-the-badge&logo=github)](https://github.com/GEV44)

## 🌐 Live Demos
- Lovable: https://resume-constructor.lovable.app  
- Vercel:  https://resume-constructor.vercel.app

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 AI Scoring | Analyze resume against 30+ job roles |
| 🤖 Multi-Agent AI | 5 agents each handle one resume section |
| 📋 4 Templates | Executive, Tech Sidebar, Minimal, Bold Header |
| ⚡ ATS Optimizer | Real-time keyword scoring and gap analysis |
| 🎯 Job Tailoring | Paste job description, get a match score |
| 📄 PDF Export | Multi-page pixel-perfect PDF download |

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **AI**: Anthropic Claude API (claude-haiku-3-5-20251001)
- **PDF**: html2canvas + jsPDF
- **Icons**: lucide-react
- **Dev Platform**: Lovable
- **Deployment**: Vercel (free tier)

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- Free Anthropic API key → console.anthropic.com

### Setup
```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env
```

Add your key to .env:
```
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

```bash
npm run dev
# Opens at http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── templates/
│   │   ├── ExecutiveTemplate.tsx
│   │   ├── TechSidebarTemplate.tsx
│   │   ├── MinimalProTemplate.tsx
│   │   ├── BoldHeaderTemplate.tsx
│   │   └── TextOnlyTemplate.tsx
│   ├── ResumeBuilder.tsx
│   ├── ResumeScorer.tsx
│   ├── JobTailoring.tsx
│   └── LandingPage.tsx
├── lib/
│   ├── resume-pdf.ts
│   └── claude-agents.ts
└── types/
    └── resume.ts
```

## 👤 Author

**Gevorg Hovhannisyan** — Data Scientist & ML Engineer  
📍 Yerevan, Armenia  
🔗 [LinkedIn](https://linkedin.com/in/gevorg-hovhannisyan) | 
   [GitHub](https://github.com/GEV44)

## 📄 License

MIT — free to use and modify
