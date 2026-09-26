import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import { Upload, FileText, BarChart3, Sparkles, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { formatDate, formatRole, gradeColor } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type Analysis = Pick<Tables<"analyses">, "id" | "job_role" | "overall_score" | "grade" | "created_at">;

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ resumes: 0, optimizations: 0 });
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("analyses").select("id, job_role, overall_score, grade, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("optimized_resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([resumes, analysesRes, optimizations]) => {
      setCounts({ resumes: resumes.count || 0, optimizations: optimizations.count || 0 });
      setAnalyses(analysesRes.data || []);
      setLoading(false);
    });
  }, [user]);

  const best = analyses.reduce((m, a) => Math.max(m, a.overall_score), 0);
  const avg = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.overall_score, 0) / analyses.length) : 0;
  const trend = useMemo(
    () => [...analyses].reverse().map((a) => ({ date: formatDate(a.created_at), score: a.overall_score, role: formatRole(a.job_role) })),
    [analyses],
  );
  const latest = analyses[0];

  const statCards = [
    { icon: FileText, label: "Resumes", value: counts.resumes, color: "text-accent" },
    { icon: BarChart3, label: "Analyses", value: analyses.length, color: "text-primary" },
    { icon: Sparkles, label: "Optimizations", value: counts.optimizations, color: "text-secondary" },
    { icon: TrendingUp, label: "Best / Avg Score", value: analyses.length ? `${best} / ${avg}` : "—", color: "text-accent" },
  ];

  const nextStep = !latest
    ? { text: "Upload your resume to get your first ATS score.", to: "/dashboard/upload", cta: "Upload resume" }
    : latest.overall_score < 80
      ? { text: `Your latest ${formatRole(latest.job_role)} score is ${latest.overall_score}. Fix the top issues and optimize it.`, to: `/dashboard/analysis/${latest.id}`, cta: "Review & optimize" }
      : { text: "Strong score! Tailor it to a specific job posting for even better matching.", to: "/dashboard/upload", cta: "Tailor to a job" };

  return (
    <DashboardLayout>
      <Seo title="Dashboard — AI Resume Builder" description="Your resume analytics overview: total resumes, analyses, optimizations, and recent results." path="/dashboard" />
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-1">Your Resume Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back{profile?.name ? `, ${profile.name}` : ""} — here's your resume analytics overview.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} aria-hidden />
              <p className="font-heading font-bold text-2xl">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value}</p>
              <p className="text-muted-foreground text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div className="glass rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-primary/20">
            <p className="text-sm"><span className="font-heading font-bold text-primary">Next step: </span>{nextStep.text}</p>
            <Link to={nextStep.to} className="btn-primary !text-sm !py-2 flex items-center gap-2 shrink-0 justify-center">
              {nextStep.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {trend.length >= 2 && (
          <div className="glass rounded-2xl p-5 mb-10">
            <h2 className="font-heading font-bold text-lg mb-4">Score Progress</h2>
            <div className="h-56" role="img" aria-label={`Score trend across ${trend.length} analyses, from ${trend[0].score} to ${trend[trend.length - 1].score}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--muted-foreground) / 0.12)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    formatter={(value: number, _name, entry) => [`${value}`, (entry.payload as { role: string }).role]}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#scoreFill)" dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-xl">Recent Analyses</h2>
          {analyses.length > 5 && <Link to="/dashboard/analyses" className="text-sm text-accent hover:underline">View all</Link>}
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : analyses.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-4">No analyses yet. Upload a resume to get started!</p>
            <Link to="/dashboard/upload" className="btn-primary !text-sm inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Resume</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.slice(0, 5).map((a) => (
              <Link key={a.id} to={`/dashboard/analysis/${a.id}`} className="glass-hover rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{formatRole(a.job_role)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-lg">{a.overall_score}</p>
                  <span className={`text-xs font-bold ${gradeColor(a.grade)}`}>Grade {a.grade}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
