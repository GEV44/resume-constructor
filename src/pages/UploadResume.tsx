import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { JOB_ROLES, JOB_ROLE_CATEGORIES } from "@/lib/job-roles";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type StepStatus = "idle" | "active" | "done" | "error";

interface StepInfo {
  label: string;
  status: StepStatus;
}

export default function UploadResume() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [steps, setSteps] = useState<StepInfo[]>([
    { label: "Uploading resume...", status: "idle" },
    { label: "Parsing with AI...", status: "idle" },
    { label: "Saving resume...", status: "idle" },
    { label: "Calculating score...", status: "idle" },
  ]);

  const updateStep = (index: number, status: StepStatus) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)));
  };

  const handleFile = (f: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(f.type)) {
      toast.error("Please upload a PDF or DOCX file only.", {
        description: `"${f.name}" is not a supported format.`,
      });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.", {
        description: `Your file is ${(f.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      return;
    }
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const analyze = async () => {
    if (!file) {
      toast.error("Please upload your resume.");
      return;
    }
    if (!jobRole) {
      toast.error("Please select a target role.");
      return;
    }
    if (!user) return;

    setLoading(true);
    setSteps((prev) => prev.map((s) => ({ ...s, status: "idle" as StepStatus })));

    try {
      // Step 1: Upload
      updateStep(0, "active");
      setUploadProgress(0);
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      // Simulate progress since supabase doesn't expose upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file);
      clearInterval(progressInterval);

      if (uploadError) {
        updateStep(0, "error");
        throw new Error("Upload failed: " + uploadError.message);
      }
      setUploadProgress(100);
      updateStep(0, "done");

      // Step 2: Parse
      updateStep(1, "active");
      const parseResponse = await supabase.functions.invoke("parse-resume", {
        body: { filePath, fileName: file.name },
      });

      if (parseResponse.error) {
        updateStep(1, "error");
        const errMsg =
          typeof parseResponse.error === "object" && parseResponse.error.message
            ? parseResponse.error.message
            : String(parseResponse.error);
        throw new Error("Could not extract text from file. Please check file format. (" + errMsg + ")");
      }

      const parseData = parseResponse.data;
      if (!parseData || parseData.error) {
        updateStep(1, "error");
        throw new Error(parseData?.error || "Resume appears empty. Please upload a different file.");
      }

      const parsedResume = parseData.parsed;
      const originalText = parseData.text || "";

      if (!parsedResume) {
        updateStep(1, "error");
        throw new Error("Could not extract data from resume. Please try a different file format.");
      }
      updateStep(1, "done");

      // Step 3: Save
      updateStep(2, "active");
      const { data: resumeRow, error: resumeError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          original_text: originalText,
          parsed_json: parsedResume,
        })
        .select()
        .single();

      if (resumeError) {
        updateStep(2, "error");
        throw new Error("Save failed: " + resumeError.message);
      }
      updateStep(2, "done");

      // Step 4: Score
      updateStep(3, "active");
      const scoreResponse = await supabase.functions.invoke("score-resume", {
        body: {
          parsed: parsedResume,
          jobRoleId: jobRole,
          resumeText: originalText,
          resumeId: resumeRow.id,
        },
      });

      if (scoreResponse.error) {
        updateStep(3, "error");
        const errMsg =
          typeof scoreResponse.error === "object" && scoreResponse.error.message
            ? scoreResponse.error.message
            : String(scoreResponse.error);
        throw new Error("Analysis failed. Please try again. (" + errMsg + ")");
      }

      const scoreData = scoreResponse.data;
      if (!scoreData || scoreData.error) {
        updateStep(3, "error");
        throw new Error(scoreData?.error || "Analysis failed. Please try again.");
      }

      updateStep(3, "done");
      toast.success(`Analysis complete! Score: ${scoreData.overall_score}%`);
      navigate(`/dashboard/analysis/${scoreData.analysisId}`, {
        state: {
          problems: scoreData.problems || [],
          structure_issues: scoreData.structure_issues || [],
        },
      });
    } catch (err: any) {
      console.error("Resume analysis error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const activeStepIndex = steps.findIndex((s) => s.status === "active");

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">Upload Resume</h1>
        <p className="text-muted-foreground mb-8">
          Upload your resume and select a target role for analysis.
        </p>

        {/* Role selector */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Target Job Role</label>
          <select
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            disabled={loading}
            className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <option value="" className="bg-card text-foreground">
              Select a role...
            </option>
            {JOB_ROLE_CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat} className="bg-card text-foreground">
                {JOB_ROLES.filter((r) => r.category === cat).map((r) => (
                  <option key={r.id} value={r.id} className="bg-card text-foreground">
                    {r.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Upload zone */}
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                }}
                className={`upload-zone border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? "drag-over border-accent bg-accent/5 scale-[1.02]"
                    : "border-glass-border hover:border-muted-foreground hover:bg-glass"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={onChange}
                />
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-heading font-bold text-lg mb-1">Drop Your Resume Here</p>
                <p className="text-muted-foreground text-sm">PDF or DOCX, max 5MB</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass rounded-2xl p-6 border border-accent/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm font-mono">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                {!loading && (
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 rounded-full glass hover:text-destructive transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress steps during loading */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 space-y-2"
                >
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 transition-all duration-300 ${
                        step.status === "active"
                          ? "bg-primary/10 text-foreground"
                          : step.status === "done"
                          ? "text-accent"
                          : step.status === "error"
                          ? "text-destructive"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {step.status === "active" ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : step.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : step.status === "error" ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={step.status === "active" ? "font-medium" : ""}>
                        {step.label}
                      </span>
                    </div>
                  ))}

                  {/* Upload progress bar */}
                  {activeStepIndex === 0 && (
                    <div className="mt-2 px-3">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              <button
                onClick={analyze}
                disabled={loading}
                className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {steps[activeStepIndex]?.label || "Processing..."}
                  </>
                ) : (
                  <>🚀 Analyze My Resume</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
