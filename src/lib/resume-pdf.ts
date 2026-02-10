import jsPDF from "jspdf";

export type ResumeTemplate = "executive" | "modern" | "minimal" | "creative";

export interface ResumeData {
  contact: { name: string; email: string; phone: string };
  education: { degree: string; institution: string; year: string; field: string }[];
  skills: string[];
  tools: string[];
  experience: { company: string; role: string; duration: string; years: number; responsibilities: string[] }[];
  projects: { name: string; description: string; technologies: string[] }[];
  certifications: string[];
  total_years_experience: number;
  quantified_metrics: string[];
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
  fontSizeTitle: number;
  fontSizeSection: number;
  fontSizeBody: number;
  layout: "single" | "two-column";
}

const TEMPLATES: Record<ResumeTemplate, TemplateConfig> = {
  executive: {
    name: "Executive",
    headerBg: [26, 26, 46],
    headerText: [255, 255, 255],
    accentColor: [139, 92, 246],
    bodyText: [30, 30, 30],
    mutedText: [100, 100, 100],
    sidebarBg: [245, 243, 255],
    sidebarText: [30, 30, 30],
    fontSizeTitle: 24,
    fontSizeSection: 13,
    fontSizeBody: 9.5,
    layout: "two-column",
  },
  modern: {
    name: "Modern",
    headerBg: [59, 130, 246],
    headerText: [255, 255, 255],
    accentColor: [59, 130, 246],
    bodyText: [30, 30, 30],
    mutedText: [110, 110, 110],
    sidebarBg: [240, 245, 255],
    sidebarText: [30, 30, 30],
    fontSizeTitle: 22,
    fontSizeSection: 12,
    fontSizeBody: 9.5,
    layout: "two-column",
  },
  minimal: {
    name: "Minimal",
    headerBg: [255, 255, 255],
    headerText: [20, 20, 20],
    accentColor: [50, 50, 50],
    bodyText: [40, 40, 40],
    mutedText: [120, 120, 120],
    sidebarBg: null,
    sidebarText: null,
    fontSizeTitle: 26,
    fontSizeSection: 12,
    fontSizeBody: 9.5,
    layout: "single",
  },
  creative: {
    name: "Creative",
    headerBg: [139, 92, 246],
    headerText: [255, 255, 255],
    accentColor: [236, 72, 153],
    bodyText: [30, 30, 30],
    mutedText: [100, 100, 100],
    sidebarBg: [250, 245, 255],
    sidebarText: [60, 30, 80],
    fontSizeTitle: 24,
    fontSizeSection: 13,
    fontSizeBody: 9.5,
    layout: "two-column",
  },
};

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, x: number, config: TemplateConfig): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(config.fontSizeSection);
  doc.setTextColor(...config.accentColor);
  doc.text(title.toUpperCase(), x, y);
  y += 2;
  doc.setDrawColor(...config.accentColor);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + 50, y);
  return y + 6;
}

function drawBullet(doc: jsPDF, text: string, y: number, x: number, maxWidth: number, config: TemplateConfig): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(config.fontSizeBody);
  doc.setTextColor(...config.bodyText);
  const lines = wrapText(doc, text, maxWidth - 6, config.fontSizeBody);
  doc.text("•", x, y);
  doc.text(lines, x + 5, y);
  return y + lines.length * 4;
}

function checkPageBreak(doc: jsPDF, y: number, margin: number = 20): number {
  if (y > 270) {
    doc.addPage();
    return margin;
  }
  return y;
}

