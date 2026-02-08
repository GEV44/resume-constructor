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
      setTimeout(() => setActiveStep(i), i * 800)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            {/* Spinner */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-muted border-t-accent border-r-primary animate-spin-slow" />
            <p className="font-heading font-bold text-xl mb-1">Analyzing Your Positioning...</p>
            <p className="text-muted-foreground text-sm mb-8">This may take a few seconds</p>

            <div className="space-y-3 text-left max-w-xs mx-auto">
              {steps.map((step, i) => (
                <motion.div
                  key={step}
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={i <= activeStep ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <span className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    i <= activeStep ? "bg-accent border-accent" : "border-muted-foreground"
                  }`} />
                  <span className={i <= activeStep ? "text-accent" : "text-muted-foreground"}>
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
