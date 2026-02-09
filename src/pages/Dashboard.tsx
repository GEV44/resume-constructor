import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Upload, FileText, BarChart3, Sparkles, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ resumes: 0, analyses: 0, optimizations: 0, avgScore: 0 });
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [resumes, analyses, optimizations] = await Promise.all([
        supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("optimized_resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const analysesData = analyses.data || [];
      const avg = analysesData.length > 0 ? Math.round(analysesData.reduce((s, a) => s + a.overall_score, 0) / analysesData.length) : 0;

      setStats({
        resumes: resumes.count || 0,
        analyses: analysesData.length,
        optimizations: optimizations.count || 0,
        avgScore: avg,
      });
      setRecentAnalyses(analysesData.slice(0, 5));
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { icon: FileText, label: "Resumes", value: stats.resumes, color: "text-accent" },
    { icon: BarChart3, label: "Analyses", value: stats.analyses, color: "text-primary" },
    { icon: Sparkles, label: "Optimizations", value: stats.optimizations, color: "text-secondary" },
    { icon: TrendingUp, label: "Avg Score", value: stats.avgScore + "%", color: "text-accent" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-1">Welcome back, {profile?.name || "User"}</h1>
        <p className="text-muted-foreground mb-8">Here's your resume analytics overview.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="font-heading font-bold text-2xl">{s.value}</p>
              <p className="text-muted-foreground text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-4 mb-10 flex-wrap">
          <Link to="/dashboard/upload" className="btn-primary !text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload New Resume
          </Link>
        </div>

        {/* Recent analyses */}
        <h2 className="font-heading font-bold text-xl mb-4">Recent Analyses</h2>
        {recentAnalyses.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No analyses yet. Upload a resume to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAnalyses.map((a) => (
              <Link
                key={a.id}
                to={`/dashboard/analysis/${a.id}`}
                className="glass-hover rounded-xl p-5 flex items-center justify-between block"
              >
                <div>
                  <p className="font-medium text-sm">{a.job_role}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-lg">{a.overall_score}%</p>
                  <span className={`text-xs font-bold ${
                    a.grade === "A" ? "text-accent" :
                    a.grade === "B" ? "text-primary" :
                    a.grade === "C" ? "text-secondary" : "text-destructive"
                  }`}>
                    Grade {a.grade}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
