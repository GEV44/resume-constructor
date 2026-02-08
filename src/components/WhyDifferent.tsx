import { motion } from "framer-motion";

const features = [
  { icon: "🧠", title: "Recruiter Perception AI", text: "Analyzes how recruiters actually think when reviewing resumes under time pressure" },
  { icon: "🎯", title: "Marketing Positioning", text: "Evaluates how you position yourself against competition in your target role" },
  { icon: "⚖️", title: "Hackathon Jury Mindset", text: "Simulates what hackathon judges prioritize: innovation, execution, and team fit" },
];

const WhyDifferent = () => (
  <section className="section-padding">
    <div className="container mx-auto">
      <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">
          Not Another <span className="gradient-text-pink">Resume Checker</span>
        </h2>
        <p className="text-muted-foreground text-lg">We simulate real decision-making psychology</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-hover rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
          >
            <span className="text-4xl mb-4 block">{f.icon}</span>
            <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyDifferent;
