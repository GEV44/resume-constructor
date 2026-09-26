import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import {
  Loader2, Users, FileText, BarChart3, Sparkles, TrendingUp,
  Shield, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatRole, gradeColor } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

interface Stats {
  totalUsers: number;
  totalResumes: number;
  totalAnalyses: number;
  totalOptimizations: number;
  avgScore: number;
  topRoles: { role: string; count: number }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalResumes: 0, totalAnalyses: 0,
    totalOptimizations: 0, avgScore: 0, topRoles: [],
  });
  const [recentUploads, setRecentUploads] = useState<Pick<Tables<"resumes">, "id" | "file_name" | "created_at">[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<Tables<"analyses">[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [profiles, resumeCount, analysisCount, resumes, analyses, optimizations] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("resumes").select("id", { count: "exact", head: true }),
          supabase.from("analyses").select("id", { count: "exact", head: true }),
          supabase.from("resumes").select("id, file_name, created_at").order("created_at", { ascending: false }).limit(20),
          supabase.from("analyses").select("*").order("created_at", { ascending: false }).limit(500),
          supabase.from("optimized_resumes").select("id", { count: "exact", head: true }),
        ]);

        const allAnalyses = analyses.data || [];
        const avg = allAnalyses.length > 0
          ? Math.round(allAnalyses.reduce((s, a) => s + a.overall_score, 0) / allAnalyses.length)
          : 0;

        // Count roles
        const roleCounts: Record<string, number> = {};
        for (const a of allAnalyses) {
          roleCounts[a.job_role] = (roleCounts[a.job_role] || 0) + 1;
        }
        const topRoles = Object.entries(roleCounts)
          .map(([role, count]) => ({ role, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalUsers: profiles.count || 0,
          totalResumes: resumeCount.count || 0,
          totalAnalyses: analysisCount.count || 0,
          totalOptimizations: optimizations.count || 0,
          avgScore: avg,
          topRoles,
        });

        setRecentUploads(resumes.data || []);
        setRecentAnalyses(allAnalyses.slice(0, 10));
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
        toast.error("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          toast.error("Access denied. Admin only.");
          navigate("/dashboard");
          return;
        }
        setIsAdmin(true);
        fetchData();
      });
  }, [user, navigate]);

  if (!isAdmin && !loading) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <Seo title="Admin Dashboard — AI Resume Builder" description="Platform-wide analytics, recent uploads, and admin tooling." path="/dashboard/admin" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-accent" />
          <div>
            <h1 className="font-heading font-bold text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform-wide analytics & data</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-accent" },
            { icon: FileText, label: "Resumes", value: stats.totalResumes, color: "text-primary" },
            { icon: BarChart3, label: "Analyses", value: stats.totalAnalyses, color: "text-secondary" },
            { icon: Sparkles, label: "Optimizations", value: stats.totalOptimizations, color: "text-accent" },
            { icon: TrendingUp, label: "Avg Score", value: stats.avgScore + "%", color: "text-primary" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5"
            >
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="font-heading font-bold text-2xl">{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Top Roles */}
        {stats.topRoles.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="font-heading font-bold text-lg mb-4">Most Popular Roles</h2>
            <div className="space-y-2">
              {stats.topRoles.map((r) => (
                <div key={r.role} className="flex items-center justify-between">
                  <span className="text-sm">{formatRole(r.role)}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        style={{ width: `${Math.min(100, (r.count / (stats.topRoles[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Uploads */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Recent Uploads
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentUploads.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-glass-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.created_at, true)}
                    </p>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
              ))}
              {recentUploads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No uploads yet</p>
              )}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" /> Recent Analyses
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentAnalyses.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-glass-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatRole(a.job_role)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.created_at, true)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-sm">{a.overall_score}%</p>
                    <span className={`text-[10px] font-bold ${gradeColor(a.grade)}`}>Grade {a.grade}</span>
                  </div>
                </div>
              ))}
              {recentAnalyses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No analyses yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
