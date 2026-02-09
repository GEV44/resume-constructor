import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, TrendingUp } from "lucide-react";

export default function Optimizations() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("optimized_resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">Optimized Resumes</h1>
        <p className="text-muted-foreground mb-8">AI-enhanced versions of your resumes.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No optimizations yet. Analyze a resume first, then click "Optimize".</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(selected?.id === item.id ? null : item)}
                className="glass-hover rounded-xl p-5 flex items-center justify-between w-full text-left"
              >
                <div>
                  <p className="font-medium text-sm">{item.job_role}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-accent text-sm font-bold">
                    <TrendingUp className="w-4 h-4" />
                    +{item.improvement_percentage}%
                  </div>
                  <span className="text-xs text-muted-foreground">{item.before_score}% → {item.after_score}%</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="glass rounded-2xl p-6 mt-6 border border-accent/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold">Optimized Resume — {selected.job_role}</h3>
              <span className="text-accent font-bold">{selected.before_score}% → {selected.after_score}%</span>
            </div>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {selected.optimized_text}
            </pre>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
