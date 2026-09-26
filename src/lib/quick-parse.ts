// Deterministic, offline parser for pasted resume text. Powers the public ATS
// checker, which runs entirely in the browser (no upload, no AI call).
import type { ParsedResume } from "@/lib/scoring";

type Section = "header" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "other";

const HEADINGS: [Section, RegExp][] = [
  ["summary", /^(professional\s+)?(summary|profile|objective|about( me)?)$/i],
  ["experience", /^(work\s+|professional\s+|relevant\s+)?(experience|employment( history)?|work history|career history)$/i],
  ["education", /^(education|academic background|education & training|qualifications)$/i],
  ["skills", /^((technical|core|key)\s+)?(skills|competencies|technologies|tech stack|tools)( & tools| and tools)?$/i],
  ["projects", /^(personal\s+|selected\s+|key\s+)?projects$/i],
  ["certifications", /^(certifications?|licenses?( & certifications)?|courses)$/i],
  ["languages", /^languages?$/i],
  ["other", /^(awards|honors|interests|hobbies|volunteering|publications|references)$/i],
];

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const MONTH = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const POINT = `(?:(?:${MONTH})\\s+)?(?:(\\d{1,2})[/.])?((?:19|20)\\d{2})`;
const RANGE_RE = new RegExp(`${POINT}\\s*(?:-|–|—|to|until)\\s*(?:${POINT}|(present|current|now|today|ongoing))`, "gi");
const HAS_RANGE_RE = new RegExp(RANGE_RE.source, "i");
const BULLET_RE = /^\s*(?:[-•·*▪●◦–]|\d+[.)])\s+/;

function headingFor(line: string): Section | null {
  const clean = line.replace(/[:\-–—_=|#*]+$/g, "").replace(/^[#*\s]+/, "").trim();
  if (!clean || clean.length > 40) return null;
  for (const [section, re] of HEADINGS) if (re.test(clean)) return section;
  return null;
}

function toMonthIndex(monthName: string | undefined, monthNum: string | undefined, year: string): number {
  const m = monthName ? MONTHS[monthName.slice(0, 4).toLowerCase().replace(/\.$/, "")] ?? MONTHS[monthName.slice(0, 3).toLowerCase()] ?? 0
    : monthNum ? Math.min(11, Math.max(0, Number(monthNum) - 1)) : 0;
  return Number(year) * 12 + m;
}

/** Total years covered by date ranges, counting overlapping periods once. */
export function yearsFromRanges(text: string, now = new Date()): number {
  const intervals: [number, number][] = [];
  const current = now.getFullYear() * 12 + now.getMonth();
  for (const m of text.matchAll(RANGE_RE)) {
    const start = toMonthIndex(m[1], m[2], m[3]);
    // Half-open [start, end): an explicit end month counts in full, a year-only end
    // means through December, and "Present" runs up to the current month.
    const end = m[7] ? current : toMonthIndex(m[4], m[5], m[6]) + (m[4] || m[5] ? 1 : 12);
    if (end > start && end - start < 50 * 12) intervals.push([start, end]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let months = 0;
  let cursor = -Infinity;
  for (const [s, e] of intervals) {
    const from = Math.max(s, cursor);
    if (e > from) months += e - from;
    cursor = Math.max(cursor, e);
  }
  return Math.round((months / 12) * 10) / 10;
}

const splitList = (line: string) => line.split(/[,;|•·]|\s\/\s/).map((s) => s.replace(/^[^:]{1,25}:\s*/, "").trim()).filter((s) => s && s.length <= 40);

/**
 * Parse pasted resume text. `now` is the reference date for "Present" ranges;
 * pass a fixed date for reproducible results (ongoing roles grow over time).
 */
export function quickParse(text: string, now: Date = new Date()): ParsedResume {
  const lines = String(text ?? "").replace(/\r/g, "").split("\n").map((l) => l.trim());
  const sections: Record<Section, string[]> = { header: [], summary: [], experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], other: [] };
  let current: Section = "header";
  for (const line of lines) {
    if (!line) continue;
    const heading = headingFor(line);
    if (heading) { current = heading; continue; }
    sections[current].push(line);
  }
  // No headings at all: treat the whole thing as experience so bullets still count.
  if (Object.entries(sections).every(([k, v]) => k === "header" || v.length === 0)) {
    sections.experience = sections.header.slice(1);
    sections.header = sections.header.slice(0, 1);
  }

  const experienceText = sections.experience.join("\n");
  const bullets = sections.experience
    .filter((l) => BULLET_RE.test(l) || (l.length > 60 && !HAS_RANGE_RE.test(l)))
    .map((l) => l.replace(BULLET_RE, "").trim());

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/\+?\d[\d\s().-]{7,}\d/)?.[0]?.trim() ?? "";

  return {
    contact: { name: sections.header[0] ?? "", email, phone },
    summary: sections.summary.join(" "),
    skills: [...new Set(sections.skills.flatMap(splitList))],
    tools: [],
    experience: bullets.length || experienceText ? [{ company: "", role: "", duration: "", responsibilities: bullets }] : [],
    projects: sections.projects
      .filter((l) => l.length > 15)
      .map((l) => ({ name: l.replace(BULLET_RE, "").split(/[:—–-]/)[0].trim().slice(0, 60), description: l.replace(BULLET_RE, ""), technologies: [] })),
    education: sections.education
      .filter((l) => /\b(bachelor|master|phd|ph\.d|doctor|associate|b\.?sc|m\.?sc|b\.?s|m\.?s|b\.?a|m\.?a|mba|beng|meng|diploma|degree|university|college)\b/i.test(l))
      .map((l) => ({ degree: l, institution: "", year: l.match(/(19|20)\d{2}/)?.[0] ?? "", field: l })),
    certifications: sections.certifications.map((l) => l.replace(BULLET_RE, "")),
    languages: sections.languages.flatMap(splitList),
    total_years_experience: yearsFromRanges(experienceText || text, now),
    quantified_metrics: [],
  };
}

export const SAMPLE_RESUME = `Alex Morgan
alex.morgan@example.com | +1 555 010 2030 | linkedin.com/in/alexmorgan

Summary
Frontend engineer with 5 years of experience building fast, accessible React applications.

Experience
Senior Frontend Engineer — Brightlane, Remote
Mar 2022 – Present
• Led migration of a 120k-line JavaScript codebase to TypeScript, cutting production bugs by 35%
• Built a component library in React and Tailwind CSS used by 6 product teams
• Improved Core Web Vitals, reducing LCP from 3.8s to 1.6s across 40 pages

Frontend Developer — Northwind Labs
Jun 2019 – Feb 2022
• Developed responsive UI features for a SaaS dashboard with 20k monthly users
• Worked with designers on accessibility fixes
• Helped with code reviews

Projects
• OpenBoard — open-source kanban board in React and TypeScript with offline sync; 1.2k GitHub stars
• Lighthouse CI dashboard tracking performance budgets for 12 sites

Skills
JavaScript, TypeScript, React, HTML, CSS, Git, Tailwind CSS, Jest

Education
B.Sc. Computer Science — University of Michigan, 2019
`;
