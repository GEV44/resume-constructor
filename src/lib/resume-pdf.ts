import jsPDF from "jspdf";

export type ResumeTemplate =
  | "professional"
  | "modern"
  | "minimal"
  | "executive"
  | "creative"
  | "tech"
  | "elegant"
  | "bold"
  | "compact";

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

// ===== PROFESSIONAL ATS TEMPLATE (most popular, clean, single-column) =====

function wrap(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

function drawLine(doc: jsPDF, x: number, y: number, w: number, color: [number, number, number] = [0, 0, 0], weight = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(weight);
  doc.line(x, y, x + w, y);
}

function checkPage(doc: jsPDF, y: number, needed = 12): number {
  if (y + needed > 282) { doc.addPage(); return 14; }
  return y;
}

function sectionHeading(doc: jsPDF, title: string, y: number, x: number, w: number, color: [number, number, number]): number {
  y = checkPage(doc, y, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(title.toUpperCase(), x, y);
  y += 1.5;
  drawLine(doc, x, y, w, color, 0.5);
  return y + 4;
}

function bulletPoint(doc: jsPDF, text: string, y: number, x: number, maxW: number, color: [number, number, number]): number {
  y = checkPage(doc, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...color);
  const lines = wrap(doc, text, maxW - 5, 9);
  doc.text("•", x, y);
  doc.text(lines, x + 4, y);
  return y + lines.length * 3.5;
}

// ==================== PROFESSIONAL TEMPLATE ====================
function generateProfessional(doc: jsPDF, data: ResumeData) {
  const m = 14;
  const w = 210 - m * 2;
  const black: [number, number, number] = [30, 30, 30];
  const gray: [number, number, number] = [100, 100, 100];
  const accent: [number, number, number] = [37, 99, 235]; // #2563EB
  let y = 16;

  // === HEADER ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...black);
  doc.text((data.contact.name || "Your Name").toUpperCase(), m, y);
  y += 6;

  // Contact line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...gray);
  const contactParts: string[] = [];
  if (data.contact.email) contactParts.push(data.contact.email);
  if (data.contact.phone) contactParts.push(data.contact.phone);
  if (data.contact.location) contactParts.push(data.contact.location);
  doc.text(contactParts.join("  |  "), m, y);
  y += 3.5;

  const linkParts: string[] = [];
  if (data.contact.linkedin) linkParts.push(data.contact.linkedin);
  if (data.contact.github) linkParts.push(data.contact.github);
  if (data.contact.telegram) linkParts.push(data.contact.telegram);
  if (linkParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text(linkParts.join("  |  "), m, y);
    y += 3.5;
  }

  drawLine(doc, m, y, w, black, 0.8);
  y += 5;

  // === SUMMARY ===
  if (data.summary) {
    y = sectionHeading(doc, "Professional Summary", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, w, 9);
    doc.text(sl, m, y);
    y += sl.length * 3.5 + 4;
  }

  // === EXPERIENCE ===
  if (data.experience.length > 0) {
    y = sectionHeading(doc, "Professional Experience", y, m, w, accent);
    for (const exp of data.experience) {
      y = checkPage(doc, y, 16);
      // Title line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(exp.role || "Role", m, y);
      // Duration right-aligned
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, m + w - dw, y);
      }
      y += 4;
      // Company
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...accent);
      doc.text(exp.company || "", m, y);
      y += 4;
      // Bullets
      for (const r of exp.responsibilities) {
        y = bulletPoint(doc, r, y, m + 2, w - 2, black);
        y += 0.5;
      }
      y += 3;
    }
  }

  // === PROJECTS ===
  if (data.projects.length > 0) {
    y = sectionHeading(doc, "Projects", y, m, w, accent);
    for (const proj of data.projects) {
      y = checkPage(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      doc.text(proj.name || "Project", m, y);
      // Tech stack inline
      if (proj.technologies.length > 0) {
        const nameW = doc.getTextWidth(proj.name + "  ");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...gray);
        doc.text("| " + proj.technologies.join(", "), m + nameW, y);
      }
      y += 4;
      // Description as bullets
      const descParts = proj.description.split("\n").filter(Boolean);
      for (const part of descParts) {
        y = bulletPoint(doc, part.replace(/^[-•]\s*/, ""), y, m + 2, w - 2, black);
        y += 0.3;
      }
      y += 3;
    }
  }

  // === SKILLS ===
  if (data.skills.length > 0 || data.tools.length > 0) {
    y = sectionHeading(doc, "Technical Skills", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    if (data.skills.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Skills: ", m, y);
      const labelW = doc.getTextWidth("Skills: ");
      doc.setFont("helvetica", "normal");
      const skillText = data.skills.join(", ");
      const sl = wrap(doc, skillText, w - labelW, 8.5);
      doc.text(sl, m + labelW, y);
      y += sl.length * 3.5 + 1;
    }
    if (data.tools.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Tools: ", m, y);
      const labelW = doc.getTextWidth("Tools: ");
      doc.setFont("helvetica", "normal");
      const toolText = data.tools.join(", ");
      const tl = wrap(doc, toolText, w - labelW, 8.5);
      doc.text(tl, m + labelW, y);
      y += tl.length * 3.5 + 1;
    }
    y += 3;
  }

  // === EDUCATION ===
  if (data.education.length > 0) {
    y = sectionHeading(doc, "Education", y, m, w, accent);
    for (const edu of data.education) {
      y = checkPage(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      doc.text(edu.degree, m, y);
      // Year right
      if (edu.year) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...gray);
        const yw = doc.getTextWidth(edu.year);
        doc.text(edu.year, m + w - yw, y);
      }
      y += 3.8;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      doc.text(`${edu.institution}${edu.field ? " — " + edu.field : ""}`, m, y);
      y += 3.5;
      if (edu.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        const dl = wrap(doc, edu.description, w, 8);
        doc.text(dl, m, y);
        y += dl.length * 3;
      }
      y += 2;
    }
  }

  // === CERTIFICATIONS ===
  if (data.certifications.length > 0) {
    y = sectionHeading(doc, "Certifications", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    for (const cert of data.certifications) {
      y = checkPage(doc, y);
      doc.text("•  " + cert, m, y);
      y += 4;
    }
    y += 2;
  }

  // === LANGUAGES ===
  if (data.languages && data.languages.length > 0) {
    y = sectionHeading(doc, "Languages", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text(data.languages.join("  •  "), m, y);
  }
}

// ==================== MODERN TEMPLATE (two-column, blue sidebar) ====================
function generateModern(doc: jsPDF, data: ResumeData) {
  const pw = 210;
  const sw = 62;
  const mx = sw + 8;
  const mw = pw - mx - 10;
  const sx = 7;
  const sWidth = sw - 10;
  const accent: [number, number, number] = [37, 99, 235];
  const black: [number, number, number] = [30, 30, 30];
  const gray: [number, number, number] = [100, 100, 100];
  const white: [number, number, number] = [255, 255, 255];

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pw, 36, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...white);
  doc.text((data.contact.name || "Your Name").toUpperCase(), 10, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const contactLine: string[] = [];
  if (data.contact.email) contactLine.push(data.contact.email);
  if (data.contact.phone) contactLine.push(data.contact.phone);
  if (data.contact.location) contactLine.push(data.contact.location);
  doc.text(contactLine.join("  |  "), 10, 22);
  const links: string[] = [];
  if (data.contact.linkedin) links.push(data.contact.linkedin);
  if (data.contact.github) links.push(data.contact.github);
  if (links.length > 0) {
    doc.setFontSize(7.5);
    doc.text(links.join("  |  "), 10, 28);
  }

  // Sidebar
  doc.setFillColor(240, 244, 255);
  doc.rect(0, 36, sw, 261, "F");

  let sy = 45;

  // Skills sidebar
  if (data.skills.length > 0) {
    sy = sectionHeading(doc, "Skills", sy, sx, sWidth, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...black);
    for (const s of data.skills) {
      sy = checkPage(doc, sy);
      doc.text("▸  " + s, sx, sy);
      sy += 3.8;
    }
    sy += 3;
  }

  // Tools sidebar
  if (data.tools.length > 0) {
    sy = sectionHeading(doc, "Tools", sy, sx, sWidth, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...black);
    for (const t of data.tools) {
      sy = checkPage(doc, sy);
      doc.text("▸  " + t, sx, sy);
      sy += 3.8;
    }
    sy += 3;
  }

  // Education sidebar
  if (data.education.length > 0) {
    sy = sectionHeading(doc, "Education", sy, sx, sWidth, accent);
    doc.setFontSize(8);
    doc.setTextColor(...black);
    for (const edu of data.education) {
      sy = checkPage(doc, sy);
      doc.setFont("helvetica", "bold");
      const dl = wrap(doc, edu.degree, sWidth, 8);
      doc.text(dl, sx, sy);
      sy += dl.length * 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...gray);
      if (edu.institution) { doc.text(edu.institution, sx, sy); sy += 3; }
      if (edu.year) { doc.text(edu.year, sx, sy); sy += 3; }
      sy += 2;
      doc.setTextColor(...black);
      doc.setFontSize(8);
    }
  }

  // Languages sidebar
  if (data.languages && data.languages.length > 0) {
    sy = sectionHeading(doc, "Languages", sy, sx, sWidth, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...black);
    for (const lang of data.languages) {
      doc.text("▸  " + lang, sx, sy);
      sy += 3.8;
    }
  }

  // === MAIN CONTENT ===
  let my = 45;

  if (data.summary) {
    my = sectionHeading(doc, "Summary", my, mx, mw, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, mw, 9);
    doc.text(sl, mx, my);
    my += sl.length * 3.5 + 4;
  }

  if (data.experience.length > 0) {
    my = sectionHeading(doc, "Experience", my, mx, mw, accent);
    for (const exp of data.experience) {
      my = checkPage(doc, my, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(exp.role, mx, my);
      my += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...accent);
      doc.text(exp.company, mx, my);
      doc.setTextColor(...gray);
      doc.setFont("helvetica", "normal");
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, mx + mw - dw, my);
      }
      my += 4;
      for (const r of exp.responsibilities) {
        my = bulletPoint(doc, r, my, mx + 2, mw - 2, black);
        my += 0.5;
      }
      my += 3;
    }
  }

  if (data.projects.length > 0) {
    my = sectionHeading(doc, "Projects", my, mx, mw, accent);
    for (const proj of data.projects) {
      my = checkPage(doc, my, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      doc.text(proj.name, mx, my);
      my += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const descParts = proj.description.split("\n").filter(Boolean);
      for (const part of descParts) {
        my = bulletPoint(doc, part.replace(/^[-•]\s*/, ""), my, mx + 2, mw - 2, black);
        my += 0.3;
      }
      if (proj.technologies.length > 0) {
        my += 1;
        doc.setFontSize(7.5);
        doc.setTextColor(...accent);
        doc.text(proj.technologies.join(" · "), mx, my);
        my += 4;
      }
      my += 2;
    }
  }
}

