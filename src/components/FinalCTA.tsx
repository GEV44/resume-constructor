import { motion } from "framer-motion";

const FinalCTA = ({ onCTA }: { onCTA: () => void }) => (
  <section className="section-padding">
    <div className="container mx-auto text-center">
      <div className="h-px w-40 mx-auto mb-16 bg-gradient-to-r from-transparent via-accent to-transparent" />

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Test Your Edge</h2>
        <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-8 gradient-text-pink">Before They Do</h2>

        <button onClick={onCTA} className="btn-primary mb-6">
          Analyze My Resume Now
        </button>

        <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-sm text-destructive border border-destructive/30 animate-pulse-glow">
          ⏰ Hackathon starts soon. Be ready.
        </div>
      </motion.div>
    </div>
  </section>
);

export default FinalCTA;