function generateTwoColumn(doc: jsPDF, data: ResumeData, config: TemplateConfig) {
  const pageWidth = 210;
  const sidebarWidth = 65;
  const mainX = sidebarWidth + 8;
  const mainWidth = pageWidth - mainX - 12;
  const sideX = 8;
  const sideWidth = sidebarWidth - 12;

  // Header bar
  doc.setFillColor(...config.headerBg);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(config.fontSizeTitle);
  doc.setTextColor(...config.headerText);
  doc.text(data.contact.name || "Your Name", 12, 20);

  // Contact info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const contactParts: string[] = [];
  if (data.contact.email) contactParts.push(data.contact.email);
  if (data.contact.phone) contactParts.push(data.contact.phone);
  doc.text(contactParts.join("  |  "), 12, 28);

  // Experience years badge
  if (data.total_years_experience > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const badge = `${data.total_years_experience}+ Years Experience`;
    doc.text(badge, 12, 36);
  }

  // Sidebar background
  if (config.sidebarBg) {
    doc.setFillColor(...config.sidebarBg);
    doc.rect(0, 42, sidebarWidth, 255, "F");
  }

  // ---- SIDEBAR CONTENT ----
  let sideY = 52;
  const sideTextColor = config.sidebarText || config.bodyText;

  // Skills
  if (data.skills.length > 0) {
    sideY = drawSectionTitle(doc, "Skills", sideY, sideX, config);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...sideTextColor);
    for (const skill of data.skills) {
      sideY = checkPageBreak(doc, sideY, 52);
      doc.text("▪  " + skill, sideX, sideY);
      sideY += 4.5;
    }
    sideY += 4;
  }

  // Tools
  if (data.tools.length > 0) {
    sideY = checkPageBreak(doc, sideY, 52);
    sideY = drawSectionTitle(doc, "Tools", sideY, sideX, config);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...sideTextColor);
    for (const tool of data.tools) {
      sideY = checkPageBreak(doc, sideY, 52);
      doc.text("▪  " + tool, sideX, sideY);
      sideY += 4.5;
    }
    sideY += 4;
  }

  // Education
  if (data.education.length > 0) {
    sideY = checkPageBreak(doc, sideY, 52);
    sideY = drawSectionTitle(doc, "Education", sideY, sideX, config);
    doc.setFontSize(8.5);
    doc.setTextColor(...sideTextColor);
    for (const edu of data.education) {
      sideY = checkPageBreak(doc, sideY, 52);
      doc.setFont("helvetica", "bold");
      const degLines = wrapText(doc, edu.degree || "Degree", sideWidth, 8.5);
      doc.text(degLines, sideX, sideY);
      sideY += degLines.length * 3.5;
      doc.setFont("helvetica", "normal");
      if (edu.institution) {
        const instLines = wrapText(doc, edu.institution, sideWidth, 8.5);
        doc.text(instLines, sideX, sideY);
        sideY += instLines.length * 3.5;
      }
      doc.setTextColor(...config.mutedText);
      if (edu.field) doc.text(edu.field, sideX, sideY);
      sideY += 3.5;
      if (edu.year) doc.text(edu.year, sideX, sideY);
      sideY += 6;
      doc.setTextColor(...sideTextColor);
    }
    sideY += 2;
  }

  // Certifications
  if (data.certifications.length > 0) {
    sideY = checkPageBreak(doc, sideY, 52);
    sideY = drawSectionTitle(doc, "Certifications", sideY, sideX, config);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...sideTextColor);
    for (const cert of data.certifications) {
      sideY = checkPageBreak(doc, sideY, 52);
      const certLines = wrapText(doc, "✦  " + cert, sideWidth, 8.5);
      doc.text(certLines, sideX, sideY);
      sideY += certLines.length * 4;
    }
  }

  // ---- MAIN CONTENT ----
  let mainY = 52;

  // Experience
  if (data.experience.length > 0) {
    mainY = drawSectionTitle(doc, "Professional Experience", mainY, mainX, config);

    for (const exp of data.experience) {
      mainY = checkPageBreak(doc, mainY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...config.bodyText);
      doc.text(exp.role || "Role", mainX, mainY);
      mainY += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...config.accentColor);
      doc.text(exp.company || "Company", mainX, mainY);
      doc.setTextColor(...config.mutedText);
      doc.text(exp.duration || "", mainX + 70, mainY);
      mainY += 5;

      for (const resp of exp.responsibilities) {
        mainY = checkPageBreak(doc, mainY);
        mainY = drawBullet(doc, resp, mainY, mainX, mainWidth, config);
        mainY += 1;
      }
      mainY += 4;
    }
  }

  // Projects
  if (data.projects.length > 0) {
    mainY = checkPageBreak(doc, mainY);
    mainY = drawSectionTitle(doc, "Projects", mainY, mainX, config);

    for (const proj of data.projects) {
      mainY = checkPageBreak(doc, mainY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...config.bodyText);
      doc.text(proj.name || "Project", mainX, mainY);
      mainY += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(config.fontSizeBody);
      doc.setTextColor(...config.bodyText);
      const descLines = wrapText(doc, proj.description, mainWidth, config.fontSizeBody);
      doc.text(descLines, mainX, mainY);
      mainY += descLines.length * 3.8 + 1;

      if (proj.technologies.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...config.accentColor);
        doc.text(proj.technologies.join("  ·  "), mainX, mainY);
        mainY += 6;
      }
    }
  }
}

