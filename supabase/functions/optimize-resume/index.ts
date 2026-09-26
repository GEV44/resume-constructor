import { adminClient, enforceHourlyLimit, handle, HttpError, json, readJson, requireUser } from "../_shared/http.ts";
import { callTool, todayLine } from "../_shared/ai.ts";
import { getJobRoleById } from "../_shared/job-roles.ts";
import { normalizeSkill, resumeCorpus, scoreResume, textGrams, type ParsedResume } from "../_shared/scoring.ts";

type Mode = "text" | "design" | "both";

interface ChangeItem { type: string; location: string; before: string; after: string }

interface Rewrite {
  summary: string;
  experience: { index: number; responsibilities: string[] }[];
  projects: { index: number; description: string }[];
  skills: string[];
  tools: string[];
  changes_made: ChangeItem[];
  suggestions: string[];
}

const REWRITE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2–4 sentence professional summary targeted at the role, built only from facts in the resume" },
    experience: {
      type: "array",
      description: "One entry per original position, identified by its index. Do not add or remove positions.",
      items: {
        type: "object",
        properties: { index: { type: "integer" }, responsibilities: { type: "array", items: { type: "string" } } },
        required: ["index", "responsibilities"],
      },
    },
    projects: {
      type: "array",
      description: "One entry per original project, identified by its index. Do not add projects.",
      items: {
        type: "object",
        properties: { index: { type: "integer" }, description: { type: "string" } },
        required: ["index", "description"],
      },
    },
    skills: { type: "array", items: { type: "string" }, description: "Skills ordered by relevance to the role; only skills evidenced in the resume" },
    tools: { type: "array", items: { type: "string" }, description: "Tools ordered by relevance; only tools evidenced in the resume" },
    changes_made: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["enhanced_bullet", "added_metrics", "added_skill", "rewritten_summary", "stronger_verb", "added_keywords", "reordered"] },
          location: { type: "string" },
          before: { type: "string" },
          after: { type: "string" },
        },
        required: ["type", "location", "before", "after"],
      },
    },
    suggestions: {
      type: "array",
      items: { type: "string" },
      description: "Things the candidate could add ONLY IF TRUE (missing skills, certifications, projects, metrics). Phrase as 'If you have…, add…'.",
    },
  },
  required: ["summary", "experience", "projects", "skills", "tools", "changes_made", "suggestions"],
};

function buildSystemPrompt(roleName: string, mode: Mode): string {
  return `${todayLine()}

You are an elite resume writer for ${roleName} roles. You rewrite for impact and ATS keyword coverage while staying 100% truthful.

NON-NEGOTIABLE RULES
1. Never invent employers, titles, dates, degrees, certifications, projects, tools or responsibilities.
2. Never invent numbers. Keep every figure from the source. Where a metric would clearly strengthen a bullet but is not in the source,
   insert a bracketed placeholder the candidate must fill in, e.g. "[X%]", "[N users]", "[$X]". Use placeholders sparingly (at most one per bullet).
3. Only list skills/tools evidenced somewhere in the resume. Put anything else the candidate might have in "suggestions" instead.
4. Return exactly one experience entry per original position (by index) and one project entry per original project (by index).
5. Use job-description keywords only where the resume supports them.

HOW TO WRITE
- Every bullet: strong past-tense action verb → what you did (scope, tools) → measurable result or business impact.
- 1–2 lines per bullet, no first person, no filler ("responsible for", "helped with", "various").
- Keep the candidate's own bullet count per role (you may merge duplicates or split an overloaded bullet).
- Summary: 2–4 sentences — who they are, years of experience, core stack/domain, standout results — tailored to ${roleName}.
${mode === "text" ? "- MODE: text only — rewrite summary and bullets; return skills and tools unchanged in their original order." : "- MODE: full — rewrite summary, bullets and project descriptions, and order skills/tools by relevance to the role."}
Record each meaningful edit in changes_made (before/after quotes).`;
}

