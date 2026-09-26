import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import { Loader2, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatRole, gradeColor } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type Analysis = Pick<Tables<"analyses">, "id" | "job_role" | "overall_score" | "grade" | "created_at"> & { job_description?: string | null };

export default function Analyses() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Analysis | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAnalyses(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const deleteAnalysis = async () => {
    if (!pendingDelete) return;
    const { error } = await supabase.from("analyses").delete().eq("id", pendingDelete.id);
    setPendingDelete(null);
    if (error) { toast.error("Could not delete: " + error.message); return; }
    setAnalyses((list) => list.filter((a) => a.id !== pendingDelete.id));
    toast.success("Analysis deleted.");
  };

  return (
    <DashboardLayout>
      <Seo title="Analysis History — AI Resume Builder" description="Browse every resume analysis you've run, with scores, grades, and quick access to detailed results." path="/dashboard/analyses" />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">Analysis History</h1>
        <p className="text-muted-foreground mb-8">All your past resume analyses.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : analyses.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No analyses yet.</p>
            <Link to="/dashboard/upload" className="text-accent hover:underline text-sm mt-2 inline-block">Upload a resume</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {analyses.map((a) => (
              <li key={a.id} className="glass-hover rounded-xl p-5 flex items-center justify-between gap-4">
                <Link to={`/dashboard/analysis/${a.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {formatRole(a.job_role)}
                    {a.job_description && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary"><Briefcase className="w-3 h-3" /> Job-tailored</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.created_at, true)}</p>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-heading font-bold text-lg">{a.overall_score}</p>
                    <span className={`text-xs font-bold ${gradeColor(a.grade)}`}>Grade {a.grade}</span>
                  </div>
                  <button onClick={() => setPendingDelete(a)} aria-label={`Delete ${formatRole(a.job_role)} analysis`} className="p-2 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
            <AlertDialogDescription>Optimizations created from it will be deleted too. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAnalysis} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
