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
  Type, Hash, LayoutList, Lightbulb,
} from "lucide-react";

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
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeStep, setOptimizeStep] = useState("");
  const [expandedProblems, setExpandedProblems] = useState<Set<number>>(new Set());
  const [optimizeMode, setOptimizeMode] = useState<"text" | "design" | "both">("both");

  // Problems from navigation state (AI-generated)
  const problems: Problem[] = (location.state as any)?.problems || [];
  const structureIssues: string[] = (location.state as any)?.structure_issues || [];

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
  }, [id, user]);

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

      setOptimizeStep("Optimizing with AI (this may take 15-30s)...");
      const response = await supabase.functions.invoke("optimize-resume", {
        body: {
          resumeText: resume.original_text,
          parsed: resume.parsed_json,
          jobRoleId: analysis.job_role,
          analysisId: analysis.id,
          resumeId: analysis.resume_id,
          currentScore: analysis.overall_score,
          missingSkills: analysis.missing_skills,
          recommendations: analysis.recommendations,
          mode: optimizeMode,
        },
      });

      if (response.error) {
        const errMsg = typeof response.error === "object" && response.error.message
          ? response.error.message : String(response.error);
        throw new Error(errMsg);
      }

      const data = response.data;
      if (!data || data.error) throw new Error(data?.error || "Optimization failed.");

      setOptimizeStep("Done!");
      toast.success(`Optimized! Score improved from ${data.before_score}% to ${data.after_score}%`);
      navigate("/dashboard/optimizations");
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error(err.message || "Optimization failed. Please try again.");
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
  const gradeColor = analysis.grade === "A" ? "text-accent" : analysis.grade === "B" ? "text-primary" : analysis.grade === "C" ? "text-secondary" : "text-destructive";

  const criticalCount = problems.filter((p) => p.severity === "critical").length;
  const majorCount = problems.filter((p) => p.severity === "major").length;
  const minorCount = problems.filter((p) => p.severity === "minor").length;

  return (
    <DashboardLayout>
      <Seo
        title={`Analysis Results — ${analysis.job_role.replace(/-/g, " ")}`}
        description={`Resume analysis for ${analysis.job_role.replace(/-/g, " ")}: overall score, grade, problems, and AI-powered optimization suggestions.`}
        path={`/dashboard/analysis/${analysis.id}`}
      />
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Score header */}
        <div className="glass rounded-3xl p-8 text-center mb-8">
          <h1 className="font-heading font-bold text-2xl mb-2">
            Analysis Results — {analysis.job_role.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
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
          <p className={`font-heading font-bold text-xl mt-2 ${gradeColor}`}>Grade {analysis.grade}</p>

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
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "both", label: "Text + Design", desc: "Rewrite content & restyle" },
              { id: "text", label: "Text Only", desc: "Rewrite bullets, keep layout" },
              { id: "design", label: "Design Only", desc: "New template, same words" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
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
            <><Sparkles className="w-4 h-4" /> Optimize My Resume with AI (GPT-5)</>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
}
