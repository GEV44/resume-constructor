import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, BarChart3, Sparkles, Target, TrendingUp, Shield,
  ArrowRight, Github, PenLine, LayoutTemplate, ChevronRight,
  Briefcase, GraduationCap, Star, User,
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
        <section className="relative overflow-hidden min-h-screen flex items-center px-4 pt-20">
          {/* Ambient orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[160px]" />
            <div className="absolute bottom-0 right-0 w-[560px] h-[560px] rounded-full bg-accent/20 blur-[160px]" />
          </div>

          <div className="container mx-auto grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-8 items-center py-16">

            {/* LEFT — copy */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-6 font-mono uppercase tracking-wider self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                AI-Powered Resume Intelligence
              </div>

              {/* Headline */}
              <h1 className="font-heading font-black tracking-tight leading-[0.95] text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] mb-3">
                Build Resumes<br />That{" "}
                <span className="gradient-text">Get Noticed</span>
              </h1>

              {/* Decorative gradient line — like the og-image */}
              <div className="h-[3px] w-28 rounded-full bg-gradient-to-r from-primary via-accent to-cyan-400 mb-5" />

              <p className="text-base md:text-lg text-muted-foreground max-w-[440px] mb-8 leading-relaxed">
                Score against{" "}
                <span className="text-foreground font-semibold">36 roles</span>, optimize
                with AI, and export in{" "}
                <span className="text-foreground font-semibold">10 polished templates</span>.
              </p>

              {/* Pills */}
              <div className="flex flex-wrap gap-3 mb-9">
                {pills.map((p) => (
                  <div
                    key={p.label}
                    className="glass rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-2.5"
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <p.icon className="w-3.5 h-3.5 text-white" />
                    </span>
                    <span className="text-xs font-medium">{p.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-3 rounded-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-sm uppercase tracking-wider shadow-xl shadow-primary/35 hover:shadow-primary/55 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Your Resume
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://github.com/GEV44/resume-constructor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 border border-glass-border text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-all duration-300"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>

              {/* Trust line */}
              <p className="mt-6 text-xs text-muted-foreground font-mono">
                Free · No credit card · Open source
              </p>
            </motion.div>

            {/* RIGHT — clean coded 3D resume card */}
            <motion.div
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.18, ease: "easeOut" }}
              className="relative hidden lg:flex items-center justify-center"
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 via-accent/20 to-cyan-400/10 blur-[120px] scale-110 pointer-events-none" />

              {/* Floating wrapper */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-[440px]"
              >
                {/* Back stacked card for depth */}
                <div className="absolute top-7 left-7 right-0 bottom-0 rounded-[1.75rem] bg-gradient-to-br from-primary/15 to-accent/10 border border-white/5" />

                {/* Front card */}
                <div className="relative rounded-[1.75rem] bg-gradient-to-br from-[#1a2342]/90 to-[#0f1730]/90 backdrop-blur-xl border border-white/12 shadow-2xl shadow-primary/30 p-8">
                  {/* Sparkle corner badge */}
                  <div className="absolute -top-5 -right-5 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center shadow-xl shadow-cyan-400/40 ring-4 ring-[#0f1730]">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>

                  {/* Header: avatar + name lines */}
                  <div className="flex items-center gap-4 mb-7 pb-6 border-b border-white/10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/40">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3 w-36 rounded-full bg-gradient-to-r from-white/70 to-white/25" />
                      <div className="h-2.5 w-24 rounded-full bg-white/15" />
                    </div>
                  </div>

                  {/* Sections */}
                  {[
                    { icon: Briefcase, label: "EXPERIENCE" },
                    { icon: GraduationCap, label: "EDUCATION" },
                    { icon: Star, label: "SKILLS" },
                  ].map((s) => (
                    <div key={s.label} className="mb-6 last:mb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center shrink-0">
                          <s.icon className="w-4 h-4 text-cyan-300" />
                        </div>
                        <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-white/70">
                          {s.label}
                        </span>
                      </div>
                      {s.label === "SKILLS" ? (
                        <div className="flex flex-wrap gap-2 pl-12">
                          {[56, 72, 48, 64].map((w, i) => (
                            <div
                              key={i}
                              className="h-2.5 rounded-full bg-gradient-to-r from-primary/70 to-cyan-400/70"
                              style={{ width: `${w}px` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="pl-12 space-y-2">
                          <div className="h-2 w-full rounded-full bg-white/12" />
                          <div className="h-2 w-4/5 rounded-full bg-white/8" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Floating ATS score chip */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -bottom-6 -left-8 z-20 rounded-2xl bg-gradient-to-br from-[#1a2342] to-[#0f1730] border border-white/15 px-4 py-3.5 shadow-2xl shadow-cyan-400/20 flex items-center gap-3"
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="16" fill="none"
                        stroke="url(#scoreGrad)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray="100.5" strokeDashoffset="8"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#7c5cff" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-heading font-black text-sm text-white">
                      92
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm leading-tight text-white">ATS Score</p>
                    <p className="text-[11px] text-cyan-300 font-mono flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" /> Excellent match
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        <section className="px-4 pb-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border border-white/8"
            >
              {stats.map((s) => (
                <div key={s.label}>
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
              viewport={{ once: true }}
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
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
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
              viewport={{ once: true }}
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
