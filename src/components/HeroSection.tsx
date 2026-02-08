import { motion } from "framer-motion";

const HeroSection = ({ onCTA }: { onCTA: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center section-padding pt-32">
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            AI-Powered Career Intelligence
          </span>
        </motion.div>

        <motion.h1
          className="font-heading font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <span className="gradient-text">Will You Get</span>
          <br />
          The Offer?
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          Upload your resume and let AI predict your hackathon success probability with precision analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <button onClick={onCTA} className="btn-primary text-base md:text-lg">
            📄 Upload Resume & Get Prediction
          </button>
          <p className="text-sm text-muted-foreground mt-5">
            ✓ AI-powered analysis based on ML signals, skills match & positioning strength
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
