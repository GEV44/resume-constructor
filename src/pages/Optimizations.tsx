import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import Seo from "@/components/Seo";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2, TrendingUp, Download, Eye, FileText, Sparkles, ChevronRight, ArrowRight, Check, AlertTriangle,
  Plus, Zap, Trash2, Save, FileType, FileCode2, Copy, Lightbulb, PencilLine,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  downloadResumePDF, getTemplateList, parseOptimizedPayload, serializeOptimizedPayload,
  hydrateResumeData, renderResumeHtml,
  type ResumeTemplate, type ResumeData, type ChangeItem,
} from "@/lib/resume-pdf";
import { downloadAtsPdf, downloadDocx, downloadText, hasNonLatinText, resumeToPlainText } from "@/lib/resume-export";
import { computeGrade, scoreResume } from "@/lib/scoring";
import { formatDate, formatRole, gradeColor } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type Item = Tables<"optimized_resumes">;
type Tab = "changes" | "edit" | "preview" | "download";

const PLACEHOLDER_RE = /\[(?:X|N|\$X|X%|[^\]]{0,24}\bX\b[^\]]{0,24})\]/g;

function countPlaceholders(data: ResumeData | null): number {
  if (!data) return 0;
  const text = [data.summary ?? "", ...data.experience.flatMap((e) => e.responsibilities), ...data.projects.map((p) => p.description)].join("\n");
  return (text.match(PLACEHOLDER_RE) ?? []).length;
}

/** Drops the blank lines and empty list items that appear while editing. */
function tidy(data: ResumeData | null): ResumeData | null {
  if (!data) return null;
  const list = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);
  return {
    ...data,
    summary: data.summary?.trim(),
    skills: list(data.skills),
    tools: list(data.tools),
    experience: data.experience.map((e) => ({ ...e, responsibilities: list(e.responsibilities) })),
    projects: data.projects.map((p) => ({ ...p, description: p.description.trim() })),
  };
}

const changeTypes: Record<string, { label: string; icon: typeof Check; color: string }> = {
  enhanced_bullet: { label: "Enhanced", icon: Zap, color: "text-primary" },
  added_metrics: { label: "Metrics", icon: TrendingUp, color: "text-accent" },
  added_skill: { label: "Skill Added", icon: Plus, color: "text-accent" },
  added_keywords: { label: "Keywords", icon: Plus, color: "text-accent" },
  added_project: { label: "Project Added", icon: Plus, color: "text-accent" },
  rewritten_summary: { label: "Summary", icon: Sparkles, color: "text-primary" },
  stronger_verb: { label: "Stronger Verb", icon: ArrowRight, color: "text-secondary" },
  reordered: { label: "Reordered", icon: ArrowRight, color: "text-secondary" },
  design_refresh: { label: "Design", icon: Sparkles, color: "text-primary" },
};

const inputClass = "w-full glass rounded-xl px-3 py-2 bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