function renderText(d: Required<Pick<ParsedResume, "experience" | "projects" | "education" | "skills" | "tools" | "certifications">> & ParsedResume): string {
  const c = d.contact ?? {};
  const lines = [c.name ?? "", [c.email, c.phone, c.location, c.linkedin, c.github, c.website].filter(Boolean).join(" | "), ""];
  if (d.summary) lines.push("SUMMARY", d.summary, "");
  if (d.skills.length || d.tools.length) lines.push("SKILLS", [...d.skills, ...d.tools].join(", "), "");
  if (d.experience.length) {
    lines.push("EXPERIENCE");
    for (const e of d.experience) lines.push(`${e.role ?? ""} — ${e.company ?? ""} (${e.duration ?? ""})`, ...(e.responsibilities ?? []).map((r) => `• ${r}`), "");
  }
  if (d.projects.length) {
    lines.push("PROJECTS");
    for (const p of d.projects) lines.push(`${p.name ?? ""}${p.technologies?.length ? ` (${p.technologies.join(", ")})` : ""}`, p.description ?? "", "");
  }
  if (d.education.length) lines.push("EDUCATION", ...d.education.map((e) => `${e.degree ?? ""}${e.field ? `, ${e.field}` : ""} — ${e.institution ?? ""} (${e.year ?? ""})`), "");
  if (d.certifications.length) lines.push("CERTIFICATIONS", d.certifications.join(", "), "");
  if (d.languages?.length) lines.push("LANGUAGES", d.languages.join(", "));
  return lines.join("\n").trim();
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim()) : []);

