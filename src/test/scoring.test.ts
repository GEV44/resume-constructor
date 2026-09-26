import { describe, it, expect } from "vitest";
import { scoreResume, extractJobKeywords, matchJobDescription, textGrams, type ParsedResume } from "@/lib/scoring";
import { JOB_ROLES, getJobRoleById } from "@/lib/job-roles";

const strongDataScientist: ParsedResume = {
  contact: { name: "Ada Lovelace", email: "ada@example.com" },
  summary: "Data scientist building data-driven insights and predictive modeling.",
  skills: ["Python", "SQL", "Statistics", "Machine Learning", "Data Analysis", "Pandas", "NumPy", "PyTorch", "Tableau"],
  tools: ["Spark"],
  experience: [
    {
      company: "Acme",
      role: "Data Scientist",
      duration: "2021 – 2025",
      years: 4,
      responsibilities: [
        "Built churn prediction model that reduced churn by 18% across 2M users",
        "Ran A/B testing program for 40+ experiments, lifting conversion 12%",
        "Delivered analytics dashboards used by 300 stakeholders",
      ],
    },
  ],
  projects: [
    { name: "Forecasting", description: "Demand forecasting with PyTorch, improved accuracy by 22%", technologies: ["PyTorch", "Python"] },
    { name: "NLP", description: "Topic modeling on 1M reviews", technologies: ["Python", "Spark"] },
  ],
  education: [{ degree: "MSc", institution: "UCL", year: "2020", field: "Statistics" }],
  certifications: ["AWS ML Specialty"],
  total_years_experience: 4,
  quantified_metrics: ["18%", "2M", "12%", "40+", "300", "22%"],
};

describe("job roles", () => {
  it("defines 36 roles with unique ids and weights that sum to 100", () => {
    expect(JOB_ROLES).toHaveLength(36);
    expect(new Set(JOB_ROLES.map((r) => r.id)).size).toBe(36);
    for (const role of JOB_ROLES) {
      const w = role.scoring_weights;
      expect(w.skills + w.experience + w.projects + w.education + w.impact_metrics).toBe(100);
    }
  });
});

describe("scoreResume", () => {
  it("is deterministic", () => {
    const a = scoreResume(strongDataScientist, "data-scientist", "");
    const b = scoreResume(structuredClone(strongDataScientist), "data-scientist", "");
    expect(a).toEqual(b);
  });

  it("scores a strong, relevant resume highly and a thin one poorly", () => {
    const strong = scoreResume(strongDataScientist, "data-scientist");
    const thin = scoreResume({ skills: ["Excel"], experience: [], education: [] }, "data-scientist");
    expect(strong.overall_score).toBeGreaterThanOrEqual(80);
    expect(strong.missing_skills).toEqual([]);
    expect(thin.overall_score).toBeLessThan(20);
    expect(thin.grade).toBe("F");
    expect(thin.missing_skills).toContain("Python");
  });

  it("stays within 0–100 for every role", () => {
    for (const role of JOB_ROLES) {
      const r = scoreResume(strongDataScientist, role.id);
      for (const v of [r.overall_score, r.skill_score, r.experience_score, r.project_score, r.education_score, r.impact_score]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("matches aliases and skills mentioned only in the text", () => {
    const r = scoreResume({ skills: ["JS", "TS", "React", "HTML", "CSS"], experience: [{ responsibilities: ["Versioned everything in Git"] }] }, "frontend-engineer");
    expect(r.missing_skills).toEqual([]);
  });

  it("does not match ambiguous short skills from free text", () => {
    const withText = scoreResume({ skills: [], summary: "Ready to go the extra mile" }, "backend-engineer");
    expect(withText.matched_skills).not.toContain("Go");
    const listed = scoreResume({ skills: ["Go"] }, "backend-engineer");
    expect(listed.matched_skills).toContain("Go");
  });

  it("does not treat unrelated fields as relevant education (no 'cs' in 'physics' style substring hits)", () => {
    const role = getJobRoleById("accountant")!;
    const lit = scoreResume({ education: [{ degree: "Bachelor of Arts", field: "Literature" }] }, role.id);
    const acc = scoreResume({ education: [{ degree: "Bachelor of Science", field: "Accounting" }] }, role.id);
    expect(acc.education_score).toBeGreaterThan(lit.education_score);
  });

  it("throws for an unknown role", () => {
    expect(() => scoreResume(strongDataScientist, "astronaut")).toThrow(/Unknown job role/);
  });

  it("blends in the job-description match when provided", () => {
    const jd = "We need a Data Scientist with Python, SQL, Snowflake, dbt and Looker. Experience with Snowflake and dbt is a must.";
    const withJd = scoreResume(strongDataScientist, "data-scientist", "", jd);
    expect(withJd.job_match).not.toBeNull();
    expect(withJd.job_match!.missing).toEqual(expect.arrayContaining(["Snowflake", "dbt"]));
    expect(withJd.job_match!.matched).toEqual(expect.arrayContaining(["Python", "SQL"]));
    expect(withJd.overall_score).toBeLessThan(scoreResume(strongDataScientist, "data-scientist").overall_score);
  });
});

describe("extractJobKeywords", () => {
  it("ranks repeated hard skills first and ignores filler words and company names", () => {
    const jd = `About Globex
Globex is hiring a Senior Backend Engineer. You will build APIs in Go and Python on AWS.
Requirements: Kubernetes, Kubernetes operators, PostgreSQL, Redis, gRPC and Terraform. Kubernetes experience is essential.
Nice to have: Next.js, GraphQL.`;
    const kws = extractJobKeywords(jd);
    expect(kws[0]).toBe("Kubernetes");
    expect(kws).toEqual(expect.arrayContaining(["Go", "Python", "AWS", "PostgreSQL", "Redis", "gRPC", "Terraform", "Next.js", "GraphQL"]));
    expect(kws).not.toContain("Globex");
    expect(kws.map((k) => k.toLowerCase())).not.toContain("requirements");
  });

  it("returns nothing for an empty description", () => {
    expect(extractJobKeywords("   ")).toEqual([]);
    expect(matchJobDescription(strongDataScientist, "", "")).toBeNull();
  });
});

describe("textGrams", () => {
  it("joins multi-word and punctuated terms", () => {
    const grams = textGrams("Shipped Node.js services with CI/CD and A/B testing");
    expect(grams.has("nodejs")).toBe(true);
    expect(grams.has("cicd")).toBe(true);
    expect(grams.has("abtesting")).toBe(true);
  });
});
