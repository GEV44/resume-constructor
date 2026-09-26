import { adminClient, enforceHourlyLimit, handle, HttpError, isMissingColumn, json, readJson, requireUser } from "../_shared/http.ts";
import { callTool, todayLine } from "../_shared/ai.ts";
import { getJobRoleById } from "../_shared/job-roles.ts";
import { scoreResume, type ParsedResume } from "../_shared/scoring.ts";

const MAX_JD_CHARS = 20_000;

interface Problem {
  type: string;
  severity: "critical" | "major" | "minor";
  location: string;
  issue: string;
  original_text: string;
  fix: string;
}

interface Review {
  problems: Problem[];
  strengths: string[];
  recommendations: string[];
  structure_issues: string[];
}

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    problems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["missing_quantification", "weak_action_verb", "missing_technical_skills", "irrelevant_experience", "missing_projects", "poor_structure",
              "vague_description", "missing_summary", "weak_bullet", "missing_keywords", "formatting_issue", "missing_portfolio", "generic_language", "no_impact_shown",
              "typo_or_grammar", "inconsistent_dates"],
          },
          severity: { type: "string", enum: ["critical", "major", "minor"] },
          location: { type: "string", description: "Section and position, e.g. 'Experience — Acme — bullet 2'" },
          issue: { type: "string", description: "What is wrong, in one sentence" },
          original_text: { type: "string", description: "Exact quote from the resume" },
          fix: { type: "string", description: "Concrete rewrite or action. Use [X] placeholders for any number the candidate must supply — never invent figures." },
        },
        required: ["type", "severity", "location", "issue", "original_text", "fix"],
      },
    },
    strengths: { type: "array", items: { type: "string" }, description: "Specific strengths with evidence" },
    recommendations: { type: "array", items: { type: "string" }, description: "Top 3–6 prioritized, actionable recommendations" },
    structure_issues: { type: "array", items: { type: "string" }, description: "Ordering, section, length or formatting issues" },
  },
  required: ["problems", "strengths", "recommendations", "structure_issues"],
};

const clean = (items: unknown, max: number): string[] =>
  Array.isArray(items) ? items.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, max) : [];

Deno.serve(handle("score-resume", async (req) => {
  const supabase = adminClient();
  const user = await requireUser(req, supabase);
  await enforceHourlyLimit(supabase, "analyses", user.id, "SCORE_LIMIT_PER_HOUR", 30);

  const body = await readJson<{ resumeId?: unknown; jobRoleId?: unknown; jobDescription?: unknown }>(req);
  if (typeof body.resumeId !== "string" || typeof body.jobRoleId !== "string") throw new HttpError(400, "resumeId and jobRoleId are required");
  const role = getJobRoleById(body.jobRoleId);
  if (!role) throw new HttpError(400, "Unknown job role");
  const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim().slice(0, MAX_JD_CHARS) : "";

  // Always score what is stored, never what the client claims.
  const { data: resume } = await supabase
    .from("resumes").select("id, user_id, original_text, parsed_json").eq("id", body.resumeId).maybeSingle();
  if (!resume || resume.user_id !== user.id) throw new HttpError(403, "Forbidden");
  const parsed = (resume.parsed_json ?? {}) as ParsedResume;
  const resumeText: string = resume.original_text ?? "";

  const score = scoreResume(parsed, role.id, resumeText, jobDescription);

  // Qualitative review. Scoring never depends on it, so an AI outage degrades gracefully.
  let review: Review = { problems: [], strengths: [], recommendations: [], structure_issues: [] };
  try {
    review = await callTool<Review>({
      system: `${todayLine()}

You are a senior technical recruiter and resume coach. Review resumes with specific, evidence-based feedback:
quote the exact text, explain the problem, and give a concrete fix. Be direct but constructive.
Never suggest fabricating experience, employers, dates, degrees or metrics; when a fix needs a number the candidate must supply, write it as [X].`,
      user: `TARGET ROLE: ${role.name}
REQUIRED SKILLS: ${role.required_skills.join(", ")}
PREFERRED SKILLS: ${role.preferred_skills.join(", ")}
MISSING REQUIRED SKILLS (deterministic): ${score.missing_skills.join(", ") || "none"}
${score.job_match ? `JOB DESCRIPTION KEYWORDS MISSING: ${score.job_match.missing.join(", ") || "none"}\n` : ""}SCORES: overall ${score.overall_score}, skills ${score.skill_score}, experience ${score.experience_score}, projects ${score.project_score}, education ${score.education_score}, impact ${score.impact_score}
${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 6000)}\n` : ""}
RESUME TEXT:
${resumeText.slice(0, 12_000)}

STRUCTURED DATA:
${JSON.stringify({ summary: parsed.summary, experience: parsed.experience, projects: parsed.projects, education: parsed.education }).slice(0, 8000)}

List every meaningful problem (most severe first), then strengths, recommendations and structure issues.`,
      tool: { name: "return_review", description: "Return the resume review", parameters: REVIEW_SCHEMA },
    });
  } catch (e) {
    console.error("AI review failed, continuing with deterministic feedback:", e instanceof Error ? e.message : e);
  }

  const problems = (Array.isArray(review.problems) ? review.problems : [])
    .filter((p) => p && typeof p.issue === "string")
    .slice(0, 40)
    .map((p) => ({ ...p, severity: (["critical", "major", "minor"].includes(p.severity) ? p.severity : "minor") as Problem["severity"] }));
  const strengths = clean(review.strengths, 8);
  const recommendations = clean(review.recommendations, 8);

  const base = {
    resume_id: resume.id,
    user_id: user.id,
    job_role: role.id,
    overall_score: score.overall_score,
    skill_score: score.skill_score,
    experience_score: score.experience_score,
    project_score: score.project_score,
    education_score: score.education_score,
    impact_score: score.impact_score,
    grade: score.grade,
    missing_skills: score.missing_skills,
    strengths: strengths.length ? strengths : score.strengths,
    recommendations: recommendations.length ? recommendations : score.recommendations,
  };
  const insights = {
    problems,
    structure_issues: clean(review.structure_issues, 12),
    job_description: jobDescription || null,
    job_match: score.job_match,
  };

  let { data: analysis, error } = await supabase.from("analyses").insert({ ...base, ...insights }).select().single();
  if (error && isMissingColumn(error)) {
    // The insights migration hasn't been applied yet: save the core analysis and
    // return the insights in the response so the UI can still show them.
    console.warn("analyses insight columns missing — apply the latest migration");
    ({ data: analysis, error } = await supabase.from("analyses").insert(base).select().single());
  }
  if (error || !analysis) throw new Error("Failed to save analysis: " + (error?.message ?? "no row returned"));

  return json(req, { ...insights, ...analysis, analysisId: analysis.id });
}));
