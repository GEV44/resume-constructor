import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const steps = [
  "Parsing resume structure",
  "Extracting technical skills",
  "Evaluating ML experience",
  "Analyzing positioning strength",
  "Calculating probability score",
];

const LoadingOverlay = ({ visible }: { visible: boolean }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!visible) { setActiveStep(0); return; }
    const timers = steps.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * 900)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/85 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            {/* Spinner */}
            <div className="w-18 h-18 mx-auto mb-8 rounded-full border-4 border-muted border-t-accent border-r-primary animate-spin-slow" 
                 style={{ width: '4.5rem', height: '4.5rem' }} />
            <p className="font-heading font-extrabold text-2xl mb-2 tracking-tight">Analyzing Your Positioning...</p>
            <p className="text-muted-foreground text-sm mb-10">This may take a few seconds</p>

            <div className="space-y-4 text-left max-w-xs mx-auto">
              {steps.map((step, i) => (
                <motion.div
                  key={step}
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={i <= activeStep ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-400 ${
                    i <= activeStep ? "bg-accent border-accent shadow-[0_0_8px_hsl(var(--accent)/0.5)]" : "border-muted-foreground"
                  }`} />
                  <span className={`transition-colors duration-400 ${i <= activeStep ? "text-accent font-medium" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
