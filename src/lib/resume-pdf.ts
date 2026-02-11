import jsPDF from "jspdf";

export type ResumeTemplate = "executive" | "modern" | "minimal" | "creative";

export interface ResumeData {
  contact: { name: string; email: string; phone: string; location?: string; linkedin?: string; github?: string; telegram?: string };
  summary?: string;
  education: { degree: string; institution: string; year: string; field: string; description?: string }[];
  skills: string[];
  tools: string[];
  experience: { company: string; role: string; duration: string; years: number; responsibilities: string[] }[];
  projects: { name: string; description: string; technologies: string[] }[];
  certifications: string[];
  total_years_experience: number;
  quantified_metrics: string[];
  languages?: string[];
  interests?: string[];
}

interface TemplateConfig {
  name: string;
  headerBg: [number, number, number];
  headerText: [number, number, number];
  accentColor: [number, number, number];
  bodyText: [number, number, number];
  mutedText: [number, number, number];
  sidebarBg: [number, number, number] | null;
  sidebarText: [number, number, number] | null;
  lineColor: [number, number, number];
  fontSizeTitle: number;
  fontSizeSection: number;
  fontSizeBody: number;
  layout: "single" | "two-column";
}

const TEMPLATES: Record<ResumeTemplate, TemplateConfig> = {
  executive: {
    name: "Executive",
    headerBg: [30, 30, 50],
    headerText: [255, 255, 255],
    accentColor: [100, 80, 200],
    bodyText: [35, 35, 35],
    mutedText: [110, 110, 110],
    sidebarBg: [244, 242, 252],
    sidebarText: [35, 35, 35],
    lineColor: [100, 80, 200],
    fontSizeTitle: 22,
    fontSizeSection: 11,
    fontSizeBody: 9,
    layout: "two-column",
  },
  modern: {
    name: "Modern",
    headerBg: [41, 98, 200],
    headerText: [255, 255, 255],
    accentColor: [41, 98, 200],
    bodyText: [35, 35, 35],
    mutedText: [120, 120, 120],
    sidebarBg: [238, 244, 255],
    sidebarText: [35, 35, 35],
    lineColor: [41, 98, 200],
    fontSizeTitle: 20,
    fontSizeSection: 11,
    fontSizeBody: 9,
    layout: "two-column",
  },
  minimal: {
    name: "Minimal",
    headerBg: [255, 255, 255],
    headerText: [25, 25, 25],
    accentColor: [60, 60, 60],
    bodyText: [40, 40, 40],
    mutedText: [130, 130, 130],
    sidebarBg: null,
    sidebarText: null,
    lineColor: [180, 180, 180],
    fontSizeTitle: 24,
    fontSizeSection: 11,
    fontSizeBody: 9,
    layout: "single",
  },
  creative: {
    name: "Creative",
    headerBg: [120, 70, 220],
    headerText: [255, 255, 255],
    accentColor: [220, 60, 140],
    bodyText: [35, 35, 35],
    mutedText: [110, 110, 110],
    sidebarBg: [248, 242, 255],
    sidebarText: [50, 30, 80],
    lineColor: [220, 60, 140],
    fontSizeTitle: 22,
    fontSizeSection: 11,
    fontSizeBody: 9,
    layout: "two-column",
  },
};

function wrap(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

function sectionTitle(doc: jsPDF, title: string, y: number, x: number, width: number, c: TemplateConfig): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(c.fontSizeSection);
  doc.setTextColor(...c.accentColor);
  doc.text(title.toUpperCase(), x, y);
  y += 2;
  doc.setDrawColor(...c.lineColor);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + Math.min(width, 55), y);
  return y + 5;
}

function bullet(doc: jsPDF, text: string, y: number, x: number, maxW: number, c: TemplateConfig): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(c.fontSizeBody);
  doc.setTextColor(...c.bodyText);
  const lines = wrap(doc, text, maxW - 6, c.fontSizeBody);
  doc.text("•", x, y);
  doc.text(lines, x + 4, y);
  return y + lines.length * 3.6;
}

function pageBreak(doc: jsPDF, y: number, resetY = 15): number {
  if (y > 272) { doc.addPage(); return resetY; }
  return y;
}

function rightAlign(doc: jsPDF, text: string, y: number, rightX: number) {
  doc.text(text, rightX - doc.getTextWidth(text), y);
}

