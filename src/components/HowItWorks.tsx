import { motion } from "framer-motion";
import { forwardRef } from "react";

const cards = [
  {
    num: 1,
    icon: "📤",
    title: "Upload Your CV",
    desc: "Drop your resume in PDF format and select your target role",
  },
  {
    num: 2,
    icon: "🔍",
    title: "AI Deep Analysis",
    desc: "Our AI analyzes multiple dimensions:",
    bullets: ["Technical skills depth", "ML experience & projects", "Professional positioning", "Content clarity & structure", "Impact metrics & results"],
  },
  {
    num: 3,
    icon: "📊",
    title: "Get Your Results",
    desc: "Receive comprehensive insights:",
    bullets: ["Offer probability score (0–100%)", "Detailed strengths analysis", "Weakness breakdown", "Actionable improvement tips"],
  },
];

const HowItWorks = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="section-padding">
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">
            How It <span className="gradient-text-cyan">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">Three simple steps to unlock your potential</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.num}
              className="glass-hover rounded-2xl p-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="number-badge">{c.num}</div>
                <span className="text-3xl">{c.icon}</span>
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">{c.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{c.desc}</p>
              {c.bullets && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

HowItWorks.displayName = "HowItWorks";
export default HowItWorks;
