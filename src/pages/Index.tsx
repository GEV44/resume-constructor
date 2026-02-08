import { useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import DemoPrediction from "@/components/DemoPrediction";
import WhyDifferent from "@/components/WhyDifferent";
import UploadSection from "@/components/UploadSection";
import FinalCTA from "@/components/FinalCTA";
import SiteFooter from "@/components/SiteFooter";
import LoadingOverlay from "@/components/LoadingOverlay";
import ResultsModal from "@/components/ResultsModal";
import { generateResults, type PredictionResult } from "@/lib/predictions";

const Index = () => {
  const howRef = useRef<HTMLElement>(null);
  const uploadRef = useRef<HTMLElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToHow = useCallback(() => {
    howRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const analyzeResume = useCallback(() => {
    if (!selectedFile) { alert("Please upload your resume first."); return; }
    if (!selectedRole) { alert("Please select a target role."); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResult(generateResults(selectedRole));
    }, 5000);
  }, [selectedFile, selectedRole]);

  return (
    <div className="min-h-screen bg-animated-gradient">
      <Navbar onHowItWorks={scrollToHow} />
      <HeroSection onCTA={scrollToUpload} />
      <HowItWorks ref={howRef} />
      <DemoPrediction />
      <WhyDifferent />
      <UploadSection
        ref={uploadRef}
        selectedFile={selectedFile}
        selectedRole={selectedRole}
        onFileSelect={setSelectedFile}
        onRoleSelect={setSelectedRole}
        onAnalyze={analyzeResume}
      />
      <FinalCTA onCTA={scrollToUpload} />
      <SiteFooter />
      <LoadingOverlay visible={isLoading} />
      {result && <ResultsModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default Index;
