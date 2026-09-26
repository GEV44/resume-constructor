// Machine-readable resume exports (plain text, text-based PDF, DOCX) that ATS parsers can read.
import type { jsPDF } from "jspdf";
import type * as Docx from "docx";
import type { ResumeData } from "@/lib/resume-pdf";

interface ResumeEntry {
  title: string;
  detail?: string;
  note?: string;
  date?: string;
  bullets: string[];
}

interface ResumeSection {
  title: string;
  paragraph?: string;
  entries?: ResumeEntry[];
  bullets?: string[];
}

const CREATOR = "AI Resume Builder";
const BULLET_MARKERS = /^[\s\-\u2013\u2014\u2022\u00B7*\u25AA\u25CF\u25E6]+/;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const cleanList = (items: unknown): string[] =>
  Array.isArray(items) ? items.map(clean).filter(Boolean) : [];

function uniqueCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Splits free text on newlines and "•" separators into clean bullet strings. */
export function splitBullets(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n|\u2022/)
    .map((part) => clean(part.replace(BULLET_MARKERS, "")))
    .filter(Boolean);
}

function contactParts(contact: ResumeData["contact"]): string[] {
  const { email, phone, location, linkedin, github, telegram, website, portfolio } = contact ?? ({} as ResumeData["contact"]);
  return [email, phone, location, linkedin, github, telegram, website, portfolio].map(clean).filter(Boolean);
}

function resumeName(data: ResumeData): string {
  return clean(data.contact?.name) || "Resume";
}

function buildSections(data: ResumeData): ResumeSection[] {
  const sections: ResumeSection[] = [];

  const summary = clean(data.summary);
  if (summary) sections.push({ title: "Summary", paragraph: summary });

  const skills = uniqueCaseInsensitive([...cleanList(data.skills), ...cleanList(data.tools)]);
  if (skills.length) sections.push({ title: "Skills", paragraph: skills.join(", ") });

  const experience = (data.experience ?? []).map((job): ResumeEntry => {
    const role = clean(job?.role);
    const company = clean(job?.company);
    return {
      title: role || company,
      detail: role ? company : undefined,
      date: clean(job?.duration),
      bullets: (job?.responsibilities ?? []).flatMap((item) => splitBullets(item)),
    };
  }).filter((entry) => entry.title || entry.bullets.length);
  if (experience.length) sections.push({ title: "Experience", entries: experience });

  const projects = (data.projects ?? []).map((project): ResumeEntry => ({
    title: clean(project?.name),
    note: cleanList(project?.technologies).join(", "),
    bullets: splitBullets(project?.description ?? ""),
  })).filter((entry) => entry.title || entry.bullets.length);
  if (projects.length) sections.push({ title: "Projects", entries: projects });

  const education = (data.education ?? []).map((item): ResumeEntry => {
    const degree = [clean(item?.degree), clean(item?.field)].filter(Boolean).join(", ");
    const institution = clean(item?.institution);
    return {
      title: degree || institution,
      detail: degree ? institution : undefined,
      date: clean(item?.year),
      bullets: splitBullets(item?.description ?? ""),
    };
  }).filter((entry) => entry.title || entry.bullets.length);
  if (education.length) sections.push({ title: "Education", entries: education });

  const certifications = cleanList(data.certifications);
  if (certifications.length) sections.push({ title: "Certifications", bullets: certifications });

  const languages = cleanList(data.languages);
  if (languages.length) sections.push({ title: "Languages", paragraph: languages.join(", ") });

  return sections;
}