function generateTwoColumn(doc: jsPDF, data: ResumeData, c: TemplateConfig) {
  const pw = 210;
  const sw = 62;
  const mx = sw + 8;
  const mw = pw - mx - 10;
  const sx = 7;
  const sWidth = sw - 10;

  // Header
  doc.setFillColor(...c.headerBg);
  doc.rect(0, 0, pw, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(c.fontSizeTitle);
  doc.setTextColor(...c.headerText);
  doc.text(data.contact.name || "Your Name", 10, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const contactLine: string[] = [];
  if (data.contact.email) contactLine.push(data.contact.email);
  if (data.contact.phone) contactLine.push(data.contact.phone);
  if (data.contact.location) contactLine.push(data.contact.location);
  doc.text(contactLine.join("  |  "), 10, 23);

  const links: string[] = [];
  if (data.contact.linkedin) links.push(data.contact.linkedin);
  if (data.contact.github) links.push(data.contact.github);
  if (data.contact.telegram) links.push(data.contact.telegram);
  if (links.length > 0) {
    doc.setFontSize(7.5);
    doc.text(links.join("  |  "), 10, 29);
  }

  if (data.total_years_experience > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${data.total_years_experience}+ Years Experience`, 10, 35);
  }

  // Sidebar bg
  if (c.sidebarBg) {
    doc.setFillColor(...c.sidebarBg);
    doc.rect(0, 38, sw, 259, "F");
  }

  const stc = c.sidebarText || c.bodyText;
  let sy = 47;

  // Skills
  if (data.skills.length > 0) {
    sy = sectionTitle(doc, "Skills", sy, sx, sWidth, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...stc);
    for (const s of data.skills) {
      sy = pageBreak(doc, sy, 47);
      doc.text("▸  " + s, sx, sy);
      sy += 4;
    }
    sy += 3;
  }

  // Tools
  if (data.tools.length > 0) {
    sy = pageBreak(doc, sy, 47);
    sy = sectionTitle(doc, "Tools", sy, sx, sWidth, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...stc);
    for (const t of data.tools) {
      sy = pageBreak(doc, sy, 47);
      doc.text("▸  " + t, sx, sy);
      sy += 4;
    }
    sy += 3;
  }

  // Education
  if (data.education.length > 0) {
    sy = pageBreak(doc, sy, 47);
    sy = sectionTitle(doc, "Education", sy, sx, sWidth, c);
    doc.setFontSize(8);
    doc.setTextColor(...stc);
    for (const edu of data.education) {
      sy = pageBreak(doc, sy, 47);
      doc.setFont("helvetica", "bold");
      const dl = wrap(doc, edu.degree, sWidth, 8);
      doc.text(dl, sx, sy);
      sy += dl.length * 3.2;
      doc.setFont("helvetica", "normal");
      if (edu.institution) {
        const il = wrap(doc, edu.institution, sWidth, 7.5);
        doc.setFontSize(7.5);
        doc.text(il, sx, sy);
        sy += il.length * 3;
      }
      doc.setFontSize(7.5);
      doc.setTextColor(...c.mutedText);
      if (edu.field) { doc.text(edu.field, sx, sy); sy += 3; }
      if (edu.year) { doc.text(edu.year, sx, sy); sy += 3; }
      if (edu.description) {
        const descLines = wrap(doc, edu.description, sWidth, 7);
        doc.setFontSize(7);
        doc.text(descLines, sx, sy);
        sy += descLines.length * 2.8;
      }
      sy += 3;
      doc.setTextColor(...stc);
      doc.setFontSize(8);
    }
  }

  // Certifications
  if (data.certifications.length > 0) {
    sy = pageBreak(doc, sy, 47);
    sy = sectionTitle(doc, "Certifications", sy, sx, sWidth, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...stc);
    for (const cert of data.certifications) {
      sy = pageBreak(doc, sy, 47);
      const cl = wrap(doc, "✦  " + cert, sWidth, 7.5);
      doc.text(cl, sx, sy);
      sy += cl.length * 3.5;
    }
    sy += 3;
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    sy = pageBreak(doc, sy, 47);
    sy = sectionTitle(doc, "Languages", sy, sx, sWidth, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...stc);
    for (const lang of data.languages) {
      doc.text("▸  " + lang, sx, sy);
      sy += 4;
    }
  }

  // === MAIN CONTENT ===
  let my = 47;

  // Summary
  if (data.summary) {
    my = sectionTitle(doc, "Professional Summary", my, mx, mw, c);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(c.fontSizeBody);
    doc.setTextColor(...c.bodyText);
    const sl = wrap(doc, data.summary, mw, c.fontSizeBody);
    doc.text(sl, mx, my);
    my += sl.length * 3.6 + 4;
  }

  // Experience
  if (data.experience.length > 0) {
    my = sectionTitle(doc, "Professional Experience", my, mx, mw, c);
    for (const exp of data.experience) {
      my = pageBreak(doc, my);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...c.bodyText);
      doc.text(exp.role || "Role", mx, my);
      my += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...c.accentColor);
      doc.text(exp.company || "", mx, my);
      doc.setTextColor(...c.mutedText);
      if (exp.duration) rightAlign(doc, exp.duration, my, mx + mw);
      my += 4.5;
      for (const r of exp.responsibilities) {
        my = pageBreak(doc, my);
        my = bullet(doc, r, my, mx, mw, c);
        my += 0.8;
      }
      my += 3;
    }
  }

  // Projects
  if (data.projects.length > 0) {
    my = pageBreak(doc, my);
    my = sectionTitle(doc, "Projects", my, mx, mw, c);
    for (const proj of data.projects) {
      my = pageBreak(doc, my);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...c.bodyText);
      doc.text(proj.name || "Project", mx, my);
      my += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(c.fontSizeBody);
      doc.setTextColor(...c.bodyText);

      // Handle description as bullet points if it contains newlines
      const descParts = proj.description.split("\n").filter(Boolean);
      for (const part of descParts) {
        my = pageBreak(doc, my);
        my = bullet(doc, part.replace(/^[-•]\s*/, ""), my, mx, mw, c);
        my += 0.5;
      }

      if (proj.technologies.length > 0) {
        my += 1;
        doc.setFontSize(7.5);
        doc.setTextColor(...c.accentColor);
        const techStr = proj.technologies.join("  ·  ");
        const tl = wrap(doc, techStr, mw, 7.5);
        doc.text(tl, mx, my);
        my += tl.length * 3;
      }
      my += 3;
    }
  }
}

function generateSingleColumn(doc: jsPDF, data: ResumeData, c: TemplateConfig) {
  const m = 16;
  const cw = 210 - m * 2;
  let y = 16;

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(c.fontSizeTitle);
  doc.setTextColor(...c.headerText);
  doc.text(data.contact.name || "Your Name", m, y);
  y += 7;

  doc.setDrawColor(...c.lineColor);
  doc.setLineWidth(0.8);
  doc.line(m, y, m + cw, y);
  y += 5;

  // Contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...c.mutedText);
  const cp: string[] = [];
  if (data.contact.email) cp.push(data.contact.email);
  if (data.contact.phone) cp.push(data.contact.phone);
  if (data.contact.location) cp.push(data.contact.location);
  doc.text(cp.join("  |  "), m, y);
  y += 4;
  const links: string[] = [];
  if (data.contact.linkedin) links.push(data.contact.linkedin);
  if (data.contact.github) links.push(data.contact.github);
  if (links.length > 0) { doc.setFontSize(7.5); doc.text(links.join("  |  "), m, y); y += 4; }
  y += 4;

  // Summary
  if (data.summary) {
    y = sectionTitle(doc, "Professional Summary", y, m, cw, c);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(c.fontSizeBody);
    doc.setTextColor(...c.bodyText);
    const sl = wrap(doc, data.summary, cw, c.fontSizeBody);
    doc.text(sl, m, y);
    y += sl.length * 3.6 + 4;
  }

  // Experience
  if (data.experience.length > 0) {
    y = sectionTitle(doc, "Experience", y, m, cw, c);
    for (const exp of data.experience) {
      y = pageBreak(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...c.bodyText);
      doc.text(exp.role || "Role", m, y);
      rightAlign(doc, exp.duration || "", y, m + cw);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...c.accentColor);
      doc.text(exp.company || "", m, y);
      y += 4.5;
      for (const r of exp.responsibilities) {
        y = pageBreak(doc, y);
        y = bullet(doc, r, y, m, cw, c);
        y += 0.8;
      }
      y += 3;
    }
  }

  // Skills
  if (data.skills.length > 0) {
    y = pageBreak(doc, y);
    y = sectionTitle(doc, "Skills", y, m, cw, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...c.bodyText);
    const st = data.skills.join("  ·  ");
    const sl = wrap(doc, st, cw, 9);
    doc.text(sl, m, y);
    y += sl.length * 3.8 + 3;
  }

  // Projects
  if (data.projects.length > 0) {
    y = pageBreak(doc, y);
    y = sectionTitle(doc, "Projects", y, m, cw, c);
    for (const proj of data.projects) {
      y = pageBreak(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...c.bodyText);
      doc.text(proj.name, m, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(c.fontSizeBody);
      const descParts = proj.description.split("\n").filter(Boolean);
      for (const part of descParts) {
        y = pageBreak(doc, y);
        y = bullet(doc, part.replace(/^[-•]\s*/, ""), y, m, cw, c);
        y += 0.5;
      }
      if (proj.technologies.length > 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(...c.accentColor);
        doc.text(proj.technologies.join("  ·  "), m, y);
        y += 5;
      }
      y += 2;
    }
  }

  // Education
  if (data.education.length > 0) {
    y = pageBreak(doc, y);
    y = sectionTitle(doc, "Education", y, m, cw, c);
    for (const edu of data.education) {
      y = pageBreak(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...c.bodyText);
      doc.text(edu.degree, m, y);
      rightAlign(doc, edu.year || "", y, m + cw);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...c.mutedText);
      doc.text(`${edu.institution}${edu.field ? " — " + edu.field : ""}`, m, y);
      y += 3.5;
      if (edu.description) {
        doc.setFontSize(8);
        const dl = wrap(doc, edu.description, cw, 8);
        doc.text(dl, m, y);
        y += dl.length * 3;
      }
      y += 3;
    }
  }

  // Certifications
  if (data.certifications.length > 0) {
    y = pageBreak(doc, y);
    y = sectionTitle(doc, "Certifications", y, m, cw, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...c.bodyText);
    for (const cert of data.certifications) {
      doc.text("✦  " + cert, m, y);
      y += 4.5;
    }
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    y = pageBreak(doc, y);
    y = sectionTitle(doc, "Languages", y, m, cw, c);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...c.bodyText);
    doc.text(data.languages.join("  ·  "), m, y);
  }
}

export interface OptimizedPayload {
  text: string;
  structured: ResumeData & { changes_made?: ChangeItem[] };
}

export interface ChangeItem {
  type: string;
  location: string;
  before: string;
  after: string;
}

export function parseOptimizedPayload(raw: string): OptimizedPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.text && parsed.structured) return parsed as OptimizedPayload;
    return null;
  } catch {
    return null;
  }
}

export function generateResumePDF(
  optimizedText: string,
  parsedData: ResumeData | null,
  template: ResumeTemplate = "executive"
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const config = TEMPLATES[template];

  if (parsedData && parsedData.contact) {
    if (config.layout === "two-column") {
      generateTwoColumn(doc, parsedData, config);
    } else {
      generateSingleColumn(doc, parsedData, config);
    }
  } else {
    // Fallback plain text
    doc.setFillColor(...config.headerBg);
    doc.rect(0, 0, 210, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...config.headerText);
    doc.text("Optimized Resume", 14, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...config.bodyText);
    const lines = doc.splitTextToSize(optimizedText, 180);
    let y = 30;
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 14; }
      doc.text(line, 14, y);
      y += 4.5;
    }
  }
  return doc;
}

export function downloadResumePDF(
  optimizedText: string,
  parsedData: ResumeData | null,
  template: ResumeTemplate = "executive",
  fileName?: string
) {
  const doc = generateResumePDF(optimizedText, parsedData, template);
  doc.save(fileName || `optimized-resume-${template}.pdf`);
}

export function getTemplateList(): { id: ResumeTemplate; name: string; description: string }[] {
  return [
    { id: "executive", name: "Executive", description: "Two-column with dark header. Professional & senior-level." },
    { id: "modern", name: "Modern", description: "Clean two-column, blue accents. Great for tech roles." },
    { id: "minimal", name: "Minimal", description: "Single column, typography-focused. ATS-friendly." },
    { id: "creative", name: "Creative", description: "Bold violet & pink accents. Stands out visually." },
  ];
}
