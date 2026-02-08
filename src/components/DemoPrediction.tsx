import { motion } from "framer-motion";

const strengths = ["Strong ML foundation", "Real project experience", "Clear technical positioning", "Relevant tech stack"];
const weaknesses = ["Lack of measurable impact", "Weak business framing", "Generic project descriptions", "Missing leadership signals"];

const DemoPrediction = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: [0.4, 0, 0.2, 1] }}>
          <h2 className="mb-4">
            See What You'll <span className="gradient-text-cyan">Get</span>
          </h2>
          <p className="text-muted-foreground text-lg">Example prediction analysis</p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto glass rounded-3xl prediction-card relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Floating orb */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          <p className="text-muted-foreground text-sm mb-3 text-center">Your Offer Probability</p>
          <p className="text-center font-heading font-black text-6xl md:text-7xl gradient-text mb-8 tracking-tight">74%</p>

          {/* Progress bar */}
          <div className="progress-bar-container relative bg-muted rounded-full overflow-hidden mb-10">
            <div className="progress-bar-fill absolute inset-y-0 left-0 w-[74%] rounded-full bg-gradient-to-r from-destructive via-primary to-accent animate-progress">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h4 className="font-heading font-bold text-accent mb-4 flex items-center gap-2">✓ Strengths</h4>
              <ul className="space-y-3 text-sm">
                {strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-accent">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-destructive mb-4 flex items-center gap-2">⚠ Areas to Improve</h4>
              <ul className="space-y-3 text-sm">
                {weaknesses.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-destructive">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoPrediction;
