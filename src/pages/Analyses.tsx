import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Analyses() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAnalyses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const deleteAnalysis = async (id: string) => {
    await supabase.from("analyses").delete().eq("id", id);
    toast.success("Analysis deleted.");
    fetch();
  };

  return (
    <DashboardLayout>
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
          <div className="space-y-3">
            {analyses.map((a) => (
              <div key={a.id} className="glass-hover rounded-xl p-5 flex items-center justify-between">
                <Link to={`/dashboard/analysis/${a.id}`} className="flex-1">
                  <p className="font-medium text-sm">{a.job_role}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-heading font-bold text-lg">{a.overall_score}%</p>
                    <span className={`text-xs font-bold ${a.grade === "A" ? "text-accent" : a.grade === "B" ? "text-primary" : "text-destructive"}`}>
                      Grade {a.grade}
                    </span>
                  </div>
                  <button onClick={() => deleteAnalysis(a.id)} className="p-2 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