Deno.serve(handle("optimize-resume", async (req) => {
  const supabase = adminClient();
  const user = await requireUser(req, supabase);

  const body = await readJson<{ analysisId?: unknown; mode?: unknown }>(req);
  if (typeof body.analysisId !== "string") throw new HttpError(400, "analysisId is required");
  const mode: Mode = body.mode === "text" || body.mode === "design" ? body.mode : "both";

  const { data: analysis } = await supabase
    .from("analyses").select("id, user_id, resume_id, job_role, job_description").eq("id", body.analysisId).maybeSingle();
  if (!analysis || analysis.user_id !== user.id) throw new HttpError(403, "Forbidden");
  const { data: resume } = await supabase
    .from("resumes").select("id, user_id, original_text, parsed_json").eq("id", analysis.resume_id).maybeSingle();
  if (!resume || resume.user_id !== user.id) throw new HttpError(403, "Forbidden");
  const role = getJobRoleById(analysis.job_role);
  if (!role) throw new HttpError(400, "Unknown job role");
  if (mode !== "design") await enforceHourlyLimit(supabase, "optimized_resumes", user.id, "OPTIMIZE_LIMIT_PER_HOUR", 15);

  const original = (resume.parsed_json ?? {}) as ParsedResume;
  const originalText: string = resume.original_text ?? "";
  const jobDescription: string = analysis.job_description ?? "";
  const base = {
    ...original,
    experience: original.experience ?? [],
    projects: original.projects ?? [],
    education: original.education ?? [],
    skills: original.skills ?? [],
    tools: original.tools ?? [],
    certifications: original.certifications ?? [],
  };

  let optimized = base;
  let changes: ChangeItem[] = [{ type: "design_refresh", location: "Layout", before: "Original layout", after: "Restyled with a professional template — content unchanged." }];
  let suggestions: string[] = [];

  if (mode !== "design") {
    const before = scoreResume(original, role.id, originalText, jobDescription);
    const rewrite = await callTool<Rewrite>({
      system: buildSystemPrompt(role.name, mode),
      user: `TARGET ROLE: ${role.name}
CORE SKILLS FOR THE ROLE: ${[...role.required_skills, ...role.preferred_skills].join(", ")}
MISSING CORE SKILLS: ${before.missing_skills.join(", ") || "none"}
${before.job_match ? `JOB DESCRIPTION KEYWORDS MISSING: ${before.job_match.missing.join(", ") || "none"}\n` : ""}${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 6000)}\n` : ""}
CURRENT SUMMARY: ${base.summary || "(none)"}

EXPERIENCE (by index):
${base.experience.map((e, i) => `[${i}] ${e.role} — ${e.company} (${e.duration})\n${(e.responsibilities ?? []).map((r) => `  - ${r}`).join("\n")}`).join("\n") || "(none)"}

PROJECTS (by index):
${base.projects.map((p, i) => `[${i}] ${p.name} [${(p.technologies ?? []).join(", ")}]: ${p.description}`).join("\n") || "(none)"}

SKILLS: ${base.skills.join(", ")}
TOOLS: ${base.tools.join(", ")}
EDUCATION: ${base.education.map((e) => `${e.degree} ${e.field ?? ""} — ${e.institution} (${e.year})`).join("; ")}
CERTIFICATIONS: ${base.certifications.join(", ") || "none"}

FULL ORIGINAL TEXT (for evidence only):
${originalText.slice(0, 12_000)}`,
      tool: { name: "return_rewrite", description: "Return the rewritten resume content", parameters: REWRITE_SCHEMA },
      temperature: 0.4,
    });

    // Merge by index onto the original facts, so names, titles and dates can never change.
    const bulletsFor = new Map((rewrite.experience ?? []).map((e) => [e.index, strings(e.responsibilities)]));
    const projectFor = new Map((rewrite.projects ?? []).map((p) => [p.index, typeof p.description === "string" ? p.description.trim() : ""]));

    // A skill is kept only if the original resume already evidences it.
    const evidence = new Set([...textGrams(resumeCorpus(original, originalText)), ...[...base.skills, ...base.tools].map(normalizeSkill)]);
    const evidenced = (s: string) => evidence.has(normalizeSkill(s));
    const keepOrder = (proposed: string[], originalList: string[]) => {
      const kept = [...new Map(proposed.filter(evidenced).map((s) => [normalizeSkill(s), s])).values()];
      const keptKeys = new Set(kept.map(normalizeSkill));
      return [...kept, ...originalList.filter((s) => !keptKeys.has(normalizeSkill(s)))];
    };
    const rejected = [...strings(rewrite.skills), ...strings(rewrite.tools)].filter((s) => !evidenced(s));

    optimized = {
      ...base,
      summary: typeof rewrite.summary === "string" && rewrite.summary.trim() ? rewrite.summary.trim() : base.summary,
      experience: base.experience.map((e, i) => {
        const bullets = bulletsFor.get(i);
        return bullets && bullets.length ? { ...e, responsibilities: bullets } : e;
      }),
      projects: base.projects.map((p, i) => (mode === "both" && projectFor.get(i) ? { ...p, description: projectFor.get(i)! } : p)),
      skills: mode === "both" ? keepOrder(strings(rewrite.skills), base.skills) : base.skills,
      tools: mode === "both" ? keepOrder(strings(rewrite.tools), base.tools) : base.tools,
    };
    changes = (Array.isArray(rewrite.changes_made) ? rewrite.changes_made : [])
      .filter((c) => c && typeof c.after === "string")
      .filter((c) => c.type !== "added_skill" || !rejected.some((r) => c.after.toLowerCase().includes(r.toLowerCase())))
      .slice(0, 80);
    suggestions = [
      ...strings(rewrite.suggestions),
      ...rejected.map((s) => `If you have hands-on experience with ${s}, add it with a bullet that shows how you used it.`),
    ].slice(0, 12);
  }

  const optimizedText = renderText(optimized);
  const beforeScore = scoreResume(original, role.id, originalText, jobDescription).overall_score;
  const afterScore = mode === "design" ? beforeScore : scoreResume(optimized, role.id, optimizedText, jobDescription).overall_score;
  const payload = JSON.stringify({ text: optimizedText, structured: { ...optimized, changes_made: changes }, suggestions, mode });

  const { data: row, error } = await supabase
    .from("optimized_resumes")
    .insert({
      resume_id: resume.id,
      analysis_id: analysis.id,
      user_id: user.id,
      job_role: role.id,
      optimized_text: payload,
      improvement_percentage: afterScore - beforeScore,
      before_score: beforeScore,
      after_score: afterScore,
    })
    .select("id")
    .single();
  if (error) throw new Error("Failed to save optimization: " + error.message);

  return json(req, {
    id: row.id,
    before_score: beforeScore,
    after_score: afterScore,
    improvement_percentage: afterScore - beforeScore,
    changes_made: changes,
    suggestions,
    mode,
  });
}));