// ==================== MINIMAL TEMPLATE (ultra clean, single column) ====================
function generateMinimal(doc: jsPDF, data: ResumeData) {
  const m = 18;
  const w = 210 - m * 2;
  const black: [number, number, number] = [25, 25, 25];
  const gray: [number, number, number] = [120, 120, 120];
  const line: [number, number, number] = [200, 200, 200];
  let y = 18;

  // Name centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...black);
  const nameW = doc.getTextWidth((data.contact.name || "Your Name").toUpperCase());
  doc.text((data.contact.name || "Your Name").toUpperCase(), (210 - nameW) / 2, y);
  y += 6;

  // Contact centered
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...gray);
  const cp: string[] = [];
  if (data.contact.email) cp.push(data.contact.email);
  if (data.contact.phone) cp.push(data.contact.phone);
  if (data.contact.location) cp.push(data.contact.location);
  const cpText = cp.join("  •  ");
  const cpW = doc.getTextWidth(cpText);
  doc.text(cpText, (210 - cpW) / 2, y);
  y += 3.5;

  const lp: string[] = [];
  if (data.contact.linkedin) lp.push(data.contact.linkedin);
  if (data.contact.github) lp.push(data.contact.github);
  if (lp.length > 0) {
    doc.setFontSize(7.5);
    const lpText = lp.join("  •  ");
    const lpW = doc.getTextWidth(lpText);
    doc.text(lpText, (210 - lpW) / 2, y);
    y += 3.5;
  }

  drawLine(doc, m, y, w, line, 0.6);
  y += 5;

  // Summary
  if (data.summary) {
    y = sectionHeading(doc, "Summary", y, m, w, black);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, w, 9);
    doc.text(sl, m, y);
    y += sl.length * 3.5 + 4;
  }

  // Experience
  if (data.experience.length > 0) {
    y = sectionHeading(doc, "Experience", y, m, w, black);
    for (const exp of data.experience) {
      y = checkPage(doc, y, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(exp.role, m, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, m + w - dw, y);
      }
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(exp.company, m, y);
      y += 4;
      for (const r of exp.responsibilities) {
        y = bulletPoint(doc, r, y, m + 2, w - 2, black);
        y += 0.5;
      }
      y += 3;
    }
  }

  // Skills
  if (data.skills.length > 0) {
    y = sectionHeading(doc, "Skills", y, m, w, black);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    const st = data.skills.join("  •  ");
    const sl = wrap(doc, st, w, 9);
    doc.text(sl, m, y);
    y += sl.length * 3.5 + 3;
  }

  // Projects
  if (data.projects.length > 0) {
    y = sectionHeading(doc, "Projects", y, m, w, black);
    for (const proj of data.projects) {
      y = checkPage(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      doc.text(proj.name, m, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      const descParts = proj.description.split("\n").filter(Boolean);
      for (const part of descParts) {
        y = bulletPoint(doc, part.replace(/^[-•]\s*/, ""), y, m + 2, w - 2, black);
      }
      if (proj.technologies.length > 0) {
        y += 1;
        doc.setFontSize(7.5);
        doc.setTextColor(...gray);
        doc.text(proj.technologies.join(" · "), m, y);
        y += 4;
      }
      y += 2;
    }
  }

  // Education
  if (data.education.length > 0) {
    y = sectionHeading(doc, "Education", y, m, w, black);
    for (const edu of data.education) {
      y = checkPage(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      doc.text(edu.degree, m, y);
      if (edu.year) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...gray);
        const yw = doc.getTextWidth(edu.year);
        doc.text(edu.year, m + w - yw, y);
      }
      y += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      doc.text(edu.institution, m, y);
      y += 4;
    }
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    y = sectionHeading(doc, "Languages", y, m, w, black);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text(data.languages.join("  •  "), m, y);
  }
}

