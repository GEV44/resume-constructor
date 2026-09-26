import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, Sparkles, ArrowLeft, AlertTriangle, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, Zap, Target, FileWarning,
  Type, Hash, LayoutList, Lightbulb, Briefcase,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { JobMatch } from "@/lib/scoring";
import { formatRole, functionError, gradeColor } from "@/lib/format";

interface Problem {
  type: string;
  severity: "critical" | "major" | "minor";
  location: string;
  issue: string;
  original_text: string;
  fix: string;
}

const severityConfig = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: AlertCircle, label: "Critical" },
  major: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: AlertTriangle, label: "Major" },
  minor: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Lightbulb, label: "Minor" },
};

const problemTypeIcons: Record<string, typeof Zap> = {
  missing_quantification: Hash,
  weak_action_verb: Type,
  missing_technical_skills: Target,
  irrelevant_experience: FileWarning,
  missing_projects: LayoutList,
  poor_structure: LayoutList,
  vague_description: Type,
  no_metrics: Hash,
  weak_bullet: Zap,
  missing_keywords: Target,
  generic_language: Type,
  no_impact_shown: Hash,
};

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [analysis, setAnalysis] = useState<Tables<"analyses"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeStep, setOptimizeStep] = useState("");
  const [expandedProblems, setExpandedProblems] = useState<Set<number>>(new Set());
  const [optimizeMode, setOptimizeMode] = useState<"text" | "design" | "both">("both");

  // Findings are stored on the analysis; navigation state covers older function deployments.
  const navState = location.state as { problems?: Problem[]; structure_issues?: string[] } | null;
  const storedProblems = Array.isArray(analysis?.problems) ? (analysis.problems as unknown as Problem[]) : [];
  const storedStructure = Array.isArray(analysis?.structure_issues) ? (analysis.structure_issues as string[]) : [];
  const problems: Problem[] = storedProblems.length ? storedProblems : navState?.problems || [];
  const structureIssues: string[] = storedStructure.length ? storedStructure : navState?.structure_issues || [];
  const jobMatch = (analysis?.job_match ?? null) as unknown as JobMatch | null;

  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error("Analysis not found."); navigate("/dashboard"); return; }
        setAnalysis(data);
        setLoading(false);
      });
  }, [id, user, navigate]);

  const toggleProblem = (i: number) => {
    setExpandedProblems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleOptimize = async () => {
    if (!analysis || !user) return;
    setOptimizing(true);

    try {
      setOptimizeStep("Loading resume data...");
      const { data: resume } = await supabase
        .from("resumes")
        .select("original_text, parsed_json")
        .eq("id", analysis.resume_id)
        .single();

      if (!resume) throw new Error("Resume not found");

      setOptimizeStep(optimizeMode === "design" ? "Applying design…" : "Rewriting with AI (usually 15–40s)…");
      const response = await supabase.functions.invoke("optimize-resume", {
        body: {
          analysisId: analysis.id,
          mode: optimizeMode,
          // Legacy fields for older deployments of the function.
          resumeText: resume.original_text,
          parsed: resume.parsed_json,
          jobRoleId: analysis.job_role,
          resumeId: analysis.resume_id,
          currentScore: analysis.overall_score,
          missingSkills: analysis.missing_skills,
          recommendations: analysis.recommendations,
        },
      });

      const errMsg = await functionError(response.error, response.data);
      const data = response.data;
      if (errMsg || !data) throw new Error(errMsg || "Optimization failed.");

      setOptimizeStep("Done!");
      const delta = data.after_score - data.before_score;
      toast.success(delta > 0 ? `Optimized! Re-scored ${data.before_score} → ${data.after_score}` : "Optimized! Review and fill in any [X] placeholders.");
      navigate("/dashboard/optimizations", { state: { select: data.id } });
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(err instanceof Error ? err.message : "Optimization failed. Please try again.");
    } finally {
      setOptimizing(false);
      setOptimizeStep("");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const missingSkills = (analysis.missing_skills as string[]) || [];
  const strengths = (analysis.strengths as string[]) || [];
  const recommendations = (analysis.recommendations as string[]) || [];
  const roleName = formatRole(analysis.job_role);

  const criticalCount = problems.filter((p) => p.severity === "critical").length;
  const majorCount = problems.filter((p) => p.severity === "major").length;
  const minorCount = problems.filter((p) => p.severity === "minor").length;

  return (
    <DashboardLayout>
      <Seo
        title={`Analysis Results — ${roleName}`}
        description={`Resume analysis for ${roleName}: overall score, grade, problems, and AI-powered optimization suggestions.`}
        path={`/dashboard/analysis/${analysis.id}`}
      />
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Score header */}
        <div className="glass rounded-3xl p-8 text-center mb-8">
          <h1 className="font-heading font-bold text-2xl mb-2">
            Analysis Results — {roleName}
          </h1>
          <p className="text-muted-foreground text-sm mb-2">Overall Score</p>
          <motion.p
            className="font-heading font-black text-6xl gradient-text"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {analysis.overall_score}%
          </motion.p>
          <p className={`font-heading font-bold text-xl mt-2 ${gradeColor(analysis.grade)}`}>Grade {analysis.grade}</p>
          {jobMatch && <p className="text-xs text-muted-foreground">Includes {jobMatch.score}% job-description keyword match (30% weight)</p>}

          <div className="progress-bar-container relative bg-muted rounded-full overflow-hidden my-5 max-w-md mx-auto">
            <motion.div
              className="progress-bar-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-destructive via-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${analysis.overall_score}%` }}
              transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Skills", score: analysis.skill_score },
            { label: "Experience", score: analysis.experience_score },
            { label: "Projects", score: analysis.project_score },
            { label: "Education", score: analysis.education_score },
            { label: "Impact", score: analysis.impact_score },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="font-heading font-bold text-xl">{item.score}%</p>
            </div>
          ))}
        </div>

        {/* Job description keyword match */}
        {jobMatch && (
          <div className="glass rounded-2xl p-6 mb-8 border border-primary/20">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Job Description Match
              </h2>
              <span className="font-heading font-black text-2xl gradient-text">{jobMatch.score}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={jobMatch.score} aria-valuemin={0} aria-valuemax={100} aria-label="Job description keyword coverage">
              <motion.div className="h-full bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} animate={{ width: `${jobMatch.score}%` }} transition={{ duration: 1 }} />
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Found in your resume ({jobMatch.matched.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.matched.map((k) => <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-accent/15 text-accent">✓ {k}</span>)}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Missing ({jobMatch.missing.length}) — add only if true</p>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatch.missing.map((k) => <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">{k}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === PROBLEMS SECTION (AI Deep Analysis) === */}
        {problems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-xl">🔍 Specific Problems Found ({problems.length})</h2>
              <div className="flex items-center gap-3 text-xs">
                {criticalCount > 0 && <span className="flex items-center gap-1 text-destructive font-bold"><AlertCircle className="w-3 h-3" />{criticalCount} Critical</span>}
                {majorCount > 0 && <span className="flex items-center gap-1 text-orange-500 font-bold"><AlertTriangle className="w-3 h-3" />{majorCount} Major</span>}
                {minorCount > 0 && <span className="flex items-center gap-1 text-yellow-500 font-bold"><Lightbulb className="w-3 h-3" />{minorCount} Minor</span>}
              </div>
            </div>

            <div className="space-y-2">
              {problems.map((problem, i) => {
                const sev = severityConfig[problem.severity] || severityConfig.minor;
                const SevIcon = sev.icon;
                const TypeIcon = problemTypeIcons[problem.type] || Zap;
                const isExpanded = expandedProblems.has(i);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`glass rounded-xl border ${sev.border} overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleProblem(i)}
                      aria-expanded={isExpanded}
                      className="w-full text-left px-4 py-3 flex items-center gap-3"
                    >
                      <SevIcon className={`w-4 h-4 shrink-0 ${sev.color}`} />
                      <TypeIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{problem.issue}</p>
                        <p className="text-xs text-muted-foreground">{problem.location}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                        {sev.label}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="px-4 pb-4 space-y-2"
                      >
                        {problem.original_text && (
                          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                            <p className="text-[10px] text-muted-foreground font-mono mb-1">ORIGINAL TEXT</p>
                            <p className="text-sm text-muted-foreground italic">"{problem.original_text}"</p>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                          <p className="text-[10px] text-accent font-mono mb-1">SUGGESTED FIX</p>
                          <p className="text-sm">{problem.fix}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Structure Issues */}
        {structureIssues.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-orange-500/20 mb-8">
            <h3 className="font-heading font-bold text-orange-500 mb-3 flex items-center gap-2">
              <LayoutList className="w-5 h-5" /> Structure Issues
            </h3>
            <ul className="space-y-2 text-sm">
              {structureIssues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-orange-500 mt-0.5">⚠</span>{issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths & Missing Skills */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-bold text-accent mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Strengths
            </h3>
            <ul className="space-y-2 text-sm">
              {strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-accent mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-bold text-destructive mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" /> Missing Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length > 0 ? missingSkills.map((s: string) => (
                <span key={s} className="glass rounded-lg px-3 py-1 text-xs text-muted-foreground">{s}</span>
              )) : <p className="text-sm text-muted-foreground">No critical missing skills!</p>}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass rounded-2xl p-6 border border-accent/20 mb-8">
          <h3 className="font-heading font-bold text-accent mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" /> Recommendations
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent font-bold">{i + 1}.</span>{r}
              </li>
            ))}
          </ul>
        </div>

        {/* Mode selector */}
        <div className="glass rounded-2xl p-5 mb-4">
          <h3 className="font-heading font-bold text-sm mb-3">What should AI optimize?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Optimization mode">
            {([
              { id: "both", label: "Full Rewrite", desc: "Summary, bullets, projects & skill order" },
              { id: "text", label: "Bullets Only", desc: "Summary & bullets, skills untouched" },
              { id: "design", label: "Design Only", desc: "New template, same words — no AI" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                role="radio"
                aria-checked={optimizeMode === opt.id}
                onClick={() => setOptimizeMode(opt.id)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  optimizeMode === opt.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent glass hover:bg-glass-hover"
                }`}
              >
                <p className="font-heading font-bold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Optimize CTA */}
        <button onClick={handleOptimize} disabled={optimizing} className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {optimizing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {optimizeStep || "Optimizing..."}</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {optimizeMode === "design" ? "Restyle My Resume" : "Optimize My Resume with AI"}</>
          )}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          The AI never invents jobs, dates or numbers — where a metric would help, it leaves an <span className="font-mono">[X]</span> placeholder for you to fill in.
        </p>
      </div>
    </DashboardLayout>
  );
}
