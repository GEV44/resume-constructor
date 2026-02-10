import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, TrendingUp, Download, Eye, ArrowLeft, FileText, Sparkles, ChevronRight } from "lucide-react";
import { downloadResumePDF, getTemplateList, type ResumeTemplate, type ResumeData } from "@/lib/resume-pdf";

export default function Optimizations() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>("executive");
  const [showPreview, setShowPreview] = useState(false);
  const [loadingParsed, setLoadingParsed] = useState(false);

  const templates = getTemplateList();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("optimized_resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [user]);

  const selectItem = async (item: any) => {
    if (selected?.id === item.id) {
      setSelected(null);
      setParsedData(null);
      setShowPreview(false);
      return;
    }
    setSelected(item);
    setShowPreview(true);
    setLoadingParsed(true);

    // Fetch resume parsed_json for structured PDF
    const { data: resume } = await supabase
      .from("resumes")
      .select("parsed_json")
      .eq("id", item.resume_id)
      .single();

    if (resume?.parsed_json) {
      // Merge optimized text into the parsed structure
      setParsedData(resume.parsed_json as unknown as ResumeData);
    } else {
      setParsedData(null);
    }
    setLoadingParsed(false);
  };

  const handleDownload = () => {
    if (!selected) return;
    downloadResumePDF(selected.optimized_text, parsedData, template, `resume-${selected.job_role}-${template}.pdf`);
    toast.success("PDF downloaded!");
  };

  const gradeForScore = (score: number) => {
    if (score >= 90) return { letter: "A", color: "text-accent" };
    if (score >= 80) return { letter: "B", color: "text-primary" };
    if (score >= 70) return { letter: "C", color: "text-secondary" };
    return { letter: "D", color: "text-destructive" };
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-1">Optimized Resumes</h1>
            <p className="text-muted-foreground text-sm">AI-enhanced versions with professional templates & PDF export.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-1">No optimizations yet.</p>
            <p className="text-sm text-muted-foreground">Analyze a resume first, then click "Optimize" to generate an AI-enhanced version.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[340px_1fr] gap-6">
            {/* Left: list */}
            <div className="space-y-2">
              {items.map((item) => {
                const isActive = selected?.id === item.id;
                const before = gradeForScore(item.before_score);
                const after = gradeForScore(item.after_score);
                return (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item)}
                    className={`w-full text-left rounded-xl p-4 transition-all duration-300 border ${
                      isActive
                        ? "glass border-primary/50 shadow-lg shadow-primary/10"
                        : "glass-hover border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
                        <TrendingUp className="w-3 h-3" />
                        +{item.improvement_percentage}%
                      </div>
                    </div>
                    <p className="font-heading font-bold text-sm mb-2">{item.job_role.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-bold ${before.color}`}>{item.before_score}%</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className={`font-bold ${after.color}`}>{item.after_score}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: detail */}
            <AnimatePresence mode="wait">
              {selected && showPreview && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-5"
                >
                  {/* Score improvement card */}
                  <div className="glass rounded-2xl p-6 border border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-bold text-lg">Score Improvement</h3>
                      <div className="flex items-center gap-2 text-accent font-heading font-bold text-xl">
                        <TrendingUp className="w-5 h-5" />
                        +{selected.improvement_percentage}%
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Before</p>
                        <p className="font-heading font-bold text-2xl text-destructive">{selected.before_score}%</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-full h-[2px] bg-gradient-to-r from-destructive via-primary to-accent rounded-full" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">After</p>
                        <p className="font-heading font-bold text-2xl text-accent">{selected.after_score}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Template selector */}
                  <div className="glass rounded-2xl p-5">
                    <h4 className="font-heading font-bold text-sm mb-3">Choose Template</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTemplate(t.id)}
                          className={`rounded-xl p-3 text-left transition-all border ${
                            template === t.id
                              ? "border-primary bg-primary/10"
                              : "border-transparent glass hover:bg-glass-hover"
                          }`}
                        >
                          <p className="font-heading font-bold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    disabled={loadingParsed}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loadingParsed ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                    ) : (
                      <><Download className="w-5 h-5" /> Download as PDF — {templates.find(t => t.id === template)?.name}</>
                    )}
                  </button>

                  {/* Optimized text preview */}
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-glass-border flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-heading font-bold text-sm">Optimized Resume Text</span>
                    </div>
                    <div className="p-5 max-h-[500px] overflow-y-auto">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {selected.optimized_text}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!selected && (
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <Eye className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">Select an optimization to preview & download</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