// ===== EXPORTS =====

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
  template: ResumeTemplate = "professional"
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  if (parsedData && parsedData.contact) {
    switch (template) {
      case "modern":
        generateModern(doc, parsedData);
        break;
      case "minimal":
        generateMinimal(doc, parsedData);
        break;
      case "executive":
        generateAccentBar(doc, parsedData, [13, 35, 64], [201, 168, 76]); // navy + gold
        break;
      case "creative":
        generateAccentBar(doc, parsedData, [124, 58, 237], [236, 72, 153]); // purple + pink
        break;
      case "tech":
        generateAccentBar(doc, parsedData, [15, 23, 42], [16, 185, 129]); // slate + emerald
        break;
      case "elegant":
        generateElegant(doc, parsedData);
        break;
      case "bold":
        generateBold(doc, parsedData);
        break;
      case "compact":
        generateCompact(doc, parsedData);
        break;
      case "professional":
      default:
        generateProfessional(doc, parsedData);
        break;
    }
  } else {
    // Fallback
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text("Resume", 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(optimizedText, 180);
    let y = 26;
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
  template: ResumeTemplate = "professional",
  fileName?: string
) {
  const doc = generateResumePDF(optimizedText, parsedData, template);
  doc.save(fileName || `optimized-resume-${template}.pdf`);
}

export function getTemplateList(): { id: ResumeTemplate; name: string; description: string }[] {
  return [
    { id: "professional", name: "Professional", description: "ATS-friendly single column. Universal classic." },
    { id: "modern", name: "Modern", description: "Two-column with blue header. Tech-friendly." },
    { id: "minimal", name: "Minimal", description: "Ultra clean, typography-focused." },
    { id: "executive", name: "Executive", description: "Navy + gold accent bar. C-suite & finance." },
    { id: "creative", name: "Creative", description: "Purple + pink gradient. Designers & marketing." },
    { id: "tech", name: "Tech", description: "Slate + emerald. Engineers & data roles." },
    { id: "elegant", name: "Elegant", description: "Serif headings, refined whitespace." },
    { id: "bold", name: "Bold", description: "Heavy color block header — instant attention." },
    { id: "compact", name: "Compact", description: "Maximum content on one page." },
  ];
}

// ==================== ACCENT BAR TEMPLATE (configurable colors) ====================
function generateAccentBar(doc: jsPDF, data: ResumeData, primary: [number, number, number], accent: [number, number, number]) {
  const m = 14;
  const w = 210 - m * 2;
  const black: [number, number, number] = [25, 25, 25];
  const gray: [number, number, number] = [110, 110, 110];
  const white: [number, number, number] = [255, 255, 255];

  // Top color block
  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, 32, "F");
  // Accent stripe
  doc.setFillColor(...accent);
  doc.rect(0, 32, 210, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...white);
  doc.text((data.contact.name || "Your Name").toUpperCase(), m, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const cp: string[] = [];
  if (data.contact.email) cp.push(data.contact.email);
  if (data.contact.phone) cp.push(data.contact.phone);
  if (data.contact.location) cp.push(data.contact.location);
  doc.text(cp.join("   |   "), m, 23);
  const lp: string[] = [];
  if (data.contact.linkedin) lp.push(data.contact.linkedin);
  if (data.contact.github) lp.push(data.contact.github);
  if (lp.length > 0) {
    doc.setFontSize(7.8);
    doc.text(lp.join("   |   "), m, 28);
  }

  let y = 42;

  if (data.summary) {
    y = sectionHeading(doc, "Professional Summary", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, w, 9.2);
    doc.text(sl, m, y);
    y += sl.length * 3.6 + 5;
  }

  if (data.experience.length > 0) {
    y = sectionHeading(doc, "Experience", y, m, w, accent);
    for (const exp of data.experience) {
      y = checkPage(doc, y, 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...primary);
      doc.text(exp.role, m, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, m + w - dw, y);
      }
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...accent);
      doc.text(exp.company, m, y);
      y += 4.2;
      for (const r of exp.responsibilities) {
        y = bulletPoint(doc, r, y, m + 2, w - 2, black);
        y += 0.6;
      }
      y += 3.5;
    }
  }

  if (data.projects.length > 0) {
    y = sectionHeading(doc, "Projects", y, m, w, accent);
    for (const proj of data.projects) {
      y = checkPage(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...primary);
      doc.text(proj.name, m, y);
      y += 4;
      const descParts = proj.description.split("\n").filter(Boolean);
      for (const part of descParts) {
        y = bulletPoint(doc, part.replace(/^[-•]\s*/, ""), y, m + 2, w - 2, black);
      }
      if (proj.technologies.length > 0) {
        doc.setFontSize(7.8);
        doc.setTextColor(...accent);
        doc.text(proj.technologies.join(" · "), m, y + 1);
        y += 4.5;
      }
      y += 2.5;
    }
  }

  if (data.skills.length > 0 || data.tools.length > 0) {
    y = sectionHeading(doc, "Skills & Tools", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    if (data.skills.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Skills: ", m, y);
      const lw = doc.getTextWidth("Skills: ");
      doc.setFont("helvetica", "normal");
      const sl = wrap(doc, data.skills.join(" · "), w - lw, 9);
      doc.text(sl, m + lw, y);
      y += sl.length * 3.6 + 1;
    }
    if (data.tools.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Tools: ", m, y);
      const lw = doc.getTextWidth("Tools: ");
      doc.setFont("helvetica", "normal");
      const tl = wrap(doc, data.tools.join(" · "), w - lw, 9);
      doc.text(tl, m + lw, y);
      y += tl.length * 3.6 + 1;
    }
    y += 3;
  }

  if (data.education.length > 0) {
    y = sectionHeading(doc, "Education", y, m, w, accent);
    for (const edu of data.education) {
      y = checkPage(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      doc.text(edu.degree, m, y);
      if (edu.year) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...gray);
        const yw = doc.getTextWidth(edu.year);
        doc.text(edu.year, m + w - yw, y);
      }
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      doc.text(`${edu.institution}${edu.field ? " — " + edu.field : ""}`, m, y);
      y += 5;
    }
  }

  if (data.certifications.length > 0) {
    y = sectionHeading(doc, "Certifications", y, m, w, accent);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    for (const cert of data.certifications) {
      y = checkPage(doc, y);
      doc.text("•  " + cert, m, y);
      y += 4;
    }
  }
}

