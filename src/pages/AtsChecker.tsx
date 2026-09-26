import { useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, CheckCircle2, FileSearch, FileUp, Loader2, Lock, RotateCcw, Sparkles, Target, XCircle } from "lucide-react";
import Seo from "@/components/Seo";
import { JOB_ROLES, JOB_ROLE_CATEGORIES } from "@/lib/job-roles";
import { scoreResume, type ScoreResult } from "@/lib/scoring";
import { quickParse, SAMPLE_RESUME } from "@/lib/quick-parse";
import { gradeColor } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { ExtractError, extractResumeText } from "@/lib/extract-text";

const inputClass = "w-full glass rounded-xl px-4 py-3 bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36" role="img" aria-label={`ATS score ${score} out of 100, grade ${grade}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading font-black text-4xl">{score}</span>
        <span className={`text-xs font-bold ${gradeColor(grade)}`}>Grade {grade}</span>
      </div>
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">None</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <span key={k} className={`px-2 py-0.5 rounded-full text-xs ${tone === "good" ? "bg-accent/15 text-accent" : "bg-destructive/10 text-destructive"}`}>
          {tone === "good" ? "✓ " : ""}{k}
        </span>
      ))}
    </div>
  );
}

export default function AtsChecker() {
  const [resumeText, setResumeText] = useState("");
  const [roleId, setRoleId] = useState("frontend-engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [fileNote, setFileNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setExtracting(true);
    setFileNote(null);
    try {
      const text = await extractResumeText(file);
      setResumeText(text.slice(0, 30000));
      setResult(null);
      setFileNote({ tone: "ok", text: `Extracted text from ${file.name} — review it below, then check.` });
    } catch (e) {
      setFileNote({ tone: "error", text: e instanceof ExtractError ? e.message : "Couldn't read that file. Try another format or paste the text." });
    } finally {
      setExtracting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  };
  const role = useMemo(() => JOB_ROLES.find((r) => r.id === roleId), [roleId]);

  const check = () => {
    if (!resumeText.trim()) return;
    setResult(scoreResume(quickParse(resumeText), roleId, resumeText, jobDescription));
    requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const breakdown = result
    ? [
      { label: "Skills", value: result.skill_score, weight: role?.scoring_weights.skills },
      { label: "Experience", value: result.experience_score, weight: role?.scoring_weights.experience },
      { label: "Projects", value: result.project_score, weight: role?.scoring_weights.projects },
      { label: "Education", value: result.education_score, weight: role?.scoring_weights.education },
      { label: "Impact", value: result.impact_score, weight: role?.scoring_weights.impact_metrics },
    ]
    : [];

  return (
    <div className="min-h-screen bg-animated-gradient">
      <Seo
        title="Free ATS Resume Checker — Score Your Resume Instantly"
        description="Upload a PDF or DOCX resume and a job description to get an instant, deterministic ATS score, missing keywords and fixes. Runs in your browser — nothing is uploaded."
        path="/ats-checker"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free ATS Resume Checker",
          url: `${SITE_URL}/ats-checker`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />

      <header className="glass border-b border-glass-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-heading font-black text-white text-sm">Ai</span>
            <span className="font-heading font-extrabold tracking-wide hidden sm:inline">AI RESUME BUILDER</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Log In</Link>
            <Link to="/signup" className="btn-primary !py-2 !px-5 !text-xs !rounded-full">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-[11px] mb-5 font-mono uppercase tracking-[0.14em]">
            <Lock className="w-3 h-3 text-accent" /> Runs in your browser · nothing uploaded
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tight mb-3">
            Free <span className="gradient-text">ATS Resume Checker</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload or paste your resume, pick a target role and optionally a job description. You get the same deterministic score our full app uses — same input, same score. Ongoing roles ("Present") are counted up to today.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
          <div
            className={`glass rounded-2xl p-5 transition-all ${dragOver ? "ring-2 ring-accent" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <label htmlFor="checker-resume" className="text-sm font-medium">Your resume</label>
              <div className="flex items-center gap-3">
                <input ref={fileInput} type="file" accept=".pdf,.docx,.txt" className="hidden" aria-label="Upload resume file" onChange={(e) => loadFile(e.target.files?.[0])} />
                <button type="button" onClick={() => fileInput.current?.click()} disabled={extracting} className="text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-glass-hover disabled:opacity-50">
                  {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />} Upload PDF / DOCX
                </button>
                <button type="button" onClick={() => { setResumeText(SAMPLE_RESUME); setResult(null); setFileNote(null); }} className="text-xs text-accent hover:underline">
                  Use a sample
                </button>
              </div>
            </div>
            {fileNote && (
              <p role="status" className={`text-xs mb-2 ${fileNote.tone === "ok" ? "text-accent" : "text-destructive"}`}>{fileNote.text}</p>
            )}
            <textarea
              id="checker-resume"
              rows={18}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value.slice(0, 30000))}
              placeholder={"Drop a PDF or DOCX here, upload one, or paste your resume text.\nEverything stays in your browser."}
              className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
            />
          </div>

          <div className="space-y-5">
            <div className="glass rounded-2xl p-5">
              <label htmlFor="checker-role" className="text-sm font-medium mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Target role</label>
              <select id="checker-role" value={roleId} onChange={(e) => setRoleId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                {JOB_ROLE_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={cat} className="bg-card">
                    {JOB_ROLES.filter((r) => r.category === cat).map((r) => <option key={r.id} value={r.id} className="bg-card">{r.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="glass rounded-2xl p-5">
              <label htmlFor="checker-jd" className="text-sm font-medium mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-accent" /> Job description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea id="checker-jd" rows={8} value={jobDescription} onChange={(e) => setJobDescription(e.target.value.slice(0, 20000))} placeholder="Paste the job posting to measure keyword coverage…" className={`${inputClass} resize-y`} />
            </div>
            <button onClick={check} disabled={!resumeText.trim()} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <FileSearch className="w-4 h-4" /> Check My Resume
            </button>
          </div>
        </div>

        {result && (
          <motion.section id="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-5 scroll-mt-6" aria-live="polite">
            <div className="glass rounded-3xl p-6 md:p-8 grid md:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={result.overall_score} grade={result.grade} />
                <p className="text-xs text-muted-foreground">for {role?.name}</p>
              </div>
              <div className="space-y-3">
                {breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{b.label} <span className="text-muted-foreground">· {b.weight}% weight</span></span>
                      <span className="font-mono">{b.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} animate={{ width: `${b.value}%` }} transition={{ duration: 0.9 }} />
                    </div>
                  </div>
                ))}
                {result.job_match && (
                  <p className="text-xs text-muted-foreground pt-1">Includes a {result.job_match.score}% job-description keyword match (30% of the overall score).</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="glass rounded-2xl p-5">
                <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Role skills found</h2>
                <Chips items={result.matched_skills} tone="good" />
              </div>
              <div className="glass rounded-2xl p-5">
                <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /> Core skills missing</h2>
                <Chips items={result.missing_skills} tone="bad" />
              </div>
              {result.job_match && (
                <>
                  <div className="glass rounded-2xl p-5">
                    <h2 className="font-heading font-bold text-base mb-3">Job keywords you cover ({result.job_match.matched.length}/{result.job_match.total})</h2>
                    <Chips items={result.job_match.matched} tone="good" />
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <h2 className="font-heading font-bold text-base mb-3">Job keywords missing</h2>
                    <Chips items={result.job_match.missing} tone="bad" />
                  </div>
                </>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="font-heading font-bold text-base mb-3">How to improve</h2>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
                {result.recommendations.map((r) => <li key={r}>{r}</li>)}
              </ol>
            </div>

            <div className="glass rounded-3xl p-6 md:p-8 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-5">
              <div>
                <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Want the fixes written for you?</h2>
                <p className="text-sm text-muted-foreground">Upload your PDF or DOCX for an AI review, honest rewrites with no invented facts, and ATS-ready PDF and Word exports.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="glass rounded-full px-5 py-3 text-sm font-bold flex items-center gap-2 hover:bg-glass-hover">
                  <RotateCcw className="w-4 h-4" /> Recheck
                </button>
                <Link to="/signup" className="btn-primary !rounded-full flex items-center gap-2">Start free <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
