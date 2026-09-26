// A signed-in session plus a mocked Supabase REST API, so the authenticated
// pages can be exercised (and screenshotted) without a real backend.
import { readFileSync } from "node:fs";
import type { Page, Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const RESUME_ID = "00000000-0000-4000-8000-0000000000a1";

function supabaseRef(): string {
  let url = process.env.VITE_SUPABASE_URL ?? "";
  if (!url) {
    try {
      url = readFileSync(".env", "utf8").match(/^VITE_SUPABASE_URL="?([^"\n]+)"?/m)?.[1] ?? "";
    } catch { /* no .env */ }
  }
  return new URL(url || "https://example.supabase.co").hostname.split(".")[0];
}

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

function fakeSession() {
  const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
  const user = {
    id: USER_ID, aud: "authenticated", role: "authenticated", email: "alex.morgan@example.com",
    app_metadata: { provider: "email" }, user_metadata: { name: "Alex Morgan" }, created_at: "2026-01-10T09:00:00Z",
  };
  const token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: USER_ID, exp, role: "authenticated", aud: "authenticated" })}.signature`;
  return { access_token: token, refresh_token: "refresh", token_type: "bearer", expires_in: 86400, expires_at: exp, user };
}

const parsed = {
  contact: { name: "Alex Morgan", email: "alex.morgan@example.com", phone: "+1 555 010 2030", location: "Austin, TX", linkedin: "linkedin.com/in/alexmorgan", github: "github.com/alexmorgan" },
  summary: "Frontend engineer building fast, accessible React applications.",
  skills: ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git"],
  tools: ["Tailwind CSS", "Jest", "Vite"],
  experience: [
    { company: "Brightlane", role: "Senior Frontend Engineer", duration: "Mar 2022 – Present", years: 4.5, responsibilities: ["Migrated the codebase to TypeScript", "Built a component library", "Worked on performance"] },
    { company: "Northwind Labs", role: "Frontend Developer", duration: "Jun 2019 – Feb 2022", years: 2.7, responsibilities: ["Developed UI features for a SaaS dashboard", "Helped with code reviews"] },
  ],
  projects: [{ name: "OpenBoard", description: "Open-source kanban board with offline sync", technologies: ["React", "TypeScript", "IndexedDB"] }],
  education: [{ degree: "B.Sc.", field: "Computer Science", institution: "University of Michigan", year: "2019" }],
  certifications: [],
  languages: ["English (native)", "Spanish (B2)"],
  total_years_experience: 7,
  quantified_metrics: [],
};

const optimizedStructured = {
  ...parsed,
  summary: "Senior frontend engineer with 7 years of experience shipping fast, accessible React and TypeScript products. Led a TypeScript migration and a shared component library adopted by 6 teams, and cut page load times by [X%].",
  experience: [
    { ...parsed.experience[0], responsibilities: [
      "Led the migration of a 120k-line JavaScript codebase to TypeScript, reducing production bugs by [X%] and speeding up onboarding.",
      "Architected a React + Tailwind CSS component library adopted by 6 product teams, standardising accessibility and design tokens.",
      "Improved Core Web Vitals across 40 pages by code-splitting routes and optimising images, cutting LCP from 3.8s to 1.6s.",
    ] },
    { ...parsed.experience[1], responsibilities: [
      "Delivered responsive dashboard features in React for a SaaS product serving [N] monthly users.",
      "Raised code quality through structured code reviews and Jest test coverage for critical flows.",
    ] },
  ],
  changes_made: [
    { type: "rewritten_summary", location: "Summary", before: parsed.summary, after: "Senior frontend engineer with 7 years of experience shipping fast, accessible React and TypeScript products…" },
    { type: "added_metrics", location: "Brightlane — bullet 3", before: "Worked on performance", after: "Improved Core Web Vitals across 40 pages by code-splitting routes and optimising images, cutting LCP from 3.8s to 1.6s." },
    { type: "stronger_verb", location: "Northwind Labs — bullet 2", before: "Helped with code reviews", after: "Raised code quality through structured code reviews and Jest test coverage for critical flows." },
  ],
};

const days = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const analysis = (id: string, score: number, grade: string, ago: number, extra: Record<string, unknown> = {}) => ({
  id, resume_id: RESUME_ID, user_id: USER_ID, job_role: "frontend-engineer", overall_score: score, grade,
  skill_score: Math.min(100, score + 12), experience_score: Math.min(100, score + 8), project_score: score - 10,
  education_score: 95, impact_score: Math.max(0, score - 30), missing_skills: score > 80 ? [] : ["Testing"],
  strengths: ["Covers 6 of 6 core skills for Frontend Engineer", "7+ years of experience meets the 2-year bar"],
  recommendations: ["Quantify outcomes — add numbers, percentages or time saved to your bullets", "Mirror the job description's language where truthful: GraphQL, Playwright"],
  problems: [], structure_issues: [], job_description: null, job_match: null, created_at: days(ago), ...extra,
});

export const LATEST_ANALYSIS_ID = "00000000-0000-4000-8000-0000000000b4";
export const OPTIMIZATION_ID = "00000000-0000-4000-8000-0000000000c1";

const tables: Record<string, Record<string, unknown>[]> = {
  profiles: [{ id: "p1", user_id: USER_ID, name: "Alex Morgan", role: "candidate", created_at: days(60), updated_at: days(60) }],
  user_roles: [],
  resumes: [{ id: RESUME_ID, user_id: USER_ID, file_name: "alex-morgan.pdf", file_path: `${USER_ID}/alex-morgan.pdf`, original_text: "Alex Morgan\nFrontend engineer…", parsed_json: parsed, created_at: days(30) }],
  analyses: [
    analysis(LATEST_ANALYSIS_ID, 84, "B", 1, {
      job_description: "Senior Frontend Engineer — React, TypeScript, GraphQL, Playwright, accessibility.",
      job_match: { score: 67, matched: ["React", "TypeScript", "Accessibility", "Performance Optimization"], missing: ["GraphQL", "Playwright"], total: 6 },
      problems: [
        { type: "missing_quantification", severity: "critical", location: "Experience — Brightlane — bullet 3", issue: "Performance work has no measurable result", original_text: "Worked on performance", fix: "Improved Core Web Vitals across [N] pages, cutting LCP from [X]s to [Y]s." },
        { type: "weak_action_verb", severity: "major", location: "Experience — Northwind Labs — bullet 2", issue: "\"Helped with\" undersells ownership", original_text: "Helped with code reviews", fix: "Led structured code reviews for a team of [N] engineers." },
        { type: "missing_keywords", severity: "minor", location: "Skills", issue: "GraphQL and Playwright from the job post are missing", original_text: "JavaScript, TypeScript, React…", fix: "Add GraphQL and Playwright if you have used them." },
      ],
      structure_issues: ["Projects section appears after Education — move it above for a frontend role."],
    }),
    analysis("00000000-0000-4000-8000-0000000000b3", 76, "C", 8),
    analysis("00000000-0000-4000-8000-0000000000b2", 68, "D", 16),
    analysis("00000000-0000-4000-8000-0000000000b1", 58, "F", 27),
  ],
  optimized_resumes: [{
    id: OPTIMIZATION_ID, resume_id: RESUME_ID, analysis_id: LATEST_ANALYSIS_ID, user_id: USER_ID, job_role: "frontend-engineer",
    optimized_text: JSON.stringify({ text: "", structured: optimizedStructured, suggestions: ["If you have used GraphQL in production, add it with a bullet that shows how.", "If you have written Playwright tests, list Playwright under Tools."], mode: "both" }),
    before_score: 84, after_score: 91, improvement_percentage: 7, created_at: days(1), updated_at: days(1),
  }],
};

function filterRows(table: string, url: URL): Record<string, unknown>[] {
  let rows = tables[table] ?? [];
  for (const [key, value] of url.searchParams) {
    if (value.startsWith("eq.")) rows = rows.filter((r) => String(r[key]) === value.slice(3));
  }
  const order = url.searchParams.get("order");
  if (order?.startsWith("created_at.asc")) rows = [...rows].reverse();
  return rows;
}

async function handleRest(route: Route) {
  const req = route.request();
  const url = new URL(req.url());
  const table = url.pathname.split("/rest/v1/")[1];
  const rows = filterRows(table, url);
  const headers = { "content-type": "application/json", "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}`, "access-control-expose-headers": "content-range" };
  if (req.method() === "HEAD") return route.fulfill({ status: 200, headers });
  if (req.method() !== "GET") return route.fulfill({ status: 200, headers, body: JSON.stringify(rows.slice(0, 1)) });
  const single = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
  if (single) {
    return rows[0]
      ? route.fulfill({ status: 200, headers, body: JSON.stringify(rows[0]) })
      : route.fulfill({ status: 406, headers, body: JSON.stringify({ code: "PGRST116", message: "no rows" }) });
  }
  return route.fulfill({ status: 200, headers, body: JSON.stringify(rows) });
}

/** Sign in a fake user and serve fixture data for every Supabase call. */
export async function useMockBackend(page: Page) {
  const key = `sb-${supabaseRef()}-auth-token`;
  const session = fakeSession();
  await page.addInitScript(([k, v]) => window.localStorage.setItem(k, v), [key, JSON.stringify(session)] as const);
  await page.route("**/rest/v1/**", handleRest);
  await page.route("**/auth/v1/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session.user) }));
  await page.route("**/storage/v1/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/functions/v1/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
}
