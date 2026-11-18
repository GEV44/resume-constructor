/** Deterministic, browser-side check for things that make a resume hard for ATS parsers to read. */
export type Severity = "high" | "medium" | "low";
export interface ReadabilityIssue { id: string; severity: Severity; message: string; fix: string }

const HEADINGS: Record<string, RegExp> = {
  experience: /^(work |professional )?(experience|employment( history)?|work history|опыт( работы)?|աշխատանքային փորձ)\s*:?$/i,
  education: /^(education|образование|կրթություն)\s*:?$/i,
  skills: /^((technical |key |core )?skills|навыки|ключевые навыки|հմտություններ)\s*:?$/i,
};

export function checkReadability(text: string): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const add = (id: string, severity: Severity, message: string, fix: string) => issues.push({ id, severity, message, fix });
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const words = text.split(/\s+/).filter(Boolean).length;

  if (!/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) add("no-email", "high", "No email address found.", "Add a plain-text email address near the top of the resume, not inside an image or header.");
  const hasPhone = (text.match(/\+?\d[\d\s().-]{6,}\d/g) ?? []).some((m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15 && !/^(19|20)\d{2}\D+(19|20)\d{2}$/.test(m.trim());
  });
  if (!hasPhone) add("no-phone", "medium", "No phone number found.", "Add a phone number with country code in the contact line at the top.");

  const has = (re: RegExp) => lines.some((l) => re.test(l));
  if (!has(HEADINGS.experience)) add("no-experience-heading", "high", "No standard Experience heading detected.", "Use the plain heading \"Experience\" or \"Work Experience\" on its own line.");
  if (!has(HEADINGS.education)) add("no-education-heading", "medium", "No standard Education heading detected.", "Use the plain heading \"Education\" on its own line.");
  if (!has(HEADINGS.skills)) add("no-skills-heading", "medium", "No standard Skills heading detected.", "Add a \"Skills\" section listing your tools and technologies as plain text.");

  if (/\t{2,}|\S {4,}\S/.test(text)) add("columns", "medium", "Table or multi-column layout detected.", "Use a single column. Parsers read columns and tables in the wrong order, so move side-by-side content into separate lines.");
  if (/[★☆✦❖➤➔►◆◇○✔✓]/u.test(text)) add("glyphs", "low", "Decorative symbols or rating stars found.", "Replace star or symbol ratings with plain words, and use simple \"-\" or \"•\" bullets.");
  if (!/\b(19|20)\d{2}\b|present|настоящее время|currently/i.test(text)) add("no-dates", "medium", "No dates found.", "Add start and end years to each role and degree, for example \"2021 - 2025\".");

  if (words < 120) add("too-short", "medium", `Only ${words} words of text were found.`, "If the file is a scanned image or has little text, export it as a text-based PDF or DOCX and add more detail on achievements.");
  if (words > 1500) add("too-long", "low", `${words} words is long for a resume.`, "Trim to the most relevant 1-2 pages: keep the last 10-15 years and cut duties that do not support the target role.");

  return issues;
}
