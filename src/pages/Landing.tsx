import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, BarChart3, Sparkles, Target, TrendingUp, Shield } from "lucide-react";
import Seo from "@/components/Seo";

const features = [
  { icon: FileText, title: "Smart Resume Parsing", desc: "Upload PDF or DOCX — our AI extracts and structures your resume data automatically." },
  { icon: BarChart3, title: "Deterministic Scoring", desc: "Same resume + same role = identical score every time. No randomness, pure analysis." },
  { icon: Sparkles, title: "AI Optimization", desc: "Enhance your resume with better wording, ATS keywords, and impact metrics — never fake data." },
  { icon: Target, title: "30+ Job Roles", desc: "Tailored scoring for Tech, Business, Finance, HR, and Design roles." },
  { icon: TrendingUp, title: "Track Progress", desc: "Compare scores over time and see exactly how your improvements translate to results." },
  { icon: Shield, title: "Private & Secure", desc: "Your data stays yours. End-to-end encryption, row-level security, no data sharing." },
];

export default function Landing() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AI Resume Builder",
      url: "https://skill-fortune-predictor.lovable.app/",
      description: "AI-powered resume analysis and optimization with deterministic scoring across 30+ job roles.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AI Resume Builder",
      url: "https://skill-fortune-predictor.lovable.app/",
    },
  ];
  return (
    <div className="min-h-screen bg-animated-gradient">
      <Seo
        title="AI Resume Builder — Score & Optimize Your Resume"
        description="Upload your resume, get a deterministic ATS score for 30+ job roles, and let AI optimize it without inventing fake experience."
        path="/"
        jsonLd={jsonLd}
      />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between py-4">
          <span className="font-heading font-extrabold text-xl gradient-text flex items-center gap-2">
            <span className="animate-icon-pulse">📄</span> AI Resume Builder
          </span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-400">
              Log In
            </Link>
            <Link to="/signup" className="btn-primary !py-2 !px-5 !text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
      {/* Hero */}
      <section className="pt-36 pb-24 md:pt-48 md:pb-36 px-4">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              AI-Powered Resume Intelligence
            </div>
            <h1 className="font-heading font-black mb-6">
              Build Resumes That
              <br />
              <span className="gradient-text">Get Noticed</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your resume, get a deterministic score for any job role, and let AI optimize it — all without inventing fake experience.
            </p>
            <Link to="/signup" className="btn-primary inline-block mb-4">
              🚀 Start Analyzing for Free
            </Link>
            <p className="text-muted-foreground text-sm">
              ✓ No credit card required &nbsp; ✓ 30+ job roles &nbsp; ✓ Deterministic scoring
            </p>
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
                <f.icon className="w-10 h-10 text-accent mb-4" />
                <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading font-extrabold mb-4">
              Ready to <span className="gradient-text-pink">Stand Out</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of professionals who've improved their resumes with AI-powered insights.
            </p>
            <Link to="/signup" className="btn-primary inline-block">
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-12 px-4">
        <div className="container mx-auto text-center">
          <p className="font-heading font-bold text-lg mb-1">AI Resume Builder</p>
          <p className="text-muted-foreground text-sm">Build Resumes That Get Noticed.</p>
        </div>
      </footer>
    </div>
  );
}