function generateSingleColumn(doc: jsPDF, data: ResumeData, config: TemplateConfig) {
  const margin = 18;
  const contentWidth = 210 - margin * 2;
  let y = 18;

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(config.fontSizeTitle);
  doc.setTextColor(...config.headerText);
  doc.text(data.contact.name || "Your Name", margin, y);
  y += 8;

  // Thin accent line
  doc.setDrawColor(...config.accentColor);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...config.mutedText);
  const contactParts: string[] = [];
  if (data.contact.email) contactParts.push(data.contact.email);
  if (data.contact.phone) contactParts.push(data.contact.phone);
  doc.text(contactParts.join("  |  "), margin, y);
  y += 10;

  // Experience
  if (data.experience.length > 0) {
    y = drawSectionTitle(doc, "Experience", y, margin, config);
    for (const exp of data.experience) {
      y = checkPageBreak(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...config.bodyText);
      doc.text(exp.role || "Role", margin, y);
      mainRightAlign(doc, exp.duration || "", y, margin + contentWidth);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...config.accentColor);
      doc.text(exp.company || "", margin, y);
      y += 5;
      for (const resp of exp.responsibilities) {
        y = checkPageBreak(doc, y);
        y = drawBullet(doc, resp, y, margin, contentWidth, config);
        y += 1;
      }
      y += 4;
    }
  }

  // Skills
  if (data.skills.length > 0) {
    y = checkPageBreak(doc, y);
    y = drawSectionTitle(doc, "Skills", y, margin, config);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...config.bodyText);
    const skillText = data.skills.join("  ·  ");
    const skillLines = wrapText(doc, skillText, contentWidth, 9.5);
    doc.text(skillLines, margin, y);
    y += skillLines.length * 4 + 4;
  }

  // Projects
  if (data.projects.length > 0) {
    y = checkPageBreak(doc, y);
    y = drawSectionTitle(doc, "Projects", y, margin, config);
    for (const proj of data.projects) {
      y = checkPageBreak(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...config.bodyText);
      doc.text(proj.name || "Project", margin, y);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const descLines = wrapText(doc, proj.description, contentWidth, 9.5);
      doc.text(descLines, margin, y);
      y += descLines.length * 4 + 2;
      if (proj.technologies.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...config.accentColor);
        doc.text(proj.technologies.join("  ·  "), margin, y);
        y += 6;
      }
    }
  }

  // Education
  if (data.education.length > 0) {
    y = checkPageBreak(doc, y);
    y = drawSectionTitle(doc, "Education", y, margin, config);
    for (const edu of data.education) {
      y = checkPageBreak(doc, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...config.bodyText);
      doc.text(edu.degree || "Degree", margin, y);
      mainRightAlign(doc, edu.year || "", y, margin + contentWidth);
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...config.mutedText);
      doc.text(`${edu.institution}${edu.field ? " — " + edu.field : ""}`, margin, y);
      y += 6;
    }
  }

  // Certifications
  if (data.certifications.length > 0) {
    y = checkPageBreak(doc, y);
    y = drawSectionTitle(doc, "Certifications", y, margin, config);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...config.bodyText);
    for (const cert of data.certifications) {
      y = checkPageBreak(doc, y);
      doc.text("✦  " + cert, margin, y);
      y += 5;
    }
  }
}

function mainRightAlign(doc: jsPDF, text: string, y: number, rightX: number) {
  const w = doc.getTextWidth(text);
  doc.text(text, rightX - w, y);
}

export function generateResumePDF(
  optimizedText: string,
  parsedData: ResumeData | null,
  template: ResumeTemplate = "executive"
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const config = TEMPLATES[template];

  // If we have parsed structured data, use it for a designed layout
  if (parsedData && parsedData.contact) {
    if (config.layout === "two-column") {
      generateTwoColumn(doc, parsedData, config);
    } else {
      generateSingleColumn(doc, parsedData, config);
    }
  } else {
    // Fallback: plain text layout
    doc.setFillColor(...config.headerBg);
    doc.rect(0, 0, 210, 25, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...config.headerText);
    doc.text("Optimized Resume", 15, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...config.bodyText);
    const lines = doc.splitTextToSize(optimizedText, 180);
    let y = 35;
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 15, y);
      y += 5;
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
    { id: "executive", name: "Executive", description: "Two-column layout with dark header. Best for senior roles." },
    { id: "modern", name: "Modern", description: "Clean two-column with blue accents. Great for tech roles." },
    { id: "minimal", name: "Minimal", description: "Single column, typography-focused. Universal appeal." },
    { id: "creative", name: "Creative", description: "Bold colors with violet & pink accents. Stands out." },
  ];
}
