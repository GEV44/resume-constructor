import { motion, AnimatePresence } from "framer-motion";
import type { PredictionResult } from "@/lib/predictions";

interface Props {
  result: PredictionResult | null;
  onClose: () => void;
}

const ResultsModal = ({ result, onClose }: Props) => {
  if (!result) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-background/80 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass rounded-3xl p-8 md:p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[1002] w-10 h-10 rounded-full glass flex items-center justify-center
                       text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:rotate-90 transition-all duration-400"
          >
            ×
          </button>

          {/* Score */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-sm mb-3">Your Offer Probability</p>
            <p className="font-heading font-black text-6xl md:text-7xl gradient-text tracking-tight">{result.score}%</p>
            <div className="progress-bar-container relative bg-muted rounded-full overflow-hidden my-5">
              <motion.div
                className="progress-bar-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-destructive via-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${result.score}%` }}
                transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
            <p className="text-muted-foreground text-sm">{result.interpretation}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-heading font-bold text-accent mb-3">✓ Strengths</h4>
              <ul className="space-y-2 text-sm">
                {result.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-accent">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-destructive mb-3">⚠ Areas to Improve</h4>
              <ul className="space-y-2 text-sm">
                {result.weaknesses.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-destructive">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass rounded-xl p-5 border border-accent/20">
            <h4 className="font-heading font-bold text-accent mb-3">💡 Recommendations</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {result.recommendations.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="text-accent">→</span>{r}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResultsModal;
