import { motion } from "framer-motion";
import { forwardRef, useState, useRef, DragEvent, ChangeEvent } from "react";

interface Props {
  selectedFile: File | null;
  selectedRole: string;
  onFileSelect: (file: File | null) => void;
  onRoleSelect: (role: string) => void;
  onAnalyze: () => void;
}

const roles = [
  { value: "", label: "Select your target role..." },
  { value: "ml-engineer", label: "🤖 ML Engineer" },
  { value: "data-scientist", label: "📊 Data Scientist" },
  { value: "ai-product", label: "🚀 AI Product Builder" },
  { value: "marketing-ai", label: "📢 Marketing AI Creator" },
];

const UploadSection = forwardRef<HTMLElement, Props>(
  ({ selectedFile, selectedRole, onFileSelect, onRoleSelect, onAnalyze }, ref) => {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be under 5MB.");
        return;
      }
      onFileSelect(file);
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return bytes + " B";
      return (bytes / 1024).toFixed(1) + " KB";
    };

    return (
      <section ref={ref} className="section-padding">
        <div className="container mx-auto max-w-xl">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">
              Ready to <span className="gradient-text-cyan">Discover</span> Your Edge?
            </h2>
          </motion.div>

          {/* Role selector */}
          <motion.div className="mb-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <label className="text-sm text-muted-foreground mb-2 block">What role are you targeting?</label>
            <select
              value={selectedRole}
              onChange={(e) => onRoleSelect(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 bg-transparent text-foreground appearance-none
                         focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value} className="bg-card text-foreground">
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-2">💡 Prediction adapts based on role-specific success patterns</p>
          </motion.div>

          {/* Upload zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {!selectedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                  ${dragOver ? "border-accent scale-[1.02] bg-accent/5" : "border-glass-border hover:border-muted-foreground"}`}
              >
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={onChange} />
                <span className="text-5xl block mb-4">📁</span>
                <p className="font-heading font-bold text-lg mb-1">Drop Your Resume Here</p>
                <p className="text-muted-foreground text-sm mb-4">or click to browse (PDF only, max 5MB)</p>
                <span className="inline-block glass rounded-lg px-4 py-2 text-sm text-muted-foreground">Choose File</span>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 border border-accent/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => onFileSelect(null)}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    ×
                  </button>
                </div>
                <button onClick={onAnalyze} className="btn-primary w-full text-center">
                  🚀 Analyze My Resume
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    );
  }
);

UploadSection.displayName = "UploadSection";
export default UploadSection;