// ==================== ELEGANT (serif-style, refined) ====================
function generateElegant(doc: jsPDF, data: ResumeData) {
  const m = 20;
  const w = 210 - m * 2;
  const black: [number, number, number] = [40, 40, 40];
  const gray: [number, number, number] = [120, 120, 120];
  const accent: [number, number, number] = [139, 90, 60]; // warm brown
  let y = 22;

  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...black);
  const nm = data.contact.name || "Your Name";
  const nw = doc.getTextWidth(nm);
  doc.text(nm, (210 - nw) / 2, y);
  y += 7;

  doc.setFont("times", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...accent);
  const cp: string[] = [];
  if (data.contact.email) cp.push(data.contact.email);
  if (data.contact.phone) cp.push(data.contact.phone);
  if (data.contact.location) cp.push(data.contact.location);
  const ct = cp.join("  ·  ");
  const cw = doc.getTextWidth(ct);
  doc.text(ct, (210 - cw) / 2, y);
  y += 5;

  drawLine(doc, m, y, w, accent, 0.4);
  y += 6;

  const sec = (t: string, cy: number) => {
    cy = checkPage(doc, cy, 10);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...accent);
    doc.text(t, m, cy);
    cy += 1.5;
    drawLine(doc, m, cy, w, accent, 0.3);
    return cy + 4.5;
  };

  if (data.summary) {
    y = sec("PROFILE", y);
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, w, 10);
    doc.text(sl, m, y);
    y += sl.length * 4 + 5;
  }

  if (data.experience.length > 0) {
    y = sec("EXPERIENCE", y);
    for (const exp of data.experience) {
      y = checkPage(doc, y, 16);
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...black);
      doc.text(exp.role, m, y);
      doc.setFont("times", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, m + w - dw, y);
      }
      y += 4.2;
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text(exp.company, m, y);
      y += 4.2;
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...black);
      for (const r of exp.responsibilities) {
        y = checkPage(doc, y);
        const lines = wrap(doc, r, w - 5, 9.5);
        doc.text("—", m, y);
        doc.text(lines, m + 4, y);
        y += lines.length * 4 + 0.5;
      }
      y += 3;
    }
  }

  if (data.projects.length > 0) {
    y = sec("PROJECTS", y);
    for (const proj of data.projects) {
      y = checkPage(doc, y, 12);
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(proj.name, m, y);
      y += 4;
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      const dp = proj.description.split("\n").filter(Boolean);
      for (const part of dp) {
        const lines = wrap(doc, part.replace(/^[-•]\s*/, ""), w - 5, 9.5);
        doc.text("—", m, y);
        doc.text(lines, m + 4, y);
        y += lines.length * 4;
      }
      if (proj.technologies.length > 0) {
        doc.setFont("times", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...accent);
        doc.text(proj.technologies.join(" · "), m, y + 0.5);
        y += 4;
      }
      y += 2;
    }
  }

  if (data.skills.length > 0) {
    y = sec("SKILLS", y);
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...black);
    const st = [...data.skills, ...(data.tools || [])].join("  ·  ");
    const sl = wrap(doc, st, w, 10);
    doc.text(sl, m, y);
    y += sl.length * 4 + 4;
  }

  if (data.education.length > 0) {
    y = sec("EDUCATION", y);
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...black);
    for (const edu of data.education) {
      y = checkPage(doc, y);
      doc.setFont("times", "bold");
      doc.text(edu.degree, m, y);
      doc.setFont("times", "italic");
      doc.setTextColor(...gray);
      const right = edu.year || "";
      if (right) {
        const rw = doc.getTextWidth(right);
        doc.text(right, m + w - rw, y);
      }
      y += 4;
      doc.setFont("times", "normal");
      doc.text(`${edu.institution}${edu.field ? " — " + edu.field : ""}`, m, y);
      doc.setTextColor(...black);
      y += 5;
    }
  }
}

