import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, BarChart3, Sparkles, Target, TrendingUp, Shield,
  ArrowRight, Github, PenLine, LayoutTemplate, ChevronRight,
  Upload, Wand2, Download,
} from "lucide-react";
import Seo from "@/components/Seo";
import { SITE_URL } from "@/lib/site";

const features = [
  { icon: FileText,   title: "Smart Parsing",          desc: "AI extracts and structures your PDF or DOCX instantly." },
  { icon: BarChart3,  title: "Deterministic Scoring",   desc: "Same resume, same role, same score — every time." },
  { icon: Sparkles,   title: "AI Optimization",         desc: "Sharper wording and ATS keywords, never fabricated." },
  { icon: Target,     title: "36 Job Roles",            desc: "Tailored for Tech, Business, Finance, HR, and Design." },
  { icon: TrendingUp, title: "Progress Tracking",       desc: "Compare scores over time and review every AI suggestion." },
  { icon: Shield,     title: "Private & Secure",        desc: "Row-level security — your data stays yours, always." },
];

const stats = [
  { value: "36",   label: "Job Roles" },
  { value: "10",   label: "PDF Templates" },
  { value: "100%", label: "ATS Friendly" },
  { value: "0",    label: "Hallucinations" },
];

const pills = [
  { icon: PenLine,        label: "AI-Powered Writing" },
  { icon: LayoutTemplate, label: "ATS-Friendly Templates" },
  { icon: TrendingUp,     label: "Stand Out & Get Hired" },
];

const steps = [
  { icon: Upload,   title: "Upload",   desc: "Drop your PDF or DOCX — we parse it in seconds, structured and clean." },
  { icon: BarChart3, title: "Score",    desc: "Get a deterministic ATS score against any of 36 target roles." },
  { icon: Wand2,    title: "Optimize", desc: "AI rewrites weak bullets, adds missing keywords — no fabrication." },
  { icon: Download, title: "Export",   desc: "Download a polished PDF in your choice of 10 recruiter-ready templates." },
];

export default function Landing() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AI Resume Builder",
      alternateName: "Resume Constructor",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE_URL}/`,
      description: "Free AI resume constructor with ATS scoring for 36 job roles and 10 PDF templates.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AI Resume Builder",
      url: `${SITE_URL}/`,
      description: "AI-powered resume analysis and optimization with deterministic scoring across 36 job roles.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Resume Constructor — AI Resume Builder",
      url: `${SITE_URL}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/signup`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-animated-gradient">
      <Seo
        title="Resume Constructor — AI Resume Builder | ATS Score & 10 PDF Templates"
        description="Free AI resume constructor: upload your resume, get ATS scores for 36 job roles, and download optimized PDFs in 10 professional templates."
        path="/"
        jsonLd={jsonLd}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-heading font-black text-white shadow-lg shadow-primary/40 text-sm">
              Ai
            </span>
            <span className="font-heading font-extrabold text-lg tracking-wide">
              AI RESUME BUILDER
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/GEV44/resume-constructor"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Log In
            </Link>
            <Link to="/signup" className="btn-primary !py-2 !px-5 !text-xs !rounded-full">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-[92vh] flex items-center px-4 pt-20">
          {/* Ambient orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[160px]" />
            <div className="absolute bottom-0 right-0 w-[560px] h-[560px] rounded-full bg-accent/20 blur-[160px]" />
          </div>

          <div className="container mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 xl:gap-20 items-center py-12 lg:py-20">

            {/* LEFT — copy */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col lg:pr-4"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-[11px] mb-7 font-mono uppercase tracking-[0.14em] self-start border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_hsl(var(--accent))]" />
                AI-Powered Resume Intelligence
              </div>

              {/* Headline */}
              <h1 className="font-heading font-black tracking-tight leading-[0.92] text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4.25rem] mb-4">
                Build Resumes
                <br />
                That{" "}
                <span className="gradient-text">Get Noticed</span>
              </h1>

              <div className="h-[3px] w-24 rounded-full bg-gradient-to-r from-primary via-accent to-cyan-400 mb-6 shadow-[0_0_12px_hsl(var(--accent)/0.5)]" />

              <p className="text-[15px] md:text-lg text-muted-foreground max-w-[420px] mb-9 leading-relaxed">
                Score against{" "}
                <span className="text-foreground font-semibold">36 roles</span>, optimize
                with AI, and export in{" "}
                <span className="text-foreground font-semibold">10 polished templates</span>.
              </p>

              {/* Pills */}
              <div className="flex flex-wrap gap-2.5 mb-10">
                {pills.map((p) => (
                  <div
                    key={p.label}
                    className="glass rounded-full pl-1.5 pr-3.5 py-1.5 flex items-center gap-2 border-white/8 hover:border-white/20 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
                      <p.icon className="w-3.5 h-3.5 text-white" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium">{p.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2.5 sm:gap-3 rounded-full px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-primary/40 hover:shadow-primary/60 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Your Resume
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://github.com/GEV44/resume-constructor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 sm:px-7 py-3.5 sm:py-4 border border-glass-border text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-white/5 hover:border-white/25 transition-all duration-300"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>

              <p className="mt-7 text-[11px] text-muted-foreground/80 font-mono tracking-wide">
                Free · No credit card · Open source
              </p>
            </motion.div>

            {/* RIGHT — full og-image, flat & clean (no crop, no 3D tilt) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
              className="relative flex items-center justify-center mt-8 lg:mt-0"
            >
              <div className="absolute inset-0 max-w-[600px] mx-auto rounded-3xl bg-primary/15 blur-[90px] pointer-events-none" />
              <motion.img
                src="/og-image.jpg"
                alt="AI Resume Builder preview"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-[580px] rounded-2xl border border-white/10 shadow-[0_24px_80px_-12px_rgba(99,102,241,0.45)] select-none"
                draggable={false}
              />
            </motion.div>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        <section className="px-4 pb-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              className="glass rounded-2xl px-4 sm:px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border border-white/8 divide-x-0 md:divide-x divide-white/5"
            >
              {stats.map((s) => (
                <div key={s.label} className="px-2 py-1">
                  <p className="font-heading font-black text-2xl md:text-3xl gradient-text mb-0.5">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="container mx-auto">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <h2 className="font-heading font-extrabold mb-3">
                Everything You{" "}
                <span className="gradient-text-cyan">Need</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
                Professional-grade resume analysis and optimization in one platform.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="glass-hover rounded-2xl p-7 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-accent/20 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <f.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <section className="section-padding">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              className="relative overflow-hidden rounded-3xl glass border border-white/10 p-12 md:p-16 text-center"
            >
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 left-1/3 w-96 h-96 rounded-full bg-primary/30 blur-[120px]" />
                <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-accent/25 blur-[120px]" />
              </div>
              <h2 className="font-heading font-extrabold mb-4">
                Ready to{" "}
                <span className="gradient-text">Stand Out</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm md:text-base">
                Join professionals using AI to land more interviews — no fake
                experience, just sharper presentation.
              </p>
              <Link
                to="/signup"
                className="group inline-flex items-center gap-3 rounded-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-primary/35 hover:shadow-primary/55 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4" />
                Create Your Resume — Free
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-glass-border py-10 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-heading font-bold text-base mb-0.5">AI Resume Builder</p>
            <p className="text-muted-foreground text-xs">
              © 2026 · Gevorg Hovhannisyan · Yerevan, Armenia
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/GEV44/resume-constructor"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
