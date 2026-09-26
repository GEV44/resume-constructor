// Deterministic ATS scoring engine — the single source of truth shared by the
// Supabase edge functions (Deno) and the web app (Vite). Pure TypeScript with
// no runtime-specific APIs, so both sides always compute identical scores.
import { JOB_ROLES, getJobRoleById, type JobRole } from "./job-roles.ts";

export interface ParsedResume {
  contact?: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string; website?: string };
  summary?: string;
  education?: { degree?: string; institution?: string; year?: string; field?: string }[];
  skills?: string[];
  tools?: string[];
  experience?: { company?: string; role?: string; duration?: string; years?: number; responsibilities?: string[] }[];
  projects?: { name?: string; description?: string; technologies?: string[] }[];
  certifications?: string[];
  languages?: string[];
  total_years_experience?: number;
  quantified_metrics?: string[];
}

export interface JobMatch {
  score: number;
  matched: string[];
  missing: string[];
  total: number;
}

export interface ScoreResult {
  overall_score: number;
  skill_score: number;
  experience_score: number;
  project_score: number;
  education_score: number;
  impact_score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  recommendations: string[];
  job_match: JobMatch | null;
}

/** Share of the overall score taken by the job-description match when one is supplied. */
export const JOB_MATCH_WEIGHT = 0.3;

export function normalizeSkill(s: string): string {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

// Normalized aliases so "JS", "k8s" or "Postgres" count as the canonical skill.
const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6"],
  typescript: ["ts"],
  kubernetes: ["k8s"],
  machinelearning: ["ml"],
  deeplearning: ["dl"],
  nodejs: ["node"],
  nlp: ["naturallanguageprocessing"],
  llms: ["llm", "largelanguagemodels", "largelanguagemodel"],
  restapis: ["rest", "restapi", "restful", "restfulapis", "restfulapi"],
  aws: ["amazonwebservices"],
  gcp: ["googlecloud", "googlecloudplatform"],
  azure: ["microsoftazure"],
  excel: ["microsoftexcel", "msexcel"],
  sql: ["postgresql", "postgres", "mysql", "tsql", "plsql"],
  cicd: ["continuousintegration", "continuousdelivery", "continuousdeployment"],
  abtesting: ["splittesting", "abtest", "abtests"],
  rag: ["retrievalaugmentedgeneration"],
  vectordatabases: ["vectordatabase", "vectordb", "pinecone", "weaviate", "pgvector", "qdrant", "chroma"],
  promptengineering: ["prompting", "promptdesign"],
  finetuning: ["finetune", "finetuned", "lora", "peft"],
  git: ["github", "gitlab"],
  powerbi: ["msbi"],
  seo: ["searchengineoptimization"],
  crm: ["salesforce", "hubspot"],
};

function skillVariants(skill: string): string[] {
  const norm = normalizeSkill(skill);
  const variants = new Set([norm, ...(SKILL_ALIASES[norm] ?? [])]);
  // "AWS/GCP" means either one; "CI/CD" or "UI/UX" are single skills (short parts).
  if (skill.includes("/")) {
    const parts = skill.split("/").map(normalizeSkill);
    if (parts.every((p) => p.length >= 3)) parts.forEach((p) => {
      variants.add(p);
      (SKILL_ALIASES[p] ?? []).forEach((a) => variants.add(a));
    });
  }
  // Tolerate a plural "s" in either direction ("REST APIs" vs "REST API").
  for (const v of [...variants]) {
    if (v.length > 3 && v.endsWith("s")) variants.add(v.slice(0, -1));
    else if (v.length > 2) variants.add(v + "s");
  }
  variants.delete("");
  return [...variants];
}

/** Every normalized 1–4 word n-gram in the text, so multi-word skills match regardless of punctuation. */
export function textGrams(text: string, maxN = 4): Set<string> {
  const words = String(text ?? "").toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
  const grams = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    let gram = "";
    for (let n = 0; n < maxN && i + n < words.length; n++) {
      gram += words[i + n];
      grams.add(gram);
    }
  }
  return grams;
}

