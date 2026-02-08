export interface PredictionResult {
  score: number;
  interpretation: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const roleData: Record<string, { range: [number, number]; strengths: string[]; weaknesses: string[]; recommendations: string[] }> = {
  "ml-engineer": {
    range: [70, 90],
    strengths: [
      "Strong Python/ML framework proficiency",
      "Deep learning project experience",
      "Solid architecture & system design skills",
      "MLOps & deployment awareness",
    ],
    weaknesses: [
      "Limited production deployment examples",
      "Missing quantified performance metrics",
      "Scalability considerations unclear",
      "Generic project descriptions",
    ],
    recommendations: [
      "Add accuracy/F1 scores to all ML projects",
      "Include production scale & traffic numbers",
      "Detail infrastructure & cloud deployment",
      "Highlight optimization results with before/after",
    ],
  },
  "data-scientist": {
    range: [65, 85],
    strengths: [
      "Strong statistical analysis foundation",
      "Clear business impact articulation",
      "Comprehensive tool & tech stack",
      "Analytical problem-solving approach",
    ],
    weaknesses: [
      "Missing quantified business outcomes",
      "Hypothesis formation not highlighted",
      "A/B testing experience unclear",
      "Technical-to-business communication gap",
    ],
    recommendations: [
      "Quantify impact with $X revenue or Y% improvement",
      "Showcase end-to-end analysis workflows",
      "Translate findings to business strategy",
      "Add data visualization portfolio pieces",
    ],
  },
  "ai-product": {
    range: [72, 90],
    strengths: [
      "Product thinking meets technical depth",
      "Tech + business balance evident",
      "User-centric design approach",
      "Innovation & experimentation mindset",
    ],
    weaknesses: [
      "Go-to-market strategy missing",
      "Competitive analysis not demonstrated",
      "User research depth unclear",
      "Success metrics not defined",
    ],
    recommendations: [
      "Add adoption metrics & user growth numbers",
      "Include launch case studies with outcomes",
      "Show ideation → launch pipeline process",
      "Highlight leadership & cross-functional work",
    ],
  },
  "marketing-ai": {
    range: [68, 88],
    strengths: [
      "Creative AI application skills",
      "Audience targeting & segmentation",
      "Content strategy & planning",
      "Growth mindset & experimentation",
    ],
    weaknesses: [
      "Campaign performance data missing",
      "AI tool proficiency not detailed",
      "Brand positioning unclear",
      "Funnel optimization not shown",
    ],
    recommendations: [
      "List AI tools used with measurable results",
      "Add conversion rates & campaign ROI",
      "Show audience segmentation wins",
      "Include content velocity & engagement metrics",
    ],
  },
};

export function generateResults(role: string): PredictionResult {
  const data = roleData[role] || roleData["ml-engineer"];
  const [min, max] = data.range;
  const score = Math.floor(Math.random() * (max - min + 1)) + min;

  let interpretation: string;
  if (score >= 85) interpretation = "Excellent positioning — you're a strong contender!";
  else if (score >= 75) interpretation = "Solid profile with room for strategic improvements.";
  else if (score >= 70) interpretation = "Good foundation, but key gaps could hold you back.";
  else interpretation = "Potential is there, but significant improvements needed.";

  return {
    score,
    interpretation,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    recommendations: data.recommendations,
  };
}
