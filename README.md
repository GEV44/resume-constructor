# 🤖 AI Resume Builder

> Multi-agent AI that scores, optimizes, and builds  
> professional resumes in seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-6366f1?style=for-the-badge)](https://resume-constructor.lovable.app)
[![GitHub](https://img.shields.io/badge/GitHub-GEV44-181717?style=for-the-badge&logo=github)](https://github.com/GEV44/resume-constructor)

## 🌐 Live Demo
- https://resume-constructor.lovable.app

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
- **AI**: Google Gemini Flash via Lovable AI Gateway
- **PDF**: html2canvas + jsPDF
- **Icons**: lucide-react

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- No API key needed — uses Lovable AI Gateway

### Setup
```bash
git clone https://github.com/GEV44/resume-constructor.git
cd resume-constructor
npm install
cp .env.example .env
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

**[@GEV44](https://github.com/GEV44)** — Gevorg Hovhannisyan  
Data Scientist & ML Engineer · Yerevan, Armenia  
🔗 [LinkedIn](https://linkedin.com/in/gevorg-hovhannisyan)

## 📄 License

MIT — free to use and modify
