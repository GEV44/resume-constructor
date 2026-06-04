import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, TrendingUp, Download, Eye, FileText, Sparkles,
  ChevronRight, ArrowRight, Check, AlertTriangle, Plus, Zap,
} from "lucide-react";
import {
  downloadResumePDF, getTemplateList, parseOptimizedPayload,
  hydrateResumeData, renderResumeHtml,
  type ResumeTemplate, type ResumeData, type ChangeItem,
} from "@/lib/resume-pdf";

export default function Optimizations() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [plainText, setPlainText] = useState("");
  const [template, setTemplate] = useState<ResumeTemplate>("executive");
  const [showPreview, setShowPreview] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<"changes" | "preview" | "download">("changes");

  const templates = getTemplateList();

  // --- Live preview scaling: fit the 210mm-wide resume into its container
  // without ever clipping its height. ---
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const resumeRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.6);
  const [scaledHeight, setScaledHeight] = useState(0);

  useLayoutEffect(() => {
    const A4_WIDTH_PX = 794; // 210mm at 96dpi
    const recalc = () => {
      const wrap = previewWrapRef.current;
      const inner = resumeRef.current;
      if (!wrap || !inner) return;
      const w = wrap.clientWidth;
      const s = Math.min(1, w / A4_WIDTH_PX);
      setScale(s);
      // measure unscaled height of the resume, then apply scale
      const naturalH = inner.scrollHeight;
      setScaledHeight(Math.max(400, naturalH * s));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (previewWrapRef.current) ro.observe(previewWrapRef.current);
    if (resumeRef.current) ro.observe(resumeRef.current);
    return () => ro.disconnect();
  }, [template, resumeData, activeTab]);

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
      setResumeData(null);
      setChanges([]);
      setShowPreview(false);
      return;
    }
    setSelected(item);
    setShowPreview(true);
    setLoadingDetail(true);
    setActiveTab("changes");

    const { data: originalResume } = item.resume_id
      ? await supabase
        .from("resumes")
        .select("original_text, parsed_json")
        .eq("id", item.resume_id)
        .maybeSingle()
      : { data: null };

    // Parse the structured payload and hydrate it with the original parsed resume
    // so links, languages, skills, education, projects, and all other facts are never dropped.
    const payload = parseOptimizedPayload(item.optimized_text);
    if (payload) {
      const hydrated = hydrateResumeData(
        payload.structured,
        [originalResume?.original_text, payload.text].filter(Boolean).join("\n"),
        originalResume?.parsed_json as unknown as ResumeData | null,
      );
      setResumeData(hydrated);
      setChanges(hydrated.changes_made || []);
      setPlainText(payload.text);
    } else {
      // Legacy format — just plain text
      setPlainText(item.optimized_text);
      setChanges([]);
      setResumeData(hydrateResumeData(originalResume?.parsed_json as unknown as ResumeData | null, item.optimized_text));
    }
    setLoadingDetail(false);
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    if (!selected || downloading) return;
    setDownloading(true);
    try {
      toast.loading("Generating PDF…", { id: "pdf" });
      await downloadResumePDF(plainText, resumeData, template, `resume-${selected.job_role}-${template}.pdf`);
      toast.success("Resume downloaded ✓", { id: "pdf" });
    } catch (e: any) {
      toast.error("Failed to generate PDF: " + (e?.message || "unknown"), { id: "pdf" });
    } finally {
      setDownloading(false);
    }
  };

  const gradeForScore = (score: number) => {
    if (score >= 90) return { letter: "A", color: "text-accent" };
    if (score >= 80) return { letter: "B", color: "text-primary" };
    if (score >= 70) return { letter: "C", color: "text-secondary" };
    return { letter: "D", color: "text-destructive" };
  };

  const changeTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; icon: typeof Check; color: string }> = {
      enhanced_bullet: { label: "Enhanced", icon: Zap, color: "text-primary" },
      added_metrics: { label: "Metrics Added", icon: TrendingUp, color: "text-accent" },
      added_skill: { label: "Skill Added", icon: Plus, color: "text-accent" },
      added_project: { label: "Project Added", icon: Plus, color: "text-accent" },
      rewritten_summary: { label: "Rewritten", icon: Sparkles, color: "text-primary" },
      stronger_verb: { label: "Verb Improved", icon: ArrowRight, color: "text-secondary" },
    };
    return labels[type] || { label: type, icon: Check, color: "text-muted-foreground" };
  };

  const formatRoleName = (role: string) => role.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

  return (
    <DashboardLayout>
      <Seo title="Optimizations — AI Resume Builder" description="Download AI-optimized versions of your resume in multiple professional templates and review every change made." path="/dashboard/optimizations" />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-1">Optimized Resumes</h1>
          <p className="text-muted-foreground text-sm">AI-enhanced versions with tracked changes & professional PDF export.</p>
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
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
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
                    <p className="font-heading font-bold text-sm mb-2">{formatRoleName(item.job_role)}</p>
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
              {selected && showPreview ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-5"
                >
                  {/* Score improvement */}
                  <div className="glass rounded-2xl p-6 border border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading font-bold text-lg">Score Improvement</h2>
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

                  {/* Tab bar */}
                  <div className="glass rounded-xl p-1 flex gap-1">
                    {(["changes", "preview", "download"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-heading font-bold transition-all capitalize ${
                          activeTab === tab
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab === "changes" ? `Changes (${changes.length})` : tab === "preview" ? "Resume Preview" : "Download PDF"}
                      </button>
                    ))}
                  </div>

                  {loadingDetail ? (
                    <div className="glass rounded-2xl p-12 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Changes tab */}
                      {activeTab === "changes" && (
                        <div className="space-y-3">
                          {changes.length === 0 ? (
                            <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
                              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              No tracked changes available for this optimization.
                            </div>
                          ) : (
                            changes.map((change, i) => {
                              const ct = changeTypeLabel(change.type);
                              const Icon = ct.icon;
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className="glass rounded-xl p-4 border border-glass-border"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-4 h-4 ${ct.color}`} />
                                    <span className={`text-xs font-bold ${ct.color}`}>{ct.label}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{change.location}</span>
                                  </div>
                                  {change.before && (
                                    <div className="mb-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                                      <p className="text-xs text-muted-foreground mb-0.5 font-mono">BEFORE</p>
                                      <p className="text-sm text-muted-foreground line-through">{change.before}</p>
                                    </div>
                                  )}
                                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                                    <p className="text-xs text-accent mb-0.5 font-mono">AFTER</p>
                                    <p className="text-sm">{change.after}</p>
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Preview tab */}
                      {activeTab === "preview" && (
                        <div className="glass rounded-2xl overflow-hidden">
                          <div className="px-5 py-3 border-b border-glass-border flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-heading font-bold text-sm">Live Preview — {templates.find(t => t.id === template)?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value as ResumeTemplate)}
                                className="bg-background border border-glass-border rounded-md px-2 py-1 text-xs"
                              >
                                {templates.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="text-xs px-3 py-1 rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                              </button>
                            </div>
                          </div>
                          {/* Full-resume live preview. Width is auto-scaled to the
                              container; height grows with content — never clipped. */}
                          <div className="bg-muted/30 p-4 overflow-auto">
                            <div
                              ref={previewWrapRef}
                              style={{
                                width: "100%",
                                height: scaledHeight ? `${scaledHeight}px` : "auto",
                                position: "relative",
                                background: "#fff",
                                borderRadius: 8,
                                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                ref={resumeRef}
                                style={{
                                  width: "794px",
                                  transformOrigin: "top left",
                                  transform: `scale(${scale})`,
                                  background: "#fff",
                                }}
                                dangerouslySetInnerHTML={{ __html: renderResumeHtml(template, resumeData) }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Download tab */}
                      {activeTab === "download" && (
                        <div className="space-y-4">
                          <div className="glass rounded-2xl p-5">
                            <h3 className="font-heading font-bold text-sm mb-3">Choose Template</h3>
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

                          <button
                            onClick={handleDownload}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                          >
                            <Download className="w-5 h-5" /> Download as PDF — {templates.find(t => t.id === template)?.name}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <Eye className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">Select an optimization to view changes & download</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