// ==================== BOLD (heavy block header, max attention) ====================
function generateBold(doc: jsPDF, data: ResumeData) {
  const m = 14;
  const w = 210 - m * 2;
  const primary: [number, number, number] = [233, 69, 96]; // coral red
  const dark: [number, number, number] = [20, 20, 30];
  const black: [number, number, number] = [30, 30, 30];
  const gray: [number, number, number] = [110, 110, 110];
  const white: [number, number, number] = [255, 255, 255];

  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 48, "F");
  doc.setFillColor(...primary);
  doc.rect(0, 0, 8, 48, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...white);
  doc.text((data.contact.name || "Your Name").toUpperCase(), m, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...primary);
  const cp: string[] = [];
  if (data.contact.email) cp.push(data.contact.email);
  if (data.contact.phone) cp.push(data.contact.phone);
  if (data.contact.location) cp.push(data.contact.location);
  doc.text(cp.join("   |   "), m, 32);
  const lp: string[] = [];
  if (data.contact.linkedin) lp.push(data.contact.linkedin);
  if (data.contact.github) lp.push(data.contact.github);
  if (lp.length > 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(220, 220, 220);
    doc.text(lp.join("   |   "), m, 39);
  }

  let y = 58;

  const sec = (t: string, cy: number) => {
    cy = checkPage(doc, cy, 10);
    doc.setFillColor(...primary);
    doc.rect(m, cy - 4, 3, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text(t.toUpperCase(), m + 6, cy);
    return cy + 5.5;
  };

  if (data.summary) {
    y = sec("Summary", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, w, 9.5);
    doc.text(sl, m, y);
    y += sl.length * 3.8 + 4;
  }

  if (data.experience.length > 0) {
    y = sec("Experience", y);
    for (const exp of data.experience) {
      y = checkPage(doc, y, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...dark);
      doc.text(exp.role, m, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, m + w - dw, y);
      }
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.setTextColor(...primary);
      doc.text(exp.company, m, y);
      y += 4;
      for (const r of exp.responsibilities) {
        y = bulletPoint(doc, r, y, m + 2, w - 2, black);
      }
      y += 3;
    }
  }

  if (data.projects.length > 0) {
    y = sec("Projects", y);
    for (const proj of data.projects) {
      y = checkPage(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(proj.name, m, y);
      y += 4;
      const dp = proj.description.split("\n").filter(Boolean);
      for (const part of dp) {
        y = bulletPoint(doc, part.replace(/^[-•]\s*/, ""), y, m + 2, w - 2, black);
      }
      if (proj.technologies.length > 0) {
        doc.setFontSize(7.8);
        doc.setTextColor(...primary);
        doc.text(proj.technologies.join(" · "), m, y + 0.5);
        y += 4;
      }
      y += 2;
    }
  }

  if (data.skills.length > 0 || data.tools.length > 0) {
    y = sec("Skills", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...black);
    const all = [...data.skills, ...data.tools];
    // Pill rendering
    let cx = m;
    const py = y;
    for (const s of all) {
      const tw = doc.getTextWidth(s) + 6;
      if (cx + tw > m + w) {
        cx = m;
        y += 6;
      }
      doc.setFillColor(255, 230, 235);
      doc.roundedRect(cx, y - 3.5, tw, 5, 1.5, 1.5, "F");
      doc.setTextColor(...primary);
      doc.text(s, cx + 3, y);
      cx += tw + 2;
    }
    y += 8;
    doc.setTextColor(...black);
  }

  if (data.education.length > 0) {
    y = sec("Education", y);
    for (const edu of data.education) {
      y = checkPage(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...dark);
      doc.text(edu.degree, m, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      if (edu.year) {
        const yw = doc.getTextWidth(edu.year);
        doc.text(edu.year, m + w - yw, y);
      }
      y += 4;
      doc.text(`${edu.institution}${edu.field ? " — " + edu.field : ""}`, m, y);
      y += 5;
    }
  }
}

// ==================== COMPACT (dense, fits more on one page) ====================
function generateCompact(doc: jsPDF, data: ResumeData) {
  const m = 12;
  const w = 210 - m * 2;
  const black: [number, number, number] = [25, 25, 25];
  const gray: [number, number, number] = [110, 110, 110];
  const accent: [number, number, number] = [37, 99, 235];
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...black);
  doc.text(data.contact.name || "Your Name", m, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  const cp: string[] = [];
  if (data.contact.email) cp.push(data.contact.email);
  if (data.contact.phone) cp.push(data.contact.phone);
  if (data.contact.location) cp.push(data.contact.location);
  if (data.contact.linkedin) cp.push(data.contact.linkedin);
  if (data.contact.github) cp.push(data.contact.github);
  const ct = cp.join("  |  ");
  const tw = doc.getTextWidth(ct);
  doc.text(ct, m + w - tw, y);
  y += 3;
  drawLine(doc, m, y, w, accent, 0.4);
  y += 4;

  const sec = (t: string, cy: number) => {
    cy = checkPage(doc, cy, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...accent);
    doc.text(t.toUpperCase(), m, cy);
    return cy + 3.5;
  };

  if (data.summary) {
    y = sec("Summary", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...black);
    const sl = wrap(doc, data.summary, w, 8.5);
    doc.text(sl, m, y);
    y += sl.length * 3.2 + 3;
  }

  if (data.experience.length > 0) {
    y = sec("Experience", y);
    for (const exp of data.experience) {
      y = checkPage(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...black);
      doc.text(`${exp.role} — ${exp.company}`, m, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(...gray);
      if (exp.duration) {
        const dw = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, m + w - dw, y);
      }
      y += 3.3;
      doc.setFontSize(8.2);
      doc.setTextColor(...black);
      for (const r of exp.responsibilities) {
        y = checkPage(doc, y);
        const lines = wrap(doc, r, w - 4, 8.2);
        doc.text("•", m, y);
        doc.text(lines, m + 3, y);
        y += lines.length * 3.1;
      }
      y += 2;
    }
  }

  if (data.projects.length > 0) {
    y = sec("Projects", y);
    for (const proj of data.projects) {
      y = checkPage(doc, y, 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.8);
      doc.setTextColor(...black);
      doc.text(proj.name, m, y);
      if (proj.technologies.length > 0) {
        const nw = doc.getTextWidth(proj.name + "  ");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...accent);
        doc.text("| " + proj.technologies.join(", "), m + nw, y);
      }
      y += 3.2;
      doc.setFontSize(8.2);
      doc.setTextColor(...black);
      const dp = proj.description.split("\n").filter(Boolean);
      for (const part of dp) {
        const lines = wrap(doc, part.replace(/^[-•]\s*/, ""), w - 4, 8.2);
        doc.text("•", m, y);
        doc.text(lines, m + 3, y);
        y += lines.length * 3.1;
      }
      y += 1.5;
    }
  }

  if (data.skills.length > 0 || data.tools.length > 0) {
    y = sec("Skills", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...black);
    const all = [...data.skills, ...data.tools].join("  ·  ");
    const sl = wrap(doc, all, w, 8.2);
    doc.text(sl, m, y);
    y += sl.length * 3.1 + 3;
  }

  if (data.education.length > 0) {
    y = sec("Education", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...black);
    for (const edu of data.education) {
      y = checkPage(doc, y);
      doc.setFont("helvetica", "bold");
      doc.text(edu.degree, m, y);
      const right = `${edu.institution}${edu.year ? " — " + edu.year : ""}`;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      const rw = doc.getTextWidth(right);
      doc.text(right, m + w - rw, y);
      doc.setTextColor(...black);
      y += 3.6;
    }
  }
}