export default function Optimizations() {
  const { user } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Item | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [payloadMode, setPayloadMode] = useState<string | undefined>();
  const [jobDescription, setJobDescription] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<ResumeTemplate>("ats");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("changes");
  const [exporting, setExporting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const templates = getTemplateList();
  const cleanData = useMemo(() => tidy(resumeData), [resumeData]);
  const placeholderCount = useMemo(() => countPlaceholders(cleanData), [cleanData]);
  const previewHtml = useMemo(() => renderResumeHtml(template, cleanData), [template, cleanData]);

  // Re-score the current (possibly edited) content with the same deterministic engine as the server.
  const liveScore = useMemo(() => {
    if (!selected || !cleanData) return null;
    try {
      return scoreResume(cleanData, selected.job_role, resumeToPlainText(cleanData), jobDescription).overall_score;
    } catch {
      return null;
    }
  }, [selected, cleanData, jobDescription]);

  // --- Live preview scaling: fit the 210mm-wide resume into its container without clipping its height.
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
      const s = Math.min(1, wrap.clientWidth / A4_WIDTH_PX);
      setScale(s);
      setScaledHeight(Math.max(400, inner.scrollHeight * s));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (previewWrapRef.current) ro.observe(previewWrapRef.current);
    if (resumeRef.current) ro.observe(resumeRef.current);
    return () => ro.disconnect();
  }, [previewHtml, activeTab]);

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

  const selectItem = async (item: Item) => {
    if (dirty && !window.confirm("Discard unsaved edits?")) return;
    setDirty(false);
    if (selected?.id === item.id) {
      setSelected(null);
      setResumeData(null);
      return;
    }
    setSelected(item);
    setLoadingDetail(true);
    setActiveTab("changes");

    const [{ data: originalResume }, { data: analysis }] = await Promise.all([
      supabase.from("resumes").select("original_text, parsed_json").eq("id", item.resume_id).maybeSingle(),
      supabase.from("analyses").select("*").eq("id", item.analysis_id).maybeSingle(),
    ]);
    setJobDescription(analysis?.job_description ?? "");
    setOriginalText(originalResume?.original_text ?? "");

    // Hydrate with the original parse so contact links, languages and other facts are never dropped.
    const payload = parseOptimizedPayload(item.optimized_text);
    const original = originalResume?.parsed_json as unknown as ResumeData | null;
    if (payload) {
      const hydrated = hydrateResumeData(payload.structured, [originalResume?.original_text, payload.text].filter(Boolean).join("\n"), original);
      setResumeData(hydrated);
      setChanges(hydrated.changes_made || []);
      setSuggestions(payload.suggestions);
      setPayloadMode(payload.mode);
    } else {
      // Legacy format — plain text only.
      setResumeData(hydrateResumeData(original, item.optimized_text));
      setChanges([]);
      setSuggestions([]);
      setPayloadMode(undefined);
    }
    setLoadingDetail(false);
  };

  // Open the optimization we were just sent here for.
  const autoSelectId = (location.state as { select?: string } | null)?.select;
  const autoSelected = useRef(false);
  useEffect(() => {
    if (autoSelected.current || !autoSelectId || items.length === 0) return;
    const item = items.find((i) => i.id === autoSelectId);
    if (item) {
      autoSelected.current = true;
      selectItem(item);
    }
    // selectItem is intentionally not a dependency: this runs once when the list arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, autoSelectId]);

  const edit = (updater: (d: ResumeData) => ResumeData) => {
    setResumeData((d) => (d ? updater(d) : d));
    setDirty(true);
  };

  const saveEdits = async () => {
    if (!selected || !cleanData) return;
    setSaving(true);
    const text = resumeToPlainText(cleanData);
    const after = liveScore ?? selected.after_score;
    const update = {
      optimized_text: serializeOptimizedPayload({ text, structured: { ...cleanData, changes_made: changes }, suggestions, mode: payloadMode }),
      after_score: after,
      improvement_percentage: after - selected.before_score,
    };
    // RLS silently matches zero rows when the update policy is missing, so check what came back.
    const { data: saved, error } = await supabase.from("optimized_resumes").update(update).eq("id", selected.id).select("id");
    setSaving(false);
    if (error || !saved?.length) {
      toast.error(error ? "Could not save: " + error.message : "Saving edits needs the latest database update. Your edits still apply to exports.");
      return;
    }
    const next = { ...selected, ...update };
    setSelected(next);
    setItems((list) => list.map((i) => (i.id === next.id ? next : i)));
    setResumeData(cleanData);
    setDirty(false);
    toast.success("Edits saved");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { error } = await supabase.from("optimized_resumes").delete().eq("id", pendingDelete.id);
    if (error) {
      toast.error("Could not delete: " + error.message);
      return;
    }
    setItems((list) => list.filter((i) => i.id !== pendingDelete.id));
    if (selected?.id === pendingDelete.id) {
      setSelected(null);
      setResumeData(null);
      setDirty(false);
    }
    setPendingDelete(null);
    toast.success("Optimization deleted");
  };

  const baseName = () => {
    const name = (cleanData?.contact.name || "resume").trim().replace(/[^\w-]+/g, "-").replace(/-+/g, "-").toLowerCase();
    return `${name}-${selected?.job_role ?? "resume"}`;
  };

  const runExport = async (kind: string, fn: () => Promise<void> | void) => {
    if (!cleanData || exporting) return;
    if (placeholderCount > 0 && !window.confirm(`Your resume still has ${placeholderCount} [X] placeholder(s). Export anyway?`)) return;
    setExporting(kind);
    try {
      await fn();
      toast.success("Downloaded ✓");
    } catch (e) {
      toast.error("Export failed: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setExporting(null);
    }
  };

  const exportAtsPdf = () => runExport("ats", async () => {
    if (hasNonLatinText(cleanData!)) {
      toast.warning("Some characters aren't supported by the ATS PDF font — use the Word export for non-Latin text.");
    }
    await downloadAtsPdf(cleanData!, `${baseName()}.pdf`);
  });
  const exportDesignPdf = () => runExport("design", () => downloadResumePDF(resumeToPlainText(cleanData!), cleanData, template, `${baseName()}-${template}.pdf`));
  const exportDocx = () => runExport("docx", () => downloadDocx(cleanData!, `${baseName()}.docx`));
  const exportTxt = () => runExport("txt", () => downloadText(cleanData!, `${baseName()}.txt`));
  const copyText = async () => {
    if (!cleanData) return;
    await navigator.clipboard.writeText(resumeToPlainText(cleanData));
    toast.success("Copied to clipboard");
  };

  const delta = (i: Pick<Item, "after_score" | "before_score">) => i.after_score - i.before_score;
  // The saved score is authoritative; the live re-score only takes over once the user edits.
  const shownScore = selected ? (dirty && liveScore !== null ? liveScore : selected.after_score) : 0;
  const shownDelta = selected ? shownScore - selected.before_score : 0;
  const deltaLabel = (d: number) => (d > 0 ? `+${d} pts` : d === 0 ? "±0 pts" : `${d} pts`);

  const tabs: { id: Tab; label: string }[] = [
    { id: "changes", label: `Changes (${changes.length})` },
    { id: "edit", label: dirty ? "Edit •" : "Edit" },
    { id: "preview", label: "Preview" },
    { id: "download", label: "Export" },
  ];

  return (
    <DashboardLayout>
      <Seo title="Optimizations — AI Resume Builder" description="Review, edit and export AI-optimized versions of your resume as ATS-friendly PDF, Word or text." path="/dashboard/optimizations" />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl mb-1">Optimized Resumes</h1>
          <p className="text-muted-foreground text-sm">Review every change, fill in placeholders, and export ATS-readable PDF, Word or text.</p>
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
            <ul className="space-y-2" aria-label="Optimizations">
              {items.map((item) => {
                const isActive = selected?.id === item.id;
                const d = delta(item);
                return (
                  <li key={item.id} className="relative group">
                    <button
                      onClick={() => selectItem(item)}
                      aria-current={isActive}
                      className={`w-full text-left rounded-xl p-4 transition-all duration-300 border ${
                        isActive ? "glass border-primary/50 shadow-lg shadow-primary/10" : "glass-hover border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 pr-6">
                        <span className="text-xs text-muted-foreground font-mono">{formatDate(item.created_at)}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold ${d > 0 ? "text-accent" : "text-muted-foreground"}`}>
                          <TrendingUp className="w-3 h-3" /> {deltaLabel(d)}
                        </span>
                      </div>
                      <p className="font-heading font-bold text-sm mb-2">{formatRole(item.job_role)}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-bold ${gradeColor(computeGrade(item.before_score))}`}>{item.before_score}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className={`font-bold ${gradeColor(computeGrade(item.after_score))}`}>{item.after_score}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setPendingDelete(item)}
                      aria-label={`Delete optimization for ${formatRole(item.job_role)}`}
                      className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground opacity-60 hover:opacity-100 hover:text-destructive focus:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Right: detail */}
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 min-w-0">
                  {/* Score */}
                  <div className="glass rounded-2xl p-6 border border-accent/20">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <h2 className="font-heading font-bold text-lg">ATS Score</h2>
                      <div className={`flex items-center gap-2 font-heading font-bold text-xl ${shownDelta > 0 ? "text-accent" : "text-muted-foreground"}`}>
                        <TrendingUp className="w-5 h-5" /> {deltaLabel(shownDelta)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Original</p>
                        <p className="font-heading font-bold text-2xl">{selected.before_score}</p>
                      </div>
                      <div className="h-[2px] bg-gradient-to-r from-destructive via-primary to-accent rounded-full" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">{dirty ? "Current (unsaved)" : "Optimized"}</p>
                        <p className="font-heading font-bold text-2xl text-accent">{shownScore}</p>
                      </div>
                    </div>
                    {placeholderCount > 0 && (
                      <button onClick={() => setActiveTab("edit")} className="mt-4 w-full flex items-center gap-2 text-left text-xs rounded-lg px-3 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {placeholderCount} [X] placeholder{placeholderCount === 1 ? "" : "s"} to fill in with your real numbers — open the editor
                      </button>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="glass rounded-xl p-1 grid grid-cols-4 gap-1" role="tablist">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2.5 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all ${
                          activeTab === tab.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {loadingDetail || !resumeData ? (
                    <div className="glass rounded-2xl p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : (
                    <>
                      {activeTab === "changes" && (
                        <div className="space-y-3">
                          {suggestions.length > 0 && (
                            <div className="glass rounded-xl p-4 border border-primary/20">
                              <p className="text-sm font-heading font-bold flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-primary" /> Add these only if they're true</p>
                              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                                {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                          {changes.length === 0 ? (
                            <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
                              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              No tracked changes available for this optimization.
                            </div>
                          ) : (
                            changes.map((change, i) => {
                              const ct = changeTypes[change.type] ?? { label: change.type, icon: Check, color: "text-muted-foreground" };
                              const Icon = ct.icon;
                              return (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 15) * 0.03 }} className="glass rounded-xl p-4 border border-glass-border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-4 h-4 ${ct.color}`} />
                                    <span className={`text-xs font-bold ${ct.color}`}>{ct.label}</span>
                                    <span className="text-xs text-muted-foreground ml-auto truncate">{change.location}</span>
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

                      {activeTab === "edit" && (
                        <div className="glass rounded-2xl p-5 space-y-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><PencilLine className="w-4 h-4" /> Replace every <span className="font-mono">[X]</span> with your real figures. One bullet per line.</p>
                            <button onClick={saveEdits} disabled={!dirty || saving} className="btn-primary !text-sm !py-2 !px-4 flex items-center gap-2 disabled:opacity-50 shrink-0">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                            </button>
                          </div>
                          <div>
                            <label htmlFor="edit-summary" className="text-xs text-muted-foreground mb-1 block">Summary</label>
                            <textarea id="edit-summary" rows={4} className={inputClass} value={resumeData.summary ?? ""} onChange={(e) => edit((d) => ({ ...d, summary: e.target.value }))} />
                          </div>
                          {resumeData.experience.map((exp, i) => (
                            <div key={i}>
                              <label htmlFor={`edit-exp-${i}`} className="text-xs text-muted-foreground mb-1 block">
                                <span className="text-foreground font-medium">{exp.role}</span> — {exp.company} <span className="font-mono">({exp.duration})</span>
                              </label>
                              <textarea
                                id={`edit-exp-${i}`}
                                rows={Math.min(10, Math.max(3, exp.responsibilities.length + 1))}
                                className={inputClass}
                                value={exp.responsibilities.join("\n")}
                                onChange={(e) => edit((d) => ({
                                  ...d,
                                  experience: d.experience.map((x, j) => (j === i ? { ...x, responsibilities: e.target.value.split("\n") } : x)),
                                }))}
                              />
                            </div>
                          ))}
                          {resumeData.projects.map((p, i) => (
                            <div key={i}>
                              <label htmlFor={`edit-proj-${i}`} className="text-xs text-muted-foreground mb-1 block">Project — <span className="text-foreground font-medium">{p.name}</span></label>
                              <textarea id={`edit-proj-${i}`} rows={3} className={inputClass} value={p.description} onChange={(e) => edit((d) => ({
                                ...d, projects: d.projects.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                              }))} />
                            </div>
                          ))}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="edit-skills" className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
                              <textarea id="edit-skills" rows={3} className={inputClass} value={resumeData.skills.join(", ")} onChange={(e) => edit((d) => ({ ...d, skills: e.target.value.split(",").map((s) => s.trimStart()) }))} />
                            </div>
                            <div>
                              <label htmlFor="edit-tools" className="text-xs text-muted-foreground mb-1 block">Tools (comma-separated)</label>
                              <textarea id="edit-tools" rows={3} className={inputClass} value={resumeData.tools.join(", ")} onChange={(e) => edit((d) => ({ ...d, tools: e.target.value.split(",").map((s) => s.trimStart()) }))} />
                            </div>
                          </div>
                          {originalText && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer select-none">Show original resume text for reference</summary>
                              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] max-h-72 overflow-auto glass rounded-lg p-3">{originalText}</pre>
                            </details>
                          )}
                        </div>
                      )}

                      {activeTab === "preview" && (
                        <div className="glass rounded-2xl overflow-hidden">
                          <div className="px-5 py-3 border-b border-glass-border flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-heading font-bold text-sm">Live Preview</span>
                            </div>
                            <label className="sr-only" htmlFor="preview-template">Template</label>
                            <select id="preview-template" value={template} onChange={(e) => setTemplate(e.target.value as ResumeTemplate)} className="bg-background border border-glass-border rounded-md px-2 py-1 text-xs">
                              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                          <div className="bg-muted/30 p-4 overflow-auto">
                            <div
                              ref={previewWrapRef}
                              style={{ width: "100%", height: scaledHeight ? `${scaledHeight}px` : "auto", position: "relative", background: "#fff", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
                            >
                              <div
                                ref={resumeRef}
                                style={{ width: "794px", transformOrigin: "top left", transform: `scale(${scale})`, background: "#fff" }}
                                // All resume values are HTML-escaped by the template renderer.
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "download" && (
                        <div className="space-y-4">
                          <div className="glass rounded-2xl p-5">
                            <h3 className="font-heading font-bold text-sm mb-1">Recommended for online applications</h3>
                            <p className="text-xs text-muted-foreground mb-4">Real, selectable text in a single-column layout that every ATS parses correctly.</p>
                            <div className="grid sm:grid-cols-2 gap-2">
                              <button onClick={exportAtsPdf} disabled={!!exporting} className="btn-primary !text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {exporting === "ats" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType className="w-4 h-4" />} ATS PDF
                              </button>
                              <button onClick={exportDocx} disabled={!!exporting} className="glass rounded-xl px-4 py-3 text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-glass-hover disabled:opacity-50">
                                {exporting === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode2 className="w-4 h-4" />} Word (.docx)
                              </button>
                              <button onClick={exportTxt} disabled={!!exporting} className="glass rounded-xl px-4 py-3 text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-glass-hover disabled:opacity-50">
                                <FileText className="w-4 h-4" /> Plain text (.txt)
                              </button>
                              <button onClick={copyText} className="glass rounded-xl px-4 py-3 text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-glass-hover">
                                <Copy className="w-4 h-4" /> Copy text
                              </button>
                            </div>
                          </div>

                          <div className="glass rounded-2xl p-5">
                            <h3 className="font-heading font-bold text-sm mb-1">Designed PDF</h3>
                            <p className="text-xs text-muted-foreground mb-4">Pixel-perfect visual templates for emailing or printing. Rendered as an image, so use the ATS PDF for job portals.</p>
                            <div className="grid grid-cols-2 gap-2 mb-4" role="radiogroup" aria-label="Template">
                              {templates.map((t) => (
                                <button
                                  key={t.id}
                                  role="radio"
                                  aria-checked={template === t.id}
                                  onClick={() => setTemplate(t.id)}
                                  className={`rounded-xl p-3 text-left transition-all border ${template === t.id ? "border-primary bg-primary/10" : "border-transparent glass hover:bg-glass-hover"}`}
                                >
                                  <p className="font-heading font-bold text-sm">{t.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                                </button>
                              ))}
                            </div>
                            <button onClick={exportDesignPdf} disabled={!!exporting} className="glass rounded-xl w-full px-4 py-3 text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-glass-hover disabled:opacity-50">
                              {exporting === "design" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download {templates.find((t) => t.id === template)?.name} PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <Eye className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">Select an optimization to review, edit and export</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this optimization?</AlertDialogTitle>
            <AlertDialogDescription>The optimized version and your edits will be removed. Your original resume and analysis are kept.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive-solid text-destructive-foreground hover:bg-destructive-solid/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
