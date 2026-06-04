// HTML-to-PDF resume rendering using real CSS so text never gets cut off.
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type ResumeTemplate =
  | "ats" | "executive" | "modern" | "minimal" | "creative" | "tech"
  | "elegant" | "bold" | "editorial" | "compact";

export interface ChangeItem { type: string; location: string; before: string; after: string; }

export interface ResumeData {
  contact: { name: string; email: string; phone: string; location?: string; linkedin?: string; github?: string; telegram?: string; website?: string; portfolio?: string; };
  summary?: string;
  education: { degree: string; institution: string; year: string; field?: string; description?: string }[];
  skills: string[];
  tools: string[];
  experience: { company: string; role: string; duration: string; years?: number; responsibilities: string[] }[];
  projects: { name: string; description: string; technologies: string[] }[];
  certifications: string[];
  total_years_experience?: number;
  quantified_metrics?: string[];
  languages?: string[];
  interests?: string[];
  changes_made?: ChangeItem[];
}

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value.filter(Boolean) as T[] : [];

function compactObject(value: Record<string, unknown> | null | undefined): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value || {}).filter(([, v]) => String(v ?? "").trim().length > 0));
}

function extractContactFromText(text: string): Partial<ResumeData["contact"]> {
  const firstLine = text.split("\n").map((line) => line.trim()).find(Boolean);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,;]+/i)?.[0];
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,;]+/i)?.[0];
  const website = text.match(/(?:https?:\/\/)?(?:www\.)?(?!linkedin\.com|github\.com)[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|,;]*)?/i)?.[0];
  return compactObject({ name: firstLine, email, phone, linkedin, github, website }) as Partial<ResumeData["contact"]>;
}

function extractLanguagesFromText(text: string): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => /^languages?\b|^language proficiency\b/i.test(line) && !/programming|core|technical/i.test(line));
  if (headerIndex === -1) return [];
  const first = lines[headerIndex].replace(/^languages?\b\s*:?|^language proficiency\b\s*:?/i, "").trim();
  const following: string[] = first ? [first] : [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (/^[A-Z][A-Z\s/&-]{3,}$/.test(line) || /^(summary|experience|work experience|education|projects|skills|technical skills|certifications|awards|interests)\b/i.test(line)) break;
    following.push(line);
  }
  return following.join(", ").split(/[,;|•·]/).map((item) => item.trim()).filter(Boolean);
}

