import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { JOB_ROLES, JOB_ROLE_CATEGORIES } from "@/lib/job-roles";
import { toast } from "sonner";
import { Upload, X, FileText, Loader2 } from "lucide-react";

export default function UploadResume() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");

  const handleFile = (f: File) => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(f.type)) { toast.error("Please upload a PDF or DOCX file."); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB."); return; }
    setFile(f);
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };

  const analyze = async () => {
    if (!file) { toast.error("Please upload your resume."); return; }
    if (!jobRole) { toast.error("Please select a target role."); return; }
    if (!user) return;

    setLoading(true);
    try {
      // Step 1: Upload file
      setStep("Uploading resume...");
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file);
      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      // Step 2: Parse with AI
      setStep("Parsing resume with AI...");
      const parseResponse = await supabase.functions.invoke("parse-resume", {
        body: { filePath, fileName: file.name },
      });
      
      // Handle edge function errors properly
      if (parseResponse.error) {
        const errMsg = typeof parseResponse.error === 'object' && parseResponse.error.message 
          ? parseResponse.error.message 
          : String(parseResponse.error);
        throw new Error("Parse failed: " + errMsg);
      }
      
      const parseData = parseResponse.data;
      if (!parseData || parseData.error) {
        throw new Error(parseData?.error || "Failed to parse resume. Please try a different file.");
      }

      const parsedResume = parseData.parsed;
      const originalText = parseData.text || "";

      if (!parsedResume) {
        throw new Error("Could not extract data from resume. Please try a different file format.");
      }

      // Step 3: Save resume to DB
      setStep("Saving resume...");
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
      if (resumeError) throw new Error("Save failed: " + resumeError.message);

      // Step 4: Score
      setStep("Calculating score...");
      const scoreResponse = await supabase.functions.invoke("score-resume", {
        body: { parsed: parsedResume, jobRoleId: jobRole, resumeText: originalText, resumeId: resumeRow.id },
      });

      if (scoreResponse.error) {
        const errMsg = typeof scoreResponse.error === 'object' && scoreResponse.error.message 
          ? scoreResponse.error.message 
          : String(scoreResponse.error);
        throw new Error("Scoring failed: " + errMsg);
      }

      const scoreData = scoreResponse.data;
      if (!scoreData || scoreData.error) {
        throw new Error(scoreData?.error || "Failed to score resume.");
      }

      toast.success(`Analysis complete! Score: ${scoreData.overall_score}%`);
      navigate(`/dashboard/analysis/${scoreData.analysisId}`);
    } catch (err: any) {
      console.error("Resume analysis error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">Upload Resume</h1>
        <p className="text-muted-foreground mb-8">Upload your resume and select a target role for analysis.</p>

        {/* Role selector */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Target Job Role</label>
          <select
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
          >
            <option value="" className="bg-card text-foreground">Select a role...</option>
            {JOB_ROLE_CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat} className="bg-card text-foreground">
                {JOB_ROLES.filter((r) => r.category === cat).map((r) => (
                  <option key={r.id} value={r.id} className="bg-card text-foreground">{r.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Upload zone */}
        {!file ? (
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            className={`upload-zone border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer ${
              dragOver ? "drag-over border-accent bg-accent/5" : "border-glass-border hover:border-muted-foreground"
            }`}
          >
            <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={onChange} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-heading font-bold text-lg mb-1">Drop Your Resume Here</p>
            <p className="text-muted-foreground text-sm">PDF or DOCX, max 5MB</p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 border border-accent/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-accent" />
                <div>
                  <p className="font-bold text-sm font-mono">{file.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="p-2 rounded-full glass hover:text-destructive transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button onClick={analyze} disabled={loading} className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step}
                </>
              ) : (
                <>🚀 Analyze My Resume</>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
