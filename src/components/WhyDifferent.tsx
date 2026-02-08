import { motion } from "framer-motion";

const features = [
  { icon: "🧠", title: "Recruiter Perception AI", text: "Analyzes how recruiters actually think when reviewing resumes under time pressure" },
  { icon: "🎯", title: "Marketing Positioning", text: "Evaluates how you position yourself against competition in your target role" },
  { icon: "⚖️", title: "Hackathon Jury Mindset", text: "Simulates what hackathon judges prioritize: innovation, execution, and team fit" },
];

const WhyDifferent = () => (
  <section className="section-padding">
    <div className="container mx-auto">
      <motion.div className="text-center mb-20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: [0.4, 0, 0.2, 1] }}>
        <h2 className="mb-4">
          Not Another <span className="gradient-text-pink">Resume Checker</span>
        </h2>
        <p className="text-muted-foreground text-lg">We simulate real decision-making psychology</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-hover rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="text-5xl mb-5 block">{f.icon}</span>
            <h3 className="font-heading font-bold text-xl mb-3">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyDifferent;