function uniqueStrings(items: unknown[]): string[] {
  const seen = new Set<string>();
  return items.flatMap((item) => asArray<string>(item)).filter((item) => {
    const key = String(item).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeByKey<T>(fallback: T[], primary: T[], keyFn: (item: T) => string): T[] {
  const map = new Map<string, T>();
  [...fallback, ...primary].forEach((item) => map.set(keyFn(item).toLowerCase(), item));
  return Array.from(map.values());
}

function normalizeResumeData(data: Partial<ResumeData> | null | undefined, sourceText = ""): ResumeData {
  const contact = { ...extractContactFromText(sourceText), ...compactObject(data?.contact as Record<string, unknown> | undefined) } as ResumeData["contact"];
  return {
    contact: {
      name: contact.name || "Your Name",
      email: contact.email || "",
      phone: contact.phone || "",
      location: contact.location,
      linkedin: contact.linkedin,
      github: contact.github,
      telegram: contact.telegram,
      website: contact.website,
      portfolio: contact.portfolio,
    },
    summary: data?.summary || "",
    education: asArray<ResumeData["education"][number]>(data?.education),
    skills: asArray<string>(data?.skills),
    tools: asArray<string>(data?.tools),
    experience: asArray<ResumeData["experience"][number]>(data?.experience),
    projects: asArray<ResumeData["projects"][number]>(data?.projects),
    certifications: asArray<string>(data?.certifications),
    total_years_experience: data?.total_years_experience,
    quantified_metrics: asArray<string>(data?.quantified_metrics),
    languages: uniqueStrings([extractLanguagesFromText(sourceText), data?.languages]),
    interests: asArray<string>(data?.interests),
    changes_made: asArray<ChangeItem>(data?.changes_made),
  };
}

export function hydrateResumeData(data: Partial<ResumeData> | null | undefined, sourceText = "", fallback?: Partial<ResumeData> | null): ResumeData {
  const primary = normalizeResumeData(data, sourceText);
  const original = normalizeResumeData(fallback, sourceText);
  return {
    ...primary,
    contact: { ...original.contact, ...compactObject(primary.contact as unknown as Record<string, unknown>) } as ResumeData["contact"],
    education: mergeByKey(original.education, primary.education, (e) => `${e.degree}|${e.institution}|${e.year}`),
    skills: uniqueStrings([original.skills, primary.skills]),
    tools: uniqueStrings([original.tools, primary.tools]),
    experience: mergeByKey(original.experience, primary.experience, (e) => `${e.role}|${e.company}|${e.duration}`),
    projects: mergeByKey(original.projects, primary.projects, (p) => p.name || p.description),
    certifications: uniqueStrings([original.certifications, primary.certifications]),
    quantified_metrics: uniqueStrings([original.quantified_metrics, primary.quantified_metrics]),
    languages: uniqueStrings([original.languages, primary.languages]),
    interests: uniqueStrings([original.interests, primary.interests]),
  };
}

export function parseOptimizedPayload(raw: string): { text: string; structured: ResumeData } | null {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object" && p.structured) return { text: p.text || "", structured: hydrateResumeData(p.structured, p.text || "") };
  } catch { /* legacy */ }
  return null;
}

export function getTemplateList() {
  return [
    { id: "ats" as ResumeTemplate, name: "ATS Plain (Text Only)", description: "Pure black & white, Times New Roman — maximum ATS compatibility" },
    { id: "executive" as ResumeTemplate, name: "Executive", description: "Navy + gold, two-column — C-suite ready" },
    { id: "modern" as ResumeTemplate, name: "Modern", description: "Dark sidebar, gradient accents — 2026 trend" },
    { id: "minimal" as ResumeTemplate, name: "Minimal", description: "Editorial whitespace, hairline rules" },
    { id: "creative" as ResumeTemplate, name: "Creative", description: "Bold gradient header, designer feel" },
    { id: "tech" as ResumeTemplate, name: "Tech", description: "IDE-inspired mono accents" },
    { id: "elegant" as ResumeTemplate, name: "Elegant", description: "Serif headlines, refined" },
    { id: "bold" as ResumeTemplate, name: "Bold", description: "Dark header, coral accents" },
    { id: "editorial" as ResumeTemplate, name: "Editorial", description: "Magazine-style, large type" },
    { id: "compact" as ResumeTemplate, name: "Compact", description: "Dense single-page" },
  ];
}

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function contactBits(c: ResumeData["contact"]): string[] {
  const p: string[] = [];
  if (c.email) p.push(esc(c.email));
  if (c.phone) p.push(esc(c.phone));
  if (c.location) p.push(esc(c.location));
  if (c.linkedin) p.push(esc(c.linkedin));
  if (c.github) p.push(esc(c.github));
  if (c.telegram) p.push(esc(c.telegram));
  if (c.website) p.push(esc(c.website));
  if (c.portfolio) p.push(esc(c.portfolio));
  return p;
}

const baseCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .resume { width: 210mm; min-height: 297mm; height: auto; background: #fff; color: #1f2937;
            font-family: 'Inter','Helvetica Neue',Arial,sans-serif; font-size: 10.5px; line-height: 1.5;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: visible; }
  .resume, .resume * { max-height: none !important; overflow: visible !important; }
  .resume ul { list-style: none; }
  .resume li, .resume .block, .resume .exp { page-break-inside: avoid; break-inside: avoid; }
  .resume p, .resume li, .resume span, .resume div { overflow-wrap: anywhere; word-break: normal; white-space: normal; }
  .exp-head, .ats-row, .head { gap: 8px; flex-wrap: wrap; }
  .chip { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 9.5px; line-height: 1.4; margin: 0 4px 4px 0; }
`;

function bulletItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => bulletItems(item));
  return String(value ?? "")
    .split(/\n|(?=\s*[•·]\s+)|(?=\s+-\s+)/g)
    .map((item) => item.replace(/^[-•·]\s*/, "").trim())
    .filter(Boolean);
}

const bullets = (items: unknown) => bulletItems(items).map((b) => `<li>${esc(b)}</li>`).join("");

function projectBullets(p: ResumeData["projects"][number]): string {
  const descriptionItems = bulletItems(p.description);
  const technologyItems = asArray<string>(p.technologies).map((t) => `Technology: ${t}`);
  return bullets([...descriptionItems, ...technologyItems]);
}

function executiveHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family: 'Lora','Georgia',serif; color: #0f172a; padding: 18mm 16mm; }
    .name { font-family: 'Playfair Display','Lora',serif; font-size: 32px; letter-spacing: .5px; color: #0a2540; }
    .role-tag { font-family:'Inter',sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#b8860b; margin-top:4px; }
    .header-rule { height: 3px; background: linear-gradient(90deg,#0a2540 0%,#b8860b 100%); margin: 12px 0 4px; }
    .contact { font-family:'Inter',sans-serif; font-size: 9.5px; color:#475569; margin-top: 6px; }
    .section-title { font-family:'Inter',sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color:#0a2540; margin: 18px 0 8px; border-bottom: 1px solid #d4af37; padding-bottom: 4px; font-weight:700; }
    .summary { font-style: italic; font-size: 11px; line-height: 1.65; color:#1e293b; }
    .exp { margin-bottom: 12px; }
    .exp-head { display:flex; justify-content:space-between; align-items:baseline; }
    .exp-role { font-size: 12px; font-weight: 700; color:#0a2540; font-family:'Inter',sans-serif; }
    .exp-date { font-size: 9.5px; color:#64748b; font-family:'Inter',sans-serif; }
    .exp-co { font-family:'Inter',sans-serif; font-size: 10.5px; color:#b8860b; font-style: italic; margin: 2px 0 5px; }
    .exp ul { padding-left: 14px; }
    .exp li { font-family:'Inter',sans-serif; font-size: 10px; list-style: '\u25C6  '; margin-bottom: 4px; color:#334155; }
    .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .skill-grid { display:flex; flex-wrap:wrap; font-family:'Inter',sans-serif; }
    .skill-grid .chip { background:#f8f4e8; color:#0a2540; border:1px solid #e6d59a; }
    .edu-item { font-family:'Inter',sans-serif; margin-bottom: 8px; }
    .edu-degree { font-weight: 700; color:#0a2540; font-size: 10.5px; }
    .edu-inst { font-size: 10px; color:#475569; font-style: italic; }
    .edu-year { font-size: 9.5px; color:#64748b; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)}</div><div class="exp-date">${esc(e.duration)}</div></div><div class="exp-co">${esc(e.company)}</div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  const proj = d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" • "))}</div><ul>${projectBullets(p)}</ul></div>`).join("");
  const edu = d.education.map((e) => `<div class="edu-item block"><div class="edu-degree">${esc(e.degree)}${e.field ? " — " + esc(e.field) : ""}</div><div class="edu-inst">${esc(e.institution)} <span class="edu-year">· ${esc(e.year)}</span></div></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="block"><div class="name">${esc(d.contact.name || "Your Name")}</div><div class="role-tag">Executive Professional</div><div class="header-rule"></div><div class="contact">${contactBits(d.contact).join("  ·  ")}</div></div>
    ${d.summary ? `<div class="block"><div class="section-title">Profile</div><p class="summary">${esc(d.summary)}</p></div>` : ""}
    ${exp ? `<div><div class="section-title">Experience</div>${exp}</div>` : ""}
    ${proj ? `<div><div class="section-title">Selected Projects</div>${proj}</div>` : ""}
    <div class="grid2">
      ${d.skills.length || d.tools.length ? `<div class="block"><div class="section-title" style="margin-top:0;">Expertise</div><div class="skill-grid">${[...d.skills, ...d.tools].map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></div>` : ""}
      ${edu ? `<div class="block"><div class="section-title" style="margin-top:0;">Education</div>${edu}</div>` : ""}
    </div>
    ${d.certifications?.length ? `<div class="block"><div class="section-title">Certifications</div><div class="skill-grid">${d.certifications.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>` : ""}
    ${d.languages?.length ? `<div class="block"><div class="section-title">Languages</div><div class="skill-grid">${d.languages.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>` : ""}
  </div>`;
}

function modernHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { display: grid; grid-template-columns: 70mm 1fr; min-height: 297mm; }
    .side { background: linear-gradient(180deg,#0f172a 0%,#1e293b 100%); color:#e2e8f0; padding: 16mm 10mm; }
    .main { padding: 16mm 14mm 16mm 12mm; color:#0f172a; }
    .name { font-size: 24px; font-weight: 800; color:#fff; line-height: 1.15; }
    .role-tag { font-size: 9.5px; letter-spacing:2px; text-transform:uppercase; color:#7dd3fc; margin-top:6px; font-weight:600; }
    .side .section-title { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color:#7dd3fc; margin: 18px 0 8px; font-weight:700; }
    .side .contact-item { font-size: 9.5px; color:#cbd5e1; margin: 4px 0; overflow-wrap: anywhere; }
    .side .chip { background: rgba(125,211,252,.12); color:#7dd3fc; border:1px solid rgba(125,211,252,.25); }
    .side .edu-item { font-size: 9.5px; margin-bottom: 8px; color:#cbd5e1; }
    .side .edu-item b { color:#fff; display:block; font-size: 10px; margin-bottom: 2px; }
    .main .section-title { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color:#0f172a; margin: 0 0 10px; font-weight:800; border-bottom: 2px solid #0ea5e9; padding-bottom: 4px; display:inline-block; }
    .main .section { margin-bottom: 16px; }
    .summary { font-size: 10.5px; color:#334155; line-height: 1.6; }
    .exp { margin-bottom: 12px; }
    .exp-head { display:flex; justify-content: space-between; align-items: baseline; }
    .exp-role { font-size: 11.5px; font-weight: 800; color:#0f172a; }
    .exp-date { font-size: 9.5px; color:#64748b; font-weight: 600; }
    .exp-co { font-size: 10.5px; color:#0ea5e9; font-weight: 600; margin: 2px 0 5px; }
    .exp li { font-size: 10px; color:#334155; padding-left: 14px; position: relative; margin-bottom: 4px; }
    .exp li::before { content:""; position:absolute; left:0; top:6px; width:6px; height:6px; background:#0ea5e9; border-radius:2px; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)}</div><div class="exp-date">${esc(e.duration)}</div></div><div class="exp-co">${esc(e.company)}</div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  const proj = d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" • "))}</div><ul>${projectBullets(p)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <aside class="side">
      <div class="block"><div class="name">${esc(d.contact.name || "Your Name")}</div><div class="role-tag">Professional</div></div>
      <div class="block"><div class="section-title">Contact</div>${contactBits(d.contact).map((c) => `<div class="contact-item">${c}</div>`).join("")}</div>
      ${d.skills.length ? `<div class="block"><div class="section-title">Skills</div>${d.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
      ${d.tools.length ? `<div class="block"><div class="section-title">Tools</div>${d.tools.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
      ${d.education.length ? `<div class="block"><div class="section-title">Education</div>${d.education.map((e) => `<div class="edu-item"><b>${esc(e.degree)}</b>${esc(e.institution)}<br>${esc(e.year)}</div>`).join("")}</div>` : ""}
      ${d.languages?.length ? `<div class="block"><div class="section-title">Languages</div>${d.languages.map((l) => `<div class="contact-item">${esc(l)}</div>`).join("")}</div>` : ""}
      ${d.certifications?.length ? `<div class="block"><div class="section-title">Certs</div>${d.certifications.map((c) => `<div class="contact-item">${esc(c)}</div>`).join("")}</div>` : ""}
    </aside>
    <main class="main">
      ${d.summary ? `<div class="section block"><div class="section-title">Summary</div><p class="summary">${esc(d.summary)}</p></div>` : ""}
      ${exp ? `<div class="section"><div class="section-title">Experience</div>${exp}</div>` : ""}
      ${proj ? `<div class="section"><div class="section-title">Projects</div>${proj}</div>` : ""}
    </main>
  </div>`;
}

function minimalHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { padding: 22mm 22mm; font-family: 'Inter',sans-serif; color:#111827; }
    .name { font-size: 28px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase; text-align: center; }
    .contact { text-align: center; font-size: 9.5px; color:#6b7280; margin-top: 8px; letter-spacing: 1px; }
    .rule { height: 1px; background: #e5e7eb; margin: 18px 0; }
    .section-title { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color:#111827; margin: 18px 0 10px; font-weight: 600; }
    .summary { font-size: 11px; color:#374151; line-height: 1.7; }
    .exp { margin-bottom: 14px; }
    .exp-head { display:flex; justify-content:space-between; align-items:baseline; border-bottom: 1px dotted #d1d5db; padding-bottom: 3px; margin-bottom: 4px; }
    .exp-role { font-size: 11.5px; font-weight: 700; }
    .exp-co { font-size: 10px; color:#6b7280; font-style: italic; }
    .exp-date { font-size: 9.5px; color:#9ca3af; }
    .exp ul { padding-left: 14px; }
    .exp li { font-size: 10px; list-style: '— '; margin-bottom: 4px; color:#374151; }
    .skill-row { font-size: 10px; color:#374151; line-height: 1.9; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(e.role)}</span><span class="exp-co">  ·  ${esc(e.company)}</span></div><div class="exp-date">${esc(e.duration)}</div></div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="name">${esc(d.contact.name || "Your Name")}</div>
    <div class="contact">${contactBits(d.contact).join("   ·   ")}</div>
    <div class="rule"></div>
    ${d.summary ? `<div class="block"><div class="section-title">Summary</div><p class="summary">${esc(d.summary)}</p></div>` : ""}
    ${exp ? `<div><div class="section-title">Experience</div>${exp}</div>` : ""}
    ${d.projects.length ? `<div><div class="section-title">Projects</div>${d.projects.map((p) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(p.name)}</span><span class="exp-co">  ·  ${esc((p.technologies || []).join(", "))}</span></div></div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
    ${d.skills.length || d.tools.length ? `<div class="block"><div class="section-title">Skills</div><div class="skill-row">${[...d.skills, ...d.tools].map(esc).join("  ·  ")}</div></div>` : ""}
    ${d.education.length ? `<div class="block"><div class="section-title">Education</div>${d.education.map((e) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(e.degree)}</span><span class="exp-co">  ·  ${esc(e.institution)}</span></div><div class="exp-date">${esc(e.year)}</div></div></div>`).join("")}</div>` : ""}
    ${d.languages?.length ? `<div class="block"><div class="section-title">Languages</div><div class="skill-row">${d.languages.map(esc).join("  ·  ")}</div></div>` : ""}
    ${d.certifications?.length ? `<div class="block"><div class="section-title">Certifications</div><div class="skill-row">${d.certifications.map(esc).join("  ·  ")}</div></div>` : ""}
  </div>`;
}

function creativeHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family:'Inter',sans-serif; color:#111827; }
    .header { background: linear-gradient(135deg,#7c3aed 0%,#ec4899 60%,#f97316 100%); padding: 18mm 16mm 14mm; color:#fff; position:relative; overflow:hidden; }
    .name { font-size: 34px; font-weight: 900; letter-spacing:-.5px; }
    .role-tag { font-size: 11px; opacity:.92; margin-top: 4px; font-weight: 500; letter-spacing: 1px; }
    .header .contact { font-size: 9.5px; opacity:.95; margin-top: 10px; }
    .body { padding: 14mm 16mm; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color:#7c3aed; margin: 0 0 10px; font-weight: 800; }
    .summary { font-size: 11px; color:#374151; line-height: 1.65; }
    .exp { margin-bottom: 12px; border-left: 3px solid #ec4899; padding-left: 12px; }
    .exp-head { display:flex; justify-content:space-between; align-items:baseline; }
    .exp-role { font-size: 12px; font-weight: 800; color:#111827; }
    .exp-date { font-size: 9.5px; color:#7c3aed; font-weight: 700; }
    .exp-co { font-size: 10.5px; color:#ec4899; font-weight: 600; margin: 2px 0 5px; }
    .exp li { font-size: 10px; color:#374151; padding-left: 14px; position: relative; margin-bottom: 4px; }
    .exp li::before { content:"\u25B8"; position:absolute; left:0; color:#ec4899; }
    .chip { background: linear-gradient(135deg,#ede9fe,#fce7f3); color:#7c3aed; }
    .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)}</div><div class="exp-date">${esc(e.duration)}</div></div><div class="exp-co">${esc(e.company)}</div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="header block"><div class="name">${esc(d.contact.name || "Your Name")}</div><div class="role-tag">Creative Professional</div><div class="contact">${contactBits(d.contact).join("  ·  ")}</div></div>
    <div class="body">
      ${d.summary ? `<div class="section block"><div class="section-title">About</div><p class="summary">${esc(d.summary)}</p></div>` : ""}
      ${exp ? `<div class="section"><div class="section-title">Experience</div>${exp}</div>` : ""}
      ${d.projects.length ? `<div class="section"><div class="section-title">Projects</div>${d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" · "))}</div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
      <div class="grid2">
        ${d.skills.length || d.tools.length ? `<div class="section block"><div class="section-title">Skills</div>${[...d.skills, ...d.tools].map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
        ${d.education.length ? `<div class="section block"><div class="section-title">Education</div>${d.education.map((e) => `<div style="margin-bottom:6px;"><div style="font-weight:800;font-size:10.5px;">${esc(e.degree)}</div><div style="font-size:10px;color:#7c3aed;">${esc(e.institution)} · ${esc(e.year)}</div></div>`).join("")}</div>` : ""}
      </div>
      ${d.languages?.length ? `<div class="section block"><div class="section-title">Languages</div>${d.languages.map((l) => `<span class="chip">${esc(l)}</span>`).join("")}</div>` : ""}
      ${d.certifications?.length ? `<div class="section block"><div class="section-title">Certifications</div>${d.certifications.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
    </div>
  </div>`;
}

function techHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family: 'Inter',sans-serif; color:#e2e8f0; background: #0b1020; padding: 16mm; }
    .name { font-family:'JetBrains Mono','Menlo',monospace; font-size: 24px; color:#10b981; font-weight: 700; }
    .name::before { content: "$ whoami → "; color:#64748b; font-weight: 400; }
    .role-tag { font-family:'JetBrains Mono',monospace; font-size: 10px; color:#94a3b8; margin-top: 4px; }
    .contact { font-family:'JetBrains Mono',monospace; font-size: 9px; color:#cbd5e1; margin-top: 8px; }
    .contact span { color:#10b981; }
    .section-title { font-family:'JetBrains Mono',monospace; font-size: 11px; color:#10b981; margin: 16px 0 8px; font-weight: 700; }
    .section-title::before { content: "// "; color:#64748b; }
    .summary { font-size: 10.5px; color:#cbd5e1; line-height: 1.6; padding: 10px; background:#0f172a; border-left: 3px solid #10b981; border-radius: 4px; }
    .exp { margin-bottom: 12px; padding: 10px; background:#0f172a; border-radius: 6px; border: 1px solid #1e293b; }
    .exp-head { display:flex; justify-content:space-between; align-items:baseline; }
    .exp-role { font-size: 11.5px; font-weight: 700; color:#fff; }
    .exp-date { font-family:'JetBrains Mono',monospace; font-size: 9px; color:#64748b; }
    .exp-co { font-size: 10px; color:#10b981; margin: 2px 0 6px; font-weight: 600; }
    .exp li { font-size: 10px; color:#cbd5e1; padding-left: 14px; position:relative; margin-bottom: 4px; }
    .exp li::before { content:"\u25B8"; position:absolute; left:0; color:#10b981; }
    .chip { font-family:'JetBrains Mono',monospace; background:rgba(16,185,129,.1); color:#10b981; border:1px solid rgba(16,185,129,.3); font-size:9px; }
    .edu-row { font-size: 10px; color:#cbd5e1; margin-bottom: 6px; }
    .edu-row b { color:#fff; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)}</div><div class="exp-date">${esc(e.duration)}</div></div><div class="exp-co">@ ${esc(e.company)}</div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="block"><div class="name">${esc(d.contact.name || "your_name")}</div><div class="role-tag">// Software Engineer</div><div class="contact">${contactBits(d.contact).map((c) => `<span>▹</span> ${c}`).join("  ")}</div></div>
    ${d.summary ? `<div class="block"><div class="section-title">summary.md</div><div class="summary">${esc(d.summary)}</div></div>` : ""}
    ${exp ? `<div><div class="section-title">experience.log</div>${exp}</div>` : ""}
    ${d.projects.length ? `<div><div class="section-title">projects/</div>${d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" · "))}</div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
    ${d.skills.length || d.tools.length ? `<div class="block"><div class="section-title">stack.json</div>${[...d.skills, ...d.tools].map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
    ${d.education.length ? `<div class="block"><div class="section-title">education.yml</div>${d.education.map((e) => `<div class="edu-row block"><b>${esc(e.degree)}</b> — ${esc(e.institution)} <span style="color:#64748b">(${esc(e.year)})</span></div>`).join("")}</div>` : ""}
    ${d.languages?.length ? `<div class="block"><div class="section-title">languages.yml</div>${d.languages.map((l) => `<span class="chip">${esc(l)}</span>`).join("")}</div>` : ""}
    ${d.certifications?.length ? `<div class="block"><div class="section-title">certs.yml</div>${d.certifications.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
  </div>`;
}

function elegantHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family: 'Lora','Georgia',serif; color:#1f2937; padding: 22mm 20mm; }
    .name { font-family:'Playfair Display','Lora',serif; font-size: 36px; font-weight: 400; text-align: center; font-style: italic; }
    .ornament { text-align:center; color:#9ca3af; margin: 4px 0 8px; font-size: 14px; letter-spacing: 8px; }
    .contact { text-align:center; font-family:'Inter',sans-serif; font-size: 9.5px; color:#6b7280; }
    .section-title { font-family:'Playfair Display',serif; font-size: 16px; font-style: italic; color:#1f2937; margin: 20px 0 8px; text-align:center; }
    .summary { font-size: 11.5px; line-height: 1.75; text-align: center; font-style: italic; color:#374151; max-width: 150mm; margin: 0 auto; }
    .exp { margin-bottom: 14px; }
    .exp-head { text-align:center; margin-bottom: 4px; }
    .exp-role { font-size: 12px; font-weight: 700; color:#1f2937; }
    .exp-co { font-family:'Inter',sans-serif; font-size: 10px; color:#6b7280; font-style: italic; }
    .exp-date { font-family:'Inter',sans-serif; font-size: 9.5px; color:#9ca3af; }
    .exp ul { padding-left: 18px; }
    .exp li { font-family:'Inter',sans-serif; font-size: 10.5px; list-style: none; margin-bottom: 5px; color:#374151; position: relative; }
    .exp li::before { content:"\u2756"; position:absolute; left:-16px; color:#9ca3af; }
    .skill-row { text-align:center; font-family:'Inter',sans-serif; font-size: 10.5px; color:#374151; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)}</div><div class="exp-co">${esc(e.company)} · <span class="exp-date">${esc(e.duration)}</span></div></div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="block"><div class="name">${esc(d.contact.name || "Your Name")}</div><div class="ornament">· · ·</div><div class="contact">${contactBits(d.contact).join("   ·   ")}</div></div>
    ${d.summary ? `<div class="block"><div class="section-title">Profile</div><p class="summary">${esc(d.summary)}</p></div>` : ""}
    ${exp ? `<div><div class="section-title">Experience</div>${exp}</div>` : ""}
    ${d.projects.length ? `<div><div class="section-title">Projects</div>${d.projects.map((p) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" · "))}</div></div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
    ${d.skills.length || d.tools.length ? `<div class="block"><div class="section-title">Expertise</div><div class="skill-row">${[...d.skills, ...d.tools].map(esc).join("  ·  ")}</div></div>` : ""}
    ${d.education.length ? `<div class="block"><div class="section-title">Education</div>${d.education.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.degree)}</div><div class="exp-co">${esc(e.institution)} · <span class="exp-date">${esc(e.year)}</span></div></div></div>`).join("")}</div>` : ""}
    ${d.languages?.length ? `<div class="block"><div class="section-title">Languages</div><div class="skill-row">${d.languages.map(esc).join("  ·  ")}</div></div>` : ""}
    ${d.certifications?.length ? `<div class="block"><div class="section-title">Certifications</div><div class="skill-row">${d.certifications.map(esc).join("  ·  ")}</div></div>` : ""}
  </div>`;
}

function boldHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family:'Inter',sans-serif; color:#1f2937; }
    .header { background:#111827; color:#fff; padding: 18mm 16mm; }
    .name { font-size: 36px; font-weight: 900; line-height: 1; }
    .role-tag { color:#f97316; font-weight: 800; font-size: 12px; letter-spacing:2px; text-transform:uppercase; margin-top: 6px; }
    .header .contact { color:#d1d5db; font-size: 9.5px; margin-top: 10px; }
    .body { padding: 14mm 16mm; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color:#111827; margin: 0 0 10px; font-weight: 900; border-left: 4px solid #f97316; padding-left: 8px; }
    .summary { font-size: 11px; color:#374151; line-height: 1.65; }
    .exp { margin-bottom: 12px; }
    .exp-head { display:flex; justify-content:space-between; align-items:baseline; }
    .exp-role { font-size: 12px; font-weight: 800; color:#111827; }
    .exp-date { font-size: 9.5px; color:#f97316; font-weight: 700; }
    .exp-co { font-size: 10.5px; color:#4b5563; font-weight: 600; margin: 2px 0 5px; }
    .exp li { font-size: 10px; color:#374151; padding-left: 14px; position:relative; margin-bottom: 4px; }
    .exp li::before { content:"\u25AA"; position:absolute; left:0; color:#f97316; }
    .chip { background:#111827; color:#fff; font-weight: 600; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)}</div><div class="exp-date">${esc(e.duration)}</div></div><div class="exp-co">${esc(e.company)}</div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="header block"><div class="name">${esc(d.contact.name || "Your Name")}</div><div class="role-tag">Professional</div><div class="contact">${contactBits(d.contact).join("  ·  ")}</div></div>
    <div class="body">
      ${d.summary ? `<div class="section block"><div class="section-title">Summary</div><p class="summary">${esc(d.summary)}</p></div>` : ""}
      ${exp ? `<div class="section"><div class="section-title">Experience</div>${exp}</div>` : ""}
      ${d.projects.length ? `<div class="section"><div class="section-title">Projects</div>${d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" · "))}</div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
      ${d.skills.length || d.tools.length ? `<div class="section block"><div class="section-title">Skills</div>${[...d.skills, ...d.tools].map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
      ${d.education.length ? `<div class="section block"><div class="section-title">Education</div>${d.education.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.degree)}</div><div class="exp-date">${esc(e.year)}</div></div><div class="exp-co">${esc(e.institution)}</div></div>`).join("")}</div>` : ""}
      ${d.languages?.length ? `<div class="section block"><div class="section-title">Languages</div>${d.languages.map((l) => `<span class="chip">${esc(l)}</span>`).join("")}</div>` : ""}
      ${d.certifications?.length ? `<div class="section block"><div class="section-title">Certifications</div>${d.certifications.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
    </div>
  </div>`;
}

function editorialHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family:'Inter',sans-serif; color:#1f2937; padding: 16mm 18mm; }
    .top { display:grid; grid-template-columns: 2fr 1fr; gap: 18px; border-bottom: 4px solid #111827; padding-bottom: 12px; margin-bottom: 14px; }
    .name { font-family:'Playfair Display',serif; font-size: 44px; font-weight: 900; line-height: .95; letter-spacing:-1px; }
    .role-tag { font-size: 10px; letter-spacing:3px; text-transform:uppercase; color:#6b7280; margin-top: 8px; }
    .top-right { font-size: 9.5px; color:#374151; line-height: 1.8; }
    .lead { font-family:'Playfair Display',serif; font-size: 14px; font-style: italic; color:#1f2937; line-height: 1.5; margin-bottom: 14px; border-left: 3px solid #111827; padding-left: 12px; }
    .cols { display:grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .section-title { font-family:'Playfair Display',serif; font-size: 18px; font-weight: 900; margin: 0 0 8px; color:#111827; }
    .exp { margin-bottom: 12px; }
    .exp-role { font-size: 12px; font-weight: 800; }
    .exp-co { font-size: 10.5px; color:#6b7280; font-style: italic; margin: 2px 0 4px; }
    .exp-date { font-size: 9.5px; color:#9ca3af; }
    .exp ul { padding-left: 14px; }
    .exp li { font-size: 10.5px; margin-bottom: 4px; color:#374151; }
    .chip { background:#f3f4f6; color:#111827; }
    .side-block { margin-bottom: 14px; }
    .side-block b { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color:#9ca3af; display:block; margin-bottom: 4px; }
    .side-block .item { font-size: 10px; color:#374151; margin-bottom: 6px; }
    .side-block .item strong { color:#111827; display:block; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-role">${esc(e.role)}</div><div class="exp-co">${esc(e.company)} · <span class="exp-date">${esc(e.duration)}</span></div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="top block">
      <div><div class="name">${esc(d.contact.name || "Your Name")}</div><div class="role-tag">Portfolio &amp; Career Story</div></div>
      <div class="top-right">${contactBits(d.contact).map((c) => `<div>${c}</div>`).join("")}</div>
    </div>
    ${d.summary ? `<p class="lead block">${esc(d.summary)}</p>` : ""}
    <div class="cols">
      <div>
        ${exp ? `<div class="block"><div class="section-title">Experience</div>${exp}</div>` : ""}
        ${d.projects.length ? `<div class="block" style="margin-top:14px;"><div class="section-title">Projects</div>${d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)}</div><div class="exp-co">${esc((p.technologies || []).join(" · "))}</div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
      </div>
      <aside>
        ${d.skills.length || d.tools.length ? `<div class="side-block block"><b>Skills</b>${[...d.skills, ...d.tools].map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
        ${d.education.length ? `<div class="side-block block"><b>Education</b>${d.education.map((e) => `<div class="item"><strong>${esc(e.degree)}</strong>${esc(e.institution)} · ${esc(e.year)}</div>`).join("")}</div>` : ""}
        ${d.certifications?.length ? `<div class="side-block block"><b>Certifications</b>${d.certifications.map((c) => `<div class="item">${esc(c)}</div>`).join("")}</div>` : ""}
        ${d.languages?.length ? `<div class="side-block block"><b>Languages</b>${d.languages.map((c) => `<div class="item">${esc(c)}</div>`).join("")}</div>` : ""}
      </aside>
    </div>
  </div>`;
}

function compactHtml(d: ResumeData): string {
  const css = `${baseCss}
    .resume { font-family:'Inter',sans-serif; padding: 12mm 14mm; font-size: 9.5px; line-height: 1.4; }
    .head { display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 2px solid #111827; padding-bottom: 6px; margin-bottom: 8px; }
    .name { font-size: 20px; font-weight: 900; }
    .head .contact { font-size: 8.5px; color:#6b7280; text-align:right; line-height: 1.5; }
    .section-title { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color:#2563eb; font-weight: 800; margin: 8px 0 4px; }
    .summary { font-size: 9.5px; color:#374151; }
    .exp { margin-bottom: 6px; }
    .exp-head { display:flex; justify-content:space-between; }
    .exp-role { font-size: 10px; font-weight: 700; }
    .exp-co { font-size: 9px; color:#2563eb; }
    .exp-date { font-size: 8.5px; color:#9ca3af; }
    .exp ul { padding-left: 12px; }
    .exp li { font-size: 9px; list-style: '· '; margin-bottom: 2px; }
    .skill-row { font-size: 9px; color:#374151; }`;
  const exp = d.experience.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.role)} · <span class="exp-co">${esc(e.company)}</span></div><div class="exp-date">${esc(e.duration)}</div></div><ul>${bullets(e.responsibilities)}</ul></div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="head block"><div><div class="name">${esc(d.contact.name || "Your Name")}</div></div><div class="contact">${contactBits(d.contact).map((c) => `<div>${c}</div>`).join("")}</div></div>
    ${d.summary ? `<div class="block"><div class="section-title">Summary</div><div class="summary">${esc(d.summary)}</div></div>` : ""}
    ${exp ? `<div><div class="section-title">Experience</div>${exp}</div>` : ""}
    ${d.projects.length ? `<div><div class="section-title">Projects</div>${d.projects.map((p) => `<div class="exp"><div class="exp-role">${esc(p.name)} · <span class="exp-co">${esc((p.technologies || []).join(", "))}</span></div><ul>${projectBullets(p)}</ul></div>`).join("")}</div>` : ""}
    ${d.skills.length || d.tools.length ? `<div class="block"><div class="section-title">Skills</div><div class="skill-row">${[...d.skills, ...d.tools].map(esc).join(" · ")}</div></div>` : ""}
    ${d.education.length ? `<div class="block"><div class="section-title">Education</div>${d.education.map((e) => `<div class="exp"><div class="exp-head"><div class="exp-role">${esc(e.degree)} · <span class="exp-co">${esc(e.institution)}</span></div><div class="exp-date">${esc(e.year)}</div></div></div>`).join("")}</div>` : ""}
    ${d.languages?.length ? `<div class="block"><div class="section-title">Languages</div><div class="skill-row">${d.languages.map(esc).join(" · ")}</div></div>` : ""}
    ${d.certifications?.length ? `<div class="block"><div class="section-title">Certifications</div><div class="skill-row">${d.certifications.map(esc).join(" · ")}</div></div>` : ""}
  </div>`;
}

function atsHtml(d: ResumeData): string {
  // Pure ATS-safe: black & white, Times New Roman, no icons, no colors, no chips.
  const css = `
    .resume { width: 210mm; min-height: 297mm; background:#fff; color:#000;
              font-family: 'Times New Roman', Times, serif; font-size: 11px;
              line-height: 1.45; padding: 18mm 18mm; }
    .resume * { box-sizing: border-box; }
    .resume p, .resume li, .resume div, .resume span { overflow-wrap: anywhere; }
    .ats-name { font-size: 22px; font-weight: 700; text-align: center; }
    .ats-contact { text-align: center; font-size: 11px; margin-top: 4px; }
    .ats-h2 { font-size: 12px; font-weight: 700; text-transform: uppercase;
              border-bottom: 1px solid #000; margin: 14px 0 6px; padding-bottom: 2px; }
    .ats-row { display:flex; justify-content:space-between; font-size: 11px; }
    .ats-role { font-weight: 700; }
    .ats-co { font-style: italic; }
    .resume ul { list-style: disc; padding-left: 20px; margin: 4px 0 8px; }
    .resume li { margin-bottom: 3px; page-break-inside: avoid; }
    .ats-block { page-break-inside: avoid; }
    .ats-skill-line { font-size: 11px; margin-bottom: 4px; }
  `;
  const contact = contactBits(d.contact).join(" | ");
  const exp = (d.experience || []).map((e) => `
    <div class="ats-block" style="margin-bottom:10px;">
      <div class="ats-row"><span class="ats-role">${esc(e.role)}, ${esc(e.company)}</span><span>${esc(e.duration)}</span></div>
      <ul>${(e.responsibilities || []).filter(Boolean).map((b) => `<li>${esc(b.replace(/^[-•·]\s*/, ""))}</li>`).join("")}</ul>
    </div>`).join("");
  const proj = (d.projects || []).map((p) => `
    <div class="ats-block" style="margin-bottom:10px;">
      <div class="ats-role">${esc(p.name)}${p.technologies?.length ? ` (${esc(p.technologies.join(", "))})` : ""}</div>
      <ul>${projectBullets(p)}</ul>
    </div>`).join("");
  const edu = (d.education || []).map((e) => `
    <div class="ats-block" style="margin-bottom:6px;">
      <div class="ats-row"><span class="ats-role">${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ""}</span><span>${esc(e.year)}</span></div>
      <div class="ats-co">${esc(e.institution)}</div>
    </div>`).join("");
  return `<style>${css}</style><div class="resume">
    <div class="ats-name">${esc(d.contact.name || "Your Name")}</div>
    <div class="ats-contact">${contact}</div>
    ${d.summary ? `<div class="ats-block"><div class="ats-h2">Summary</div><div>${esc(d.summary)}</div></div>` : ""}
    ${(d.skills?.length || d.tools?.length) ? `<div class="ats-block"><div class="ats-h2">Skills</div><div class="ats-skill-line">${[...(d.skills||[]), ...(d.tools||[])].map(esc).join(", ")}</div></div>` : ""}
    ${exp ? `<div><div class="ats-h2">Experience</div>${exp}</div>` : ""}
    ${proj ? `<div><div class="ats-h2">Projects</div>${proj}</div>` : ""}
    ${edu ? `<div><div class="ats-h2">Education</div>${edu}</div>` : ""}
    ${d.certifications?.length ? `<div class="ats-block"><div class="ats-h2">Certifications</div><div>${d.certifications.map(esc).join(", ")}</div></div>` : ""}
    ${d.languages?.length ? `<div class="ats-block"><div class="ats-h2">Languages</div><div>${d.languages.map(esc).join(", ")}</div></div>` : ""}
  </div>`;
}

function renderHtml(template: ResumeTemplate, data: ResumeData): string {
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">`;
  let body = "";
  switch (template) {
    case "ats": body = atsHtml(data); break;
    case "executive": body = executiveHtml(data); break;
    case "modern": body = modernHtml(data); break;
    case "minimal": body = minimalHtml(data); break;
    case "creative": body = creativeHtml(data); break;
    case "tech": body = techHtml(data); break;
    case "elegant": body = elegantHtml(data); break;
    case "bold": body = boldHtml(data); break;
    case "editorial": body = editorialHtml(data); break;
    case "compact": body = compactHtml(data); break;
    default: body = executiveHtml(data);
  }
  return fonts + body;
}

function fallbackDataFromText(text: string): ResumeData {
  return hydrateResumeData({ contact: { name: "Resume", email: "", phone: "" }, summary: text }, text);
}

export async function downloadResumePDF(plainText: string, data: ResumeData | null, template: ResumeTemplate, filename: string): Promise<void> {
  const resumeData = data || fallbackDataFromText(plainText || "");
  const html = renderHtml(template, resumeData);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);
  try { if ((document as any).fonts?.ready) await (document as any).fonts.ready; } catch {}
  await new Promise((r) => setTimeout(r, 250));
  try {
    await renderSectionedPdf(container, filename);
  } finally {
    container.remove();
  }
}

// Render the whole resume to one canvas, then slice it page-by-page into A4.
// Simple + bullet-proof: every pixel of content ends up in the PDF.
async function renderSectionedPdf(container: HTMLElement, filename: string): Promise<void> {
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  const resumeEl = container.querySelector<HTMLElement>(".resume") || container;

  const canvas = await html2canvas(resumeEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: resumeEl.scrollWidth,
  });

  const A4_WIDTH_PX = canvas.width;
  const A4_HEIGHT_PX = Math.round((A4_WIDTH_PX * A4_HEIGHT_MM) / A4_WIDTH_MM);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const totalPages = Math.max(1, Math.ceil(canvas.height / A4_HEIGHT_PX));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    const srcY = page * A4_HEIGHT_PX;
    const srcH = Math.min(A4_HEIGHT_PX, canvas.height - srcY);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = A4_WIDTH_PX;
    pageCanvas.height = A4_HEIGHT_PX;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, srcY, A4_WIDTH_PX, srcH, 0, 0, A4_WIDTH_PX, srcH);

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  }

  pdf.save(filename);
}

// Live preview helper — returns the same HTML string used for PDF, so the
// preview on screen matches the downloaded file exactly.
export function renderResumeHtml(template: ResumeTemplate, data: ResumeData | null): string {
  const resumeData = data || fallbackDataFromText("");
  return renderHtml(template, resumeData);
}
