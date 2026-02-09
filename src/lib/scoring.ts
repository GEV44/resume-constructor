import { getJobRoleById, type JobRole } from "./job-roles";

export interface ParsedResume {
  contact: { name: string; email: string; phone: string };
  education: { degree: string; institution: string; year: string; field: string }[];
  skills: string[];
  tools: string[];
  experience: { company: string; role: string; duration: string; years: number; responsibilities: string[] }[];
  projects: { name: string; description: string; technologies: string[] }[];
  certifications: string[];
  total_years_experience: number;
  quantified_metrics: string[];
}

export interface ScoreResult {
  overall_score: number;
  skill_score: number;
  experience_score: number;
  project_score: number;
  education_score: number;
  impact_score: number;
  grade: string;
  missing_skills: string[];
  strengths: string[];
  recommendations: string[];
}

function normalizeSkill(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

function skillMatch(resumeSkills: string[], requiredSkills: string[], preferredSkills: string[]): { score: number; missing: string[]; matched: string[] } {
  const normalized = resumeSkills.map(normalizeSkill);
  const matchedRequired = requiredSkills.filter((s) => normalized.includes(normalizeSkill(s)));
  const matchedPreferred = preferredSkills.filter((s) => normalized.includes(normalizeSkill(s)));
  const missing = requiredSkills.filter((s) => !normalized.includes(normalizeSkill(s)));

  const requiredScore = requiredSkills.length > 0 ? (matchedRequired.length / requiredSkills.length) * 100 : 0;
  const preferredScore = preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 100 * 0.5 : 0;
  const score = Math.min(100, requiredScore + preferredScore);

  return { score: Math.round(score), missing, matched: [...matchedRequired, ...matchedPreferred] };
}

function experienceScore(totalYears: number, minimumYears: number, resumeText: string, keywords: string[]): number {
  const yearScore = Math.min(totalYears / Math.max(minimumYears, 1), 1.0) * 100;
  const lowerText = resumeText.toLowerCase();
  const keywordMatches = keywords.filter((k) => lowerText.includes(k.toLowerCase())).length;
  const keywordScore = keywords.length > 0 ? (keywordMatches / keywords.length) * 100 * 0.3 : 0;
  return Math.min(100, Math.round(yearScore + keywordScore));
}

function projectScore(projects: ParsedResume["projects"], role: JobRole): number {
  if (projects.length === 0) return 0;
  const allRoleSkills = [...role.required_skills, ...role.preferred_skills].map(normalizeSkill);
  const relevantProjects = projects.filter((p) => {
    const techNorm = p.technologies.map(normalizeSkill);
    return techNorm.some((t) => allRoleSkills.includes(t));
  });
  const relevanceScore = (relevantProjects.length / projects.length) * 100;

  const hasQuantified = projects.some(
    (p) => /\d+%|\$\d|increased|decreased|improved|reduced|achieved/i.test(p.description)
  );
  const quantifiedBonus = hasQuantified ? 40 : 0;

  return Math.min(100, Math.round(relevanceScore + quantifiedBonus * 0.4));
}

function educationScore(education: ParsedResume["education"], requirements: string[]): number {
  if (education.length === 0) return 0;

  let degreeScore = 0;
  for (const edu of education) {
    const degLower = edu.degree.toLowerCase();
    if (degLower.includes("phd") || degLower.includes("doctorate")) degreeScore = Math.max(degreeScore, 100);
    else if (degLower.includes("master")) degreeScore = Math.max(degreeScore, 90);
    else if (degLower.includes("bachelor")) degreeScore = Math.max(degreeScore, 70);
    else if (degLower.includes("associate")) degreeScore = Math.max(degreeScore, 50);
    else degreeScore = Math.max(degreeScore, 30);
  }

  const relevantFields = ["computer science", "cs", "engineering", "mathematics", "statistics", "data", "information technology", "it"];
  const hasRelevantField = education.some((e) => relevantFields.some((f) => e.field.toLowerCase().includes(f)));
  const fieldBonus = hasRelevantField ? 20 : 0;

  return Math.min(100, degreeScore + fieldBonus);
}

function impactScore(metrics: string[]): number {
  const count = Math.min(metrics.length, 5);
  return Math.round((count / 5) * 100);
}

function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function generateStrengths(parsed: ParsedResume, role: JobRole, skills: { matched: string[] }): string[] {
  const strengths: string[] = [];
  if (skills.matched.length >= role.required_skills.length * 0.7) strengths.push("Strong skill match for the role");
  if (parsed.total_years_experience >= role.minimum_years) strengths.push(`${parsed.total_years_experience}+ years of relevant experience`);
  if (parsed.projects.length >= 3) strengths.push("Diverse project portfolio");
  if (parsed.quantified_metrics.length >= 3) strengths.push("Good use of quantified impact metrics");
  if (parsed.certifications.length > 0) strengths.push(`${parsed.certifications.length} relevant certification(s)`);
  if (parsed.education.some((e) => e.degree.toLowerCase().includes("master") || e.degree.toLowerCase().includes("phd")))
    strengths.push("Advanced academic credentials");
  if (strengths.length === 0) strengths.push("Resume has foundational content to build upon");
  return strengths;
}

function generateRecommendations(parsed: ParsedResume, role: JobRole, missingSkills: string[], overallScore: number): string[] {
  const recs: string[] = [];
  if (missingSkills.length > 0) recs.push(`Add missing skills: ${missingSkills.slice(0, 5).join(", ")}`);
  if (parsed.quantified_metrics.length < 3) recs.push("Add more quantified achievements (e.g., percentages, dollar amounts)");
  if (parsed.projects.length < 2) recs.push("Include more relevant projects with detailed descriptions");
  if (parsed.total_years_experience < role.minimum_years) recs.push(`Highlight more experience — role requires ${role.minimum_years}+ years`);
  if (parsed.certifications.length === 0) recs.push("Add relevant certifications to strengthen your profile");
  if (overallScore < 70) recs.push("Use stronger action verbs and quantify your accomplishments");
  if (recs.length === 0) recs.push("Continue refining bullet points with measurable outcomes");
  return recs;
}

export function scoreResume(parsed: ParsedResume, jobRoleId: string, resumeText: string): ScoreResult {
  const role = getJobRoleById(jobRoleId);
  if (!role) throw new Error(`Unknown job role: ${jobRoleId}`);

  const allSkills = [...parsed.skills, ...parsed.tools];
  const skills = skillMatch(allSkills, role.required_skills, role.preferred_skills);
  const expScore = experienceScore(parsed.total_years_experience, role.minimum_years, resumeText, role.keywords);
  const projScore = projectScore(parsed.projects, role);
  const eduScore = educationScore(parsed.education, role.education_requirements);
  const impScore = impactScore(parsed.quantified_metrics);

  const w = role.scoring_weights;
  const overall = Math.round(
    (skills.score * w.skills + expScore * w.experience + projScore * w.projects + eduScore * w.education + impScore * w.impact_metrics) / 100
  );

  return {
    overall_score: Math.min(100, Math.max(0, overall)),
    skill_score: skills.score,
    experience_score: expScore,
    project_score: projScore,
    education_score: eduScore,
    impact_score: impScore,
    grade: computeGrade(overall),
    missing_skills: skills.missing,
    strengths: generateStrengths(parsed, role, skills),
    recommendations: generateRecommendations(parsed, role, skills.missing, overall),
  };
}
