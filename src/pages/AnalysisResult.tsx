import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

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

  const handleOptimize = async () => {
    if (!analysis || !user) return;
    setOptimizing(true);

    try {
      const { data: resume } = await supabase
        .from("resumes")
        .select("original_text, parsed_json")
        .eq("id", analysis.resume_id)
        .single();

      if (!resume) throw new Error("Resume not found");

      const { data, error } = await supabase.functions.invoke("optimize-resume", {
        body: {
          resumeText: resume.original_text,
          parsed: resume.parsed_json,
          jobRoleId: analysis.job_role,
          analysisId: analysis.id,
          resumeId: analysis.resume_id,
          currentScore: analysis.overall_score,
          missingSkills: analysis.missing_skills,
          recommendations: analysis.recommendations,
        },
      });

      if (error) throw error;
      toast.success(`Optimized! Score improved from ${data.before_score}% to ${data.after_score}%`);
      navigate(`/dashboard/optimizations`);
    } catch (err: any) {
      toast.error(err.message || "Optimization failed.");
    } finally {
      setOptimizing(false);
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Score header */}
        <div className="glass rounded-3xl p-8 text-center mb-8">
          <p className="text-muted-foreground text-sm mb-2">Overall Score — {analysis.job_role}</p>
          <motion.p
            className="font-heading font-black text-6xl gradient-text"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {analysis.overall_score}%
          </motion.p>
          <p className={`font-heading font-bold text-xl mt-2 ${gradeColor}`}>Grade {analysis.grade}</p>

          {/* Progress bar */}
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

        {/* Strengths & Missing */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-bold text-accent mb-3">✓ Strengths</h3>
            <ul className="space-y-2 text-sm">
              {strengths.map((s: string) => (
                <li key={s} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-accent mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-bold text-destructive mb-3">⚠ Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length > 0 ? missingSkills.map((s: string) => (
                <span key={s} className="glass rounded-lg px-3 py-1 text-xs text-muted-foreground">{s}</span>
              )) : <p className="text-sm text-muted-foreground">No critical missing skills!</p>}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass rounded-2xl p-6 border border-accent/20 mb-8">
          <h3 className="font-heading font-bold text-accent mb-3">💡 Recommendations</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recommendations.map((r: string) => (
              <li key={r} className="flex items-start gap-2">
                <span className="text-accent">→</span>{r}
              </li>
            ))}
          </ul>
        </div>

        {/* Optimize CTA */}
        <button onClick={handleOptimize} disabled={optimizing} className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50">
          {optimizing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing with AI...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Optimize My Resume with AI</>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
}
