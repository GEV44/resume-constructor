import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, BarChart3, Sparkles, Target, TrendingUp, Shield,
  ArrowRight, Github,
  PenLine, LayoutTemplate,
} from "lucide-react";
import Seo from "@/components/Seo";
import { SITE_URL } from "@/lib/site";

const features = [
  { icon: FileText, title: "Smart Parsing", desc: "AI structures your PDF or DOCX in seconds." },
  { icon: BarChart3, title: "Deterministic Scoring", desc: "Same resume, same role, same score — every time." },
  { icon: Sparkles, title: "AI Optimization", desc: "Sharper wording and ATS keywords, never fabricated." },
  { icon: Target, title: "36 Job Roles", desc: "Tailored for Tech, Business, Finance, HR, and Design." },
  { icon: TrendingUp, title: "Track Progress", desc: "Compare scores over time and review every change." },
  { icon: Shield, title: "Private & Secure", desc: "Row-level security — your data stays yours." },
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
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-heading font-black text-white shadow-lg shadow-primary/40">
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
              className="text-muted-foreground hover:text-foreground transition-all duration-400"
            >
              <Github className="w-5 h-5" />
            </a>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-400 hidden sm:inline">
              Log In
            </Link>
            <Link to="/signup" className="btn-primary !py-2 !px-5 !text-xs !rounded-full">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 px-4">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-20 -left-20 w-[480px] h-[480px] rounded-full bg-primary/25 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-accent/25 blur-[160px]" />
        </div>

        <div className="container mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* LEFT — copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-7 font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI-Powered Resume Intelligence
            </div>

            <h1 className="font-heading font-black leading-[0.98] tracking-tight text-5xl md:text-6xl lg:text-7xl mb-4">
              Build Resumes That{" "}
              <span className="gradient-text whitespace-nowrap">Get Noticed</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
              Score against <span className="text-foreground font-medium">36 roles</span>,
              optimize with AI, and export in{" "}
              <span className="text-foreground font-medium">10 polished templates</span>.
            </p>

            {/* Feature pills — matching og-image style */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: PenLine, label: "AI-Powered Writing" },
                { icon: LayoutTemplate, label: "ATS-Friendly Templates" },
                { icon: TrendingUp, label: "Stand Out & Get Hired" },
              ].map((p) => (
                <div key={p.label} className="glass rounded-full pl-2 pr-4 py-2 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <p.icon className="w-4 h-4 text-white" />
                  </span>
                  <span className="text-xs font-medium">{p.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-3 rounded-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Create Your Resume
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/GEV44/resume-constructor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 border border-glass-border text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-all"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </motion.div>

          {/* RIGHT — hero image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="absolute -inset-12 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl pointer-events-none" />
            <motion.img
              src="/og-image.jpg"
              alt="AI Resume Builder — Build Resumes That Get Noticed"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-[540px] rounded-3xl shadow-2xl shadow-primary/30 border border-white/10"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading font-extrabold mb-3">
              Everything You <span className="gradient-text-cyan">Need</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Professional-grade resume analysis and optimization in one platform.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-hover rounded-2xl p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-accent/20 border border-white/10 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* Stats strip */}
      <section className="px-4 pb-8">
        <div className="container mx-auto glass rounded-2xl px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "36", label: "Job Roles" },
            { value: "100%", label: "ATS Friendly" },
            { value: "0", label: "Hallucinations" },
            { value: "10", label: "PDF Templates" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-heading font-black text-2xl md:text-3xl gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl glass border border-white/10 p-12 md:p-16 text-center"
          >
            <div className="absolute inset-0 -z-10 opacity-60">
              <div className="absolute -top-20 left-1/3 w-96 h-96 rounded-full bg-primary/30 blur-[120px]" />
              <div className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full bg-accent/30 blur-[120px]" />
            </div>
            <h2 className="font-heading font-extrabold mb-4">
              Ready to <span className="gradient-text">Stand Out</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join professionals using AI to land more interviews — no fake experience, just sharper presentation.
            </p>
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 !rounded-full">
              <Sparkles className="w-4 h-4" />
              Create Your Resume
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-heading font-bold text-lg mb-1">AI Resume Builder</p>
            <p className="text-muted-foreground text-sm">© 2026 · Built by Gevorg Hovhannisyan · Yerevan, Armenia</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/GEV44/resume-constructor"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-foreground transition-all"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