function entryHeading(entry: ResumeEntry): string {
  let heading = entry.title;
  if (entry.detail) heading += ` — ${entry.detail}`;
  if (entry.note) heading += ` (${entry.note})`;
  if (entry.date) heading += ` (${entry.date})`;
  return heading;
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

export function resumeToPlainText(data: ResumeData): string {
  const blocks: string[] = [];
  const header = [resumeName(data), contactParts(data.contact).join(" | ")].filter(Boolean);
  blocks.push(header.join("\n"));

  for (const section of buildSections(data)) {
    const lines = [section.title.toUpperCase()];
    if (section.paragraph) lines.push(section.paragraph);
    for (const entry of section.entries ?? []) {
      if (entry.title) lines.push(entryHeading(entry));
      lines.push(...entry.bullets.map((bullet) => `• ${bullet}`));
    }
    lines.push(...(section.bullets ?? []).map((bullet) => `• ${bullet}`));
    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n").split("\n").map((line) => line.trimEnd()).join("\n").trim();
}

// ---------------------------------------------------------------------------
// PDF (real text via jsPDF standard fonts)
// ---------------------------------------------------------------------------

const PDF_REPLACEMENTS: [RegExp, string][] = [
  [/[\u2018\u2019\u201A\u201B\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u201F\u2033]/g, "\""],
  [/[\u2010-\u2015\u2212]/g, "-"],
  [/[\u2022\u2023\u2043\u25AA\u25CF\u25E6]/g, "-"],
  [/\u2026/g, "..."],
  [/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " "],
  [/[\u200B-\u200D\u2060\uFEFF]/g, ""],
];

function applyPdfReplacements(text: string): string {
  return PDF_REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

// Built-in PDF fonts only cover WinAnsi, so anything beyond Latin-1 would render as garbage.
// eslint-disable-next-line no-control-regex
const NON_LATIN1 = /[^\u0000-\u00FF]/;

/** Maps typographic punctuation to ASCII and drops characters the standard PDF fonts cannot draw. */
export function sanitizePdfText(text: string): string {
  return applyPdfReplacements(String(text ?? "")).replace(new RegExp(NON_LATIN1, "g"), "").replace(/ {2,}/g, " ");
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

/** True when the PDF export would have to drop characters (e.g. Cyrillic, CJK, emoji). */
export function hasNonLatinText(data: ResumeData): boolean {
  const { contact, summary, education, skills, tools, experience, projects, certifications, languages } = data;
  const exported = { contact, summary, education, skills, tools, experience, projects, certifications, languages };
  return collectStrings(exported).some((text) => NON_LATIN1.test(applyPdfReplacements(text)));
}

const PT_TO_MM = 25.4 / 72;
const PDF_FONT = "times";
const PDF_MARGIN = 18;
const BODY_SIZE = 10.5;
const BULLET_INDENT = 4.5;

export async function buildAtsPdf(data: ResumeData): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGIN * 2;
  const bottom = pageHeight - PDF_MARGIN;
  const name = resumeName(data);

  doc.setDocumentProperties({
    title: `${name} — Resume`,
    subject: `Resume of ${name}`,
    author: name,
    creator: CREATOR,
    keywords: "resume, cv",
  });

  // `y` is the baseline of the last line drawn.
  let y = PDF_MARGIN;
  const lineHeight = (size: number) => size * PT_TO_MM * 1.25;
  const setFont = (size: number, style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont(PDF_FONT, style);
    doc.setFontSize(size);
  };
  const ensureSpace = (height: number) => {
    if (y + height > bottom) {
      doc.addPage();
      y = PDF_MARGIN;
    }
  };
  const nextLine = (size: number): number => {
    const height = lineHeight(size);
    ensureSpace(height);
    y += height;
    return y;
  };
  const wrap = (text: string, width: number): string[] => doc.splitTextToSize(sanitizePdfText(text), width) as string[];

  const drawParagraph = (text: string) => {
    setFont(BODY_SIZE);
    for (const line of wrap(text, contentWidth)) doc.text(line, PDF_MARGIN, nextLine(BODY_SIZE));
  };

  const drawBullet = (text: string) => {
    setFont(BODY_SIZE);
    wrap(text, contentWidth - BULLET_INDENT).forEach((line, index) => {
      const baseline = nextLine(BODY_SIZE);
      // Draw the bullet as a vector dot so extracted text stays clean.
      if (index === 0) doc.circle(PDF_MARGIN + 1.5, baseline - 1.1, 0.45, "F");
      doc.text(line, PDF_MARGIN + BULLET_INDENT, baseline);
    });
  };

  const drawEntryHeading = (entry: ResumeEntry) => {
    const date = sanitizePdfText(entry.date ?? "");
    setFont(BODY_SIZE);
    const dateWidth = date ? doc.getTextWidth(date) + 4 : 0;
    const available = contentWidth - dateWidth;
    const title = sanitizePdfText(entry.title);
    const rest = sanitizePdfText(`${entry.detail ? ` - ${entry.detail}` : ""}${entry.note ? ` (${entry.note})` : ""}`);

    // Keep the heading together with its first bullet.
    ensureSpace(lineHeight(BODY_SIZE) * 2 + 1.5);
    y += 1.5;

    setFont(BODY_SIZE, "bold");
    const titleWidth = doc.getTextWidth(title);
    setFont(BODY_SIZE);
    const fitsOnOneLine = titleWidth + doc.getTextWidth(rest) <= available;

    const firstBaseline = nextLine(BODY_SIZE);
    if (fitsOnOneLine) {
      setFont(BODY_SIZE, "bold");
      doc.text(title, PDF_MARGIN, firstBaseline);
      setFont(BODY_SIZE);
      if (rest) doc.text(rest, PDF_MARGIN + titleWidth, firstBaseline);
    } else {
      setFont(BODY_SIZE, "bold");
      wrap(title + rest, available).forEach((line, index) => {
        doc.text(line, PDF_MARGIN, index === 0 ? firstBaseline : nextLine(BODY_SIZE));
      });
    }
    if (date) {
      setFont(BODY_SIZE);
      doc.text(date, pageWidth - PDF_MARGIN, firstBaseline, { align: "right" });
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(4 + lineHeight(11) + 2 + lineHeight(BODY_SIZE) * 2);
    y += 4;
    setFont(11, "bold");
    doc.text(sanitizePdfText(title.toUpperCase()), PDF_MARGIN, nextLine(11));
    doc.setLineWidth(0.25);
    doc.line(PDF_MARGIN, y + 1.2, pageWidth - PDF_MARGIN, y + 1.2);
    y += 2;
  };

  setFont(18, "bold");
  for (const line of wrap(name, contentWidth)) doc.text(line, pageWidth / 2, nextLine(18), { align: "center" });

  const contact = contactParts(data.contact).join(" | ");
  if (contact) {
    setFont(10);
    y += 0.5;
    for (const line of wrap(contact, contentWidth)) doc.text(line, pageWidth / 2, nextLine(10), { align: "center" });
  }

  for (const section of buildSections(data)) {
    drawSectionHeading(section.title);
    if (section.paragraph) drawParagraph(section.paragraph);
    for (const entry of section.entries ?? []) {
      if (entry.title) drawEntryHeading(entry);
      entry.bullets.forEach(drawBullet);
    }
    (section.bullets ?? []).forEach(drawBullet);
  }

  return doc;
}

export async function downloadAtsPdf(data: ResumeData, filename: string): Promise<void> {
  const doc = await buildAtsPdf(data);
  saveBlob(doc.output("blob"), withExtension(filename, "pdf"));
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

const TWIPS_PER_INCH = 1440;
const DOCX_MARGIN = Math.round(0.7 * TWIPS_PER_INCH);
const A4_WIDTH_TWIPS = 11906;
const A4_HEIGHT_TWIPS = 16838;
const BULLET_REFERENCE = "resume-bullets";

async function buildDocxDocument(data: ResumeData): Promise<Docx.Document> {
  const docx: typeof Docx = await import("docx");
  const { AlignmentType, BorderStyle, HeadingLevel, LevelFormat, Tab, TabStopType, TextRun } = docx;
  const name = resumeName(data);
  const contentWidth = A4_WIDTH_TWIPS - DOCX_MARGIN * 2;

  const bullet = (text: string) => new docx.Paragraph({
    numbering: { reference: BULLET_REFERENCE, level: 0 },
    spacing: { after: 40 },
    children: [new TextRun(text)],
  });

  const entryHeading = (entry: ResumeEntry) => {
    const runs: Docx.TextRun[] = [new TextRun({ text: entry.title, bold: true })];
    if (entry.detail) runs.push(new TextRun(` — ${entry.detail}`));
    if (entry.note) runs.push(new TextRun({ text: ` (${entry.note})`, italics: true }));
    if (entry.date) runs.push(new TextRun({ children: [new Tab(), entry.date] }));
    return new docx.Paragraph({
      keepNext: true,
      spacing: { before: 120, after: 40 },
      tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
      children: runs,
    });
  };

  const children: Docx.Paragraph[] = [
    new docx.Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun(name)] }),
  ];
  const contact = contactParts(data.contact).join(" | ");
  if (contact) {
    children.push(new docx.Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: contact, size: 20 })],
    }));
  }

  for (const section of buildSections(data)) {
    children.push(new docx.Paragraph({
      heading: HeadingLevel.HEADING_2,
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
      children: [new TextRun(section.title.toUpperCase())],
    }));
    if (section.paragraph) children.push(new docx.Paragraph({ spacing: { after: 60 }, children: [new TextRun(section.paragraph)] }));
    for (const entry of section.entries ?? []) {
      if (entry.title) children.push(entryHeading(entry));
      children.push(...entry.bullets.map(bullet));
    }
    children.push(...(section.bullets ?? []).map(bullet));
  }

  return new docx.Document({
    title: `${name} — Resume`,
    subject: `Resume of ${name}`,
    creator: CREATOR,
    description: "ATS-friendly resume",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 0, line: 259 } } },
        title: {
          run: { font: "Calibri", size: 36, bold: true, color: "000000" },
          paragraph: { spacing: { after: 40 } },
        },
        heading2: {
          run: { font: "Calibri", size: 24, bold: true, color: "000000" },
          paragraph: { spacing: { before: 240, after: 80 } },
        },
      },
    },
    numbering: {
      config: [{
        reference: BULLET_REFERENCE,
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
          margin: { top: DOCX_MARGIN, right: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN },
        },
      },
      children,
    }],
  });
}

export async function buildDocx(data: ResumeData): Promise<Blob> {
  const [{ Packer }, document] = await Promise.all([import("docx"), buildDocxDocument(data)]);
  return Packer.toBlob(document);
}

export async function downloadDocx(data: ResumeData, filename: string): Promise<void> {
  saveBlob(await buildDocx(data), withExtension(filename, "docx"));
}

// ---------------------------------------------------------------------------
// Plain text download + shared helpers
// ---------------------------------------------------------------------------

export function downloadText(data: ResumeData, filename: string): void {
  const blob = new Blob([resumeToPlainText(data)], { type: "text/plain;charset=utf-8" });
  saveBlob(blob, withExtension(filename, "txt"));
}

function withExtension(filename: string, extension: string): string {
  const base = clean(filename) || "resume";
  return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the browser has started the download first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