/**
 * True when any variant of the term is in the pool. Variants of 1–2 characters
 * ("Go", "R", "JS") are too ambiguous for free text, so they only count when
 * found in `listed` (the resume's explicit skills section).
 */
function hasTerm(term: string, pool: Set<string>, listed: Set<string> = pool): boolean {
  return skillVariants(term).some((v) => (v.length <= 2 ? listed.has(v) : pool.has(v)));
}

/** Plain-text rendering of the structured resume, used when no raw text is available. */
export function resumeCorpus(parsed: ParsedResume, resumeText = ""): string {
  const parts: string[] = [resumeText, parsed.summary ?? ""];
  parts.push(...(parsed.skills ?? []), ...(parsed.tools ?? []), ...(parsed.certifications ?? []));
  for (const e of parsed.experience ?? []) parts.push(e.role ?? "", e.company ?? "", ...(e.responsibilities ?? []));
  for (const p of parsed.projects ?? []) parts.push(p.name ?? "", p.description ?? "", ...(p.technologies ?? []));
  for (const e of parsed.education ?? []) parts.push(e.degree ?? "", e.field ?? "");
  return parts.join("\n");
}

function listedSkills(parsed: ParsedResume): Set<string> {
  return new Set([...(parsed.skills ?? []), ...(parsed.tools ?? []), ...(parsed.projects ?? []).flatMap((p) => p.technologies ?? [])].map(normalizeSkill));
}

function skillMatch(parsed: ParsedResume, pool: Set<string>, role: JobRole) {
  const listed = listedSkills(parsed);
  const combined = new Set([...listed, ...pool]);
  const matchedRequired = role.required_skills.filter((s) => hasTerm(s, combined, listed));
  const matchedPreferred = role.preferred_skills.filter((s) => hasTerm(s, combined, listed));
  const missing = role.required_skills.filter((s) => !hasTerm(s, combined, listed));
  const requiredScore = role.required_skills.length ? (matchedRequired.length / role.required_skills.length) * 100 : 0;
  const preferredScore = role.preferred_skills.length ? (matchedPreferred.length / role.preferred_skills.length) * 50 : 0;
  return {
    score: Math.round(Math.min(100, requiredScore + preferredScore)),
    missing,
    matched: [...matchedRequired, ...matchedPreferred],
    matchedRequired,
  };
}

function experienceScore(totalYears: number, role: JobRole, pool: Set<string>): number {
  const yearScore = Math.min(Math.max(totalYears, 0) / Math.max(role.minimum_years, 1), 1) * 100;
  const keywordMatches = role.keywords.filter((k) => hasTerm(k, pool)).length;
  const keywordScore = role.keywords.length ? (keywordMatches / role.keywords.length) * 30 : 0;
  return Math.round(Math.min(100, yearScore * 0.85 + keywordScore));
}

const QUANTIFIED_RE = /\d+(?:[.,]\d+)?\s*(?:%|x\b|k\b|m\b|\+)|[$€£]\s?\d|\b\d{2,}\b/i;
const OUTCOME_RE = /\b(increas|decreas|improv|reduc|grew|grow|boost|cut|saved|achiev|launch|deliver|scal)/i;

function projectScore(projects: NonNullable<ParsedResume["projects"]>, role: JobRole): number {
  if (projects.length === 0) return 0;
  const roleSkills = [...role.required_skills, ...role.preferred_skills];
  const relevant = projects.filter((p) => {
    const pool = textGrams([...(p.technologies ?? []), p.description ?? "", p.name ?? ""].join(" "));
    return roleSkills.some((s) => hasTerm(s, pool));
  });
  const relevance = (relevant.length / projects.length) * 80;
  const withOutcome = projects.filter((p) => QUANTIFIED_RE.test(p.description ?? "") || OUTCOME_RE.test(p.description ?? "")).length;
  const outcome = (withOutcome / projects.length) * 20;
  const breadth = Math.min(projects.length, 3) / 3;
  return Math.round(Math.min(100, (relevance + outcome) * (0.7 + 0.3 * breadth)));
}

const CATEGORY_FIELDS: Record<string, string[]> = {
  Tech: ["computer science", "software engineering", "computer engineering", "engineering", "mathematics", "statistics", "data science", "information technology", "information systems", "physics", "artificial intelligence"],
  Business: ["business", "management", "marketing", "economics", "mba", "communications", "operations", "commerce"],
  Finance: ["finance", "accounting", "economics", "business", "mathematics", "statistics", "commerce", "cpa", "cfa"],
  HR: ["human resources", "psychology", "business", "management", "organizational", "sociology"],
  Design: ["design", "graphic design", "fine arts", "hci", "human computer interaction", "visual communication", "architecture", "media"],
};
const FIELD_ABBREVIATIONS: Record<string, string> = { cs: "computer science", it: "information technology", ai: "artificial intelligence", ml: "machine learning", hci: "human computer interaction" };

function relevantFields(role: JobRole): string[] {
  const fromRequirements = role.education_requirements.map((req) =>
    req.replace(/\b(bachelor'?s?|master'?s?|phd|doctorate|associate'?s?|degree|in|of)\b/gi, " ").replace(/\s+/g, " ").trim().toLowerCase(),
  );
  return [...new Set([...(CATEGORY_FIELDS[role.category] ?? []), ...fromRequirements])]
    .filter(Boolean)
    .map((f) => FIELD_ABBREVIATIONS[f] ?? f);
}

function containsPhrase(haystack: string, phrase: string): boolean {
  const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const hay = ` ${words(haystack).map((w) => FIELD_ABBREVIATIONS[w] ?? w).join(" ")} `;
  return hay.includes(` ${words(phrase).join(" ")} `);
}

function educationScore(education: NonNullable<ParsedResume["education"]>, role: JobRole): number {
  if (education.length === 0) return 0;
  let degree = 0;
  for (const edu of education) {
    const d = ` ${(edu.degree ?? "").toLowerCase()} `;
    if (/\b(phd|ph\.d|doctor|doctorate|dphil)\b/.test(d)) degree = Math.max(degree, 100);
    else if (/\b(master|msc|m\.sc|ms|ma|mba|meng|m\.s)\b/.test(d)) degree = Math.max(degree, 90);
    else if (/\b(bachelor|bsc|b\.sc|bs|ba|beng|b\.s|b\.a|undergraduate)\b/.test(d)) degree = Math.max(degree, 75);
    else if (/\bassociate\b/.test(d)) degree = Math.max(degree, 55);
    else degree = Math.max(degree, 35);
  }
  const fields = relevantFields(role);
  const relevant = education.some((e) => fields.some((f) => containsPhrase(`${e.field ?? ""} ${e.degree ?? ""}`, f)));
  return Math.min(100, degree + (relevant ? 20 : 0));
}

function allBullets(parsed: ParsedResume): string[] {
  return (parsed.experience ?? []).flatMap((e) => e.responsibilities ?? []).filter((b) => typeof b === "string" && b.trim());
}

function impactScore(parsed: ParsedResume): number {
  const bullets = allBullets(parsed);
  const quantifiedBullets = bullets.filter((b) => QUANTIFIED_RE.test(b)).length;
  const metrics = Math.max((parsed.quantified_metrics ?? []).length, quantifiedBullets);
  const volume = Math.min(metrics, 6) / 6;
  const density = bullets.length ? quantifiedBullets / bullets.length : 0;
  return Math.round(Math.min(100, volume * 70 + density * 30));
}

export function computeGrade(score: number): ScoreResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// ---------- Job-description matching ----------

const STOPWORDS = new Set(("a about above across after again all also an and any are as at be because been being below between both but by can could did do does " +
  "each either etc for from further had has have having he her here how i if in into is it its just may me more most must my no nor not of off on once only or other " +
  "our out over own per please same she should so some such than that the their them then there these they this those through to too under until up upon us very " +
  "was we were what when where which while who whom why will with within without would you your yours ours we'll you'll ability able across apply applicant applicants " +
  "benefits candidate candidates company culture day days description duties environment equal excellent experience experienced familiarity good great help ideal " +
  "including join knowledge looking love new nice opportunity plus position preferred proven qualifications related requirements required responsibilities role " +
  "salary skills strong team teams understanding using work working world year years month months job jobs offer offers bonus remote hybrid onsite office full time " +
  "part based level senior junior mid lead staff principal minimum least degree bachelor bachelors master masters phd equivalent").split(/\s+/));

const GENERIC_CAPITALIZED = new Set(["about", "we", "you", "our", "the", "this", "responsibilities", "requirements", "qualifications", "benefits", "what", "who", "why",
  "how", "your", "job", "role", "team", "company", "monday", "tuesday", "wednesday", "thursday", "friday", "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december", "us", "usa", "eu", "uk", "inc", "ltd", "llc", "nice", "must", "bonus", "preferred", "key",
  "apply", "salary", "location", "remote", "hybrid", "equal", "opportunity", "employer", "please", "if", "in", "as", "at", "on", "for", "with", "and", "or", "a", "an",
  "ceo", "cto", "cfo", "coo", "hr", "pto", "eeo", "eoe", "ada", "faq", "asap", "fte", "etc", "ie", "eg", "am", "pm", "est", "pst", "cet", "utc", "yoe"]);

// Common hard skills that are not part of any role definition but show up in job ads.
const EXTRA_VOCABULARY = ["Java", "C#", "C++", "Go", "Rust", "Scala", "Ruby", "Rails", "PHP", "Laravel", "Django", "Flask", "FastAPI", "Spring Boot",
  ".NET", "Angular", "Svelte", "Redux", "Vite", "Express", "NestJS", "PostgreSQL", "MySQL", "DynamoDB", "Elasticsearch", "RabbitMQ", "gRPC",
  "WebSockets", "OAuth", "Supabase", "Firebase", "Vercel", "Cloudflare", "Linux", "Bash", "Jira", "Confluence", "Notion", "Slack", "Excel",
  "Google Analytics", "Looker", "dbt", "Snowflake", "Kafka", "Pandas", "scikit-learn", "Hugging Face", "OpenAI", "Anthropic", "LangGraph",
  "Stakeholder Management", "Cross-functional", "Leadership", "Mentoring", "Communication", "Presentation", "Negotiation", "Budgeting",
  "Forecasting", "Salesforce", "HubSpot", "SAP", "Workday", "QuickBooks", "Canva", "Adobe Creative Suite", "Webflow", "Accessibility",
  "Unit Testing", "TDD", "Observability", "Security", "SOC 2", "GDPR", "HIPAA", "Agile", "Scrum", "Kanban", "OKR", "KPI"];

let vocabularyCache: Map<string, string> | null = null;
/** Known skills and keywords across all roles, keyed by normalized form → display form. */
function knownVocabulary(): Map<string, string> {
  if (vocabularyCache) return vocabularyCache;
  const vocab = new Map<string, string>();
  for (const role of JOB_ROLES) {
    for (const term of [...role.required_skills, ...role.preferred_skills, ...role.keywords]) {
      const norm = normalizeSkill(term);
      if (norm.length >= 2 && !vocab.has(norm)) vocab.set(norm, term);
    }
  }
  for (const term of EXTRA_VOCABULARY) {
    const norm = normalizeSkill(term);
    if (!vocab.has(norm)) vocab.set(norm, term);
  }
  vocabularyCache = vocab;
  return vocab;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract the most important hard-skill keywords from a job description.
 * Deterministic: known vocabulary terms plus technology-looking tokens
 * (Next.js, C#, Kafka, GPT-4o…), ranked by frequency then first appearance.
 */
export function extractJobKeywords(jobDescription: string, limit = 25): string[] {
  const text = String(jobDescription ?? "").slice(0, 20000);
  if (!text.trim()) return [];
  const words = text.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
  const gramCounts = new Map<string, number>();
  for (let i = 0; i < words.length; i++) {
    let gram = "";
    for (let n = 0; n < 4 && i + n < words.length; n++) {
      gram += words[i + n];
      gramCounts.set(gram, (gramCounts.get(gram) ?? 0) + 1);
    }
  }
  const lower = text.toLowerCase();
  const found = new Map<string, { term: string; count: number; first: number }>();
  const add = (norm: string, term: string, index: number, count = 1) => {
    const entry = found.get(norm);
    if (entry) entry.count += count;
    else found.set(norm, { term, count, first: index < 0 ? Number.MAX_SAFE_INTEGER : index });
  };

  const vocab = knownVocabulary();
  for (const [norm, term] of vocab) {
    const count = gramCounts.get(norm) ?? 0;
    // Short terms ("Go", "R", "C#") must appear exactly as written, as a standalone token.
    const exact = norm.length > 2 || new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9+#])`).test(text);
    if (count > 0 && exact) add(norm, term, lower.indexOf(term.toLowerCase()), count);
  }

  // Technology-looking tokens the vocabulary doesn't know: CamelCase (PyTorch, GraphQL),
  // dotted/symbolic (Next.js, C#), versioned (GPT-4o, Python3) or short acronyms (AWS, ETL).
  // Plain capitalized words are skipped — they are usually company or place names.
  const tokenRe = /(?:^|[\s,(/;:])([A-Za-z][A-Za-z0-9]*(?:[.+#-][A-Za-z0-9+#]+)*[+#]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(text))) {
    const token = m[1];
    const norm = normalizeSkill(token);
    if (norm.length < 2 || vocab.has(norm)) continue;
    if (STOPWORDS.has(token.toLowerCase()) || GENERIC_CAPITALIZED.has(token.toLowerCase())) continue;
    const techy = (/[.+#]|\d/.test(token) && /[a-z]/i.test(token))
      || /^[A-Z][a-z]+[A-Z]/.test(token)
      || /^[A-Z]{2,6}s?$/.test(token);
    if (techy) add(norm, token, m.index + m[0].indexOf(token));
  }

  // Drop terms that are substrings of a longer found term ("Learning" inside "Machine Learning").
  const entries = [...found.entries()];
  const filtered = entries.filter(([norm]) => !entries.some(([other]) => other !== norm && other.length > norm.length && other.includes(norm) && found.get(other)!.count >= found.get(norm)!.count));

  return filtered
    .sort((a, b) => b[1].count - a[1].count || a[1].first - b[1].first)
    .slice(0, limit)
    .map(([, v]) => v.term);
}

export function matchJobDescription(parsed: ParsedResume, resumeText: string, jobDescription: string): JobMatch | null {
  const keywords = extractJobKeywords(jobDescription);
  if (keywords.length === 0) return null;
  const listed = listedSkills(parsed);
  const pool = new Set([...textGrams(resumeCorpus(parsed, resumeText)), ...listed]);
  const matched = keywords.filter((k) => hasTerm(k, pool, listed));
  const missing = keywords.filter((k) => !hasTerm(k, pool, listed));
  return { score: Math.round((matched.length / keywords.length) * 100), matched, missing, total: keywords.length };
}

// ---------- Narrative feedback ----------

function generateStrengths(parsed: ParsedResume, role: JobRole, matchedRequired: string[], jobMatch: JobMatch | null): string[] {
  const strengths: string[] = [];
  const years = parsed.total_years_experience ?? 0;
  if (matchedRequired.length >= role.required_skills.length * 0.7) strengths.push(`Covers ${matchedRequired.length} of ${role.required_skills.length} core skills for ${role.name}`);
  if (years >= role.minimum_years) strengths.push(`${years}+ years of experience meets the ${role.minimum_years}-year bar`);
  if ((parsed.projects ?? []).length >= 3) strengths.push("Diverse project portfolio");
  if (impactScore(parsed) >= 60) strengths.push("Good use of quantified impact metrics");
  if ((parsed.certifications ?? []).length > 0) strengths.push(`${parsed.certifications!.length} certification(s) listed`);
  if (jobMatch && jobMatch.score >= 70) strengths.push(`Strong keyword alignment with the job description (${jobMatch.score}%)`);
  if (strengths.length === 0) strengths.push("Resume has foundational content to build upon");
  return strengths;
}

function generateRecommendations(parsed: ParsedResume, role: JobRole, missing: string[], overall: number, jobMatch: JobMatch | null): string[] {
  const recs: string[] = [];
  if (missing.length > 0) recs.push(`Add evidence of these core skills (only if you have them): ${missing.slice(0, 5).join(", ")}`);
  if (jobMatch && jobMatch.missing.length > 0) recs.push(`Mirror the job description's language where truthful: ${jobMatch.missing.slice(0, 6).join(", ")}`);
  if (impactScore(parsed) < 60) recs.push("Quantify outcomes — add numbers, percentages, revenue or time saved to your bullets");
  if ((parsed.projects ?? []).length < 2 && role.scoring_weights.projects >= 20) recs.push("Include 2–3 relevant projects with the tools used and measurable results");
  if ((parsed.total_years_experience ?? 0) < role.minimum_years) recs.push(`Highlight all relevant experience — ${role.name} roles typically ask for ${role.minimum_years}+ years`);
  if (!parsed.summary) recs.push(`Open with a 2–3 sentence summary targeted at ${role.name} roles`);
  if (overall < 70) recs.push("Start each bullet with a strong action verb and end with the result");
  if (recs.length === 0) recs.push("Keep refining bullet points with measurable outcomes");
  return recs;
}

/** Score a parsed resume against a role (and optionally a job description). Same input → same output. */
export function scoreResume(parsed: ParsedResume, jobRoleId: string, resumeText = "", jobDescription = ""): ScoreResult {
  const role = getJobRoleById(jobRoleId);
  if (!role) throw new Error(`Unknown job role: ${jobRoleId}`);

  const pool = textGrams(resumeCorpus(parsed, resumeText));
  const skills = skillMatch(parsed, pool, role);
  const exp = experienceScore(parsed.total_years_experience ?? 0, role, pool);
  const proj = projectScore(parsed.projects ?? [], role);
  const edu = educationScore(parsed.education ?? [], role);
  const imp = impactScore(parsed);

  const w = role.scoring_weights;
  const roleScore = (skills.score * w.skills + exp * w.experience + proj * w.projects + edu * w.education + imp * w.impact_metrics) / 100;
  const jobMatch = jobDescription.trim() ? matchJobDescription(parsed, resumeText, jobDescription) : null;
  const blended = jobMatch ? roleScore * (1 - JOB_MATCH_WEIGHT) + jobMatch.score * JOB_MATCH_WEIGHT : roleScore;
  const overall = Math.min(100, Math.max(0, Math.round(blended)));

  return {
    overall_score: overall,
    skill_score: skills.score,
    experience_score: exp,
    project_score: proj,
    education_score: edu,
    impact_score: imp,
    grade: computeGrade(overall),
    matched_skills: skills.matched,
    missing_skills: skills.missing,
    strengths: generateStrengths(parsed, role, skills.matchedRequired, jobMatch),
    recommendations: generateRecommendations(parsed, role, skills.missing, overall, jobMatch),
    job_match: jobMatch,
  };
}
