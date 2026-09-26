import { describe, it, expect, vi, afterEach } from "vitest";
import type { ResumeData } from "@/lib/resume-pdf";
import {
  buildAtsPdf,
  buildDocx,
  downloadText,
  hasNonLatinText,
  resumeToPlainText,
  sanitizePdfText,
  splitBullets,
} from "@/lib/resume-export";

const baseResume = (overrides: Partial<ResumeData> = {}): ResumeData => ({
  contact: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 555 0100",
    location: "Berlin",
    linkedin: "linkedin.com/in/janedoe",
  },
  summary: "Backend engineer focused on reliable distributed systems.",
  education: [{ degree: "BSc", field: "Computer Science", institution: "TU Berlin", year: "2018" }],
  skills: ["TypeScript", "React", "PostgreSQL"],
  tools: ["react", "Docker", "typescript", "Kubernetes"],
  experience: [{
    company: "Acme",
    role: "Senior Engineer",
    duration: "2020 – Present",
    responsibilities: ["Led migration to Kubernetes", "- Cut p99 latency by 40%"],
  }],
  projects: [{
    name: "Ledger",
    description: "Built an event-sourced ledger\n• Handles 10k tx/s • Zero-downtime deploys",
    technologies: ["Go", "Kafka"],
  }],
  certifications: ["AWS Solutions Architect"],
  languages: ["English", "German"],
  ...overrides,
});

describe("resumeToPlainText", () => {
  it("renders the header and sections in ATS order", () => {
    const text = resumeToPlainText(baseResume());
    const lines = text.split("\n");

    expect(lines[0]).toBe("Jane Doe");
    expect(lines[1]).toBe("jane@example.com | +1 555 0100 | Berlin | linkedin.com/in/janedoe");

    const order = ["SUMMARY", "SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION", "CERTIFICATIONS", "LANGUAGES"]
      .map((heading) => lines.indexOf(heading));
    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);

    // Every section heading is preceded by a blank line.
    order.forEach((index) => expect(lines[index - 1]).toBe(""));
    expect(text).not.toMatch(/[ \t]+$/m);
    expect(text).toBe(text.trim());
  });

  it("dedupes skills and tools case-insensitively, keeping the first spelling", () => {
    const lines = resumeToPlainText(baseResume()).split("\n");
    expect(lines[lines.indexOf("SKILLS") + 1]).toBe("TypeScript, React, PostgreSQL, Docker, Kubernetes");
  });

  it("formats experience, projects and education entries", () => {
    const text = resumeToPlainText(baseResume());
    expect(text).toContain("Senior Engineer — Acme (2020 – Present)\n• Led migration to Kubernetes\n• Cut p99 latency by 40%");
    expect(text).toContain("Ledger (Go, Kafka)\n• Built an event-sourced ledger\n• Handles 10k tx/s\n• Zero-downtime deploys");
    expect(text).toContain("BSc, Computer Science — TU Berlin (2018)");
    expect(text).toContain("CERTIFICATIONS\n• AWS Solutions Architect");
    expect(text).toContain("LANGUAGES\nEnglish, German");
  });

  it("omits empty sections and empty contact fields", () => {
    const text = resumeToPlainText(baseResume({
      contact: { name: "Jane Doe", email: "jane@example.com", phone: "" },
      summary: "   ",
      projects: [],
      certifications: [],
      languages: undefined,
    }));
    expect(text.split("\n")[1]).toBe("jane@example.com");
    expect(text).not.toMatch(/SUMMARY|PROJECTS|CERTIFICATIONS|LANGUAGES/);
    expect(text).not.toContain("\n\n\n");
  });
});

describe("splitBullets", () => {
  it("splits on newlines and bullet separators and strips leading markers", () => {
    expect(splitBullets("First\n- Second\n· Third • Fourth\n\n  * Fifth  ")).toEqual([
      "First", "Second", "Third", "Fourth", "Fifth",
    ]);
  });

  it("keeps hyphens that are part of the text", () => {
    expect(splitBullets("Zero-downtime deploys")).toEqual(["Zero-downtime deploys"]);
  });
});

describe("PDF sanitization", () => {
  it("maps typographic punctuation to ASCII", () => {
    const nbsp = String.fromCharCode(0xa0);
    expect(sanitizePdfText(`“Smart” ‘quotes’ – en — em • bullet…${nbsp}end`))
      .toBe("\"Smart\" 'quotes' - en - em - bullet... end");
  });

  it("keeps Latin-1 accents and strips characters outside Latin-1", () => {
    expect(sanitizePdfText("José Müller")).toBe("José Müller");
    expect(sanitizePdfText("Dev 🚀 Иван")).toBe("Dev ");
  });

  it("hasNonLatinText only flags characters that would be lost", () => {
    expect(hasNonLatinText(baseResume({ summary: "“Quoted” — résumé…" }))).toBe(false);
    expect(hasNonLatinText(baseResume({ contact: { ...baseResume().contact, name: "Иван Петров" } }))).toBe(true);
    expect(hasNonLatinText(baseResume({ skills: ["TypeScript", "日本語"] }))).toBe(true);
  });
});

describe("buildAtsPdf", () => {
  const longResume = () => baseResume({
    experience: Array.from({ length: 4 }, (_, job) => ({
      company: `Company ${job + 1}`,
      role: "Software Engineer",
      duration: `${2010 + job} – ${2011 + job}`,
      responsibilities: Array.from({ length: 15 }, (_, i) =>
        `Delivered initiative ${job * 15 + i + 1} that improved throughput and reliability across several services, `
        + "coordinating with product, design and infrastructure teams."),
    })),
  });

  it("produces a real-text, multi-page A4 document for a long resume", async () => {
    const doc = await buildAtsPdf(longResume());
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210);

    const output = doc.output();
    expect(output).toMatch(/\(Jane Doe\) Tj/);
    expect(output).toMatch(/\(Delivered initiative 60 that/);
    expect(output).toMatch(/\/Creator \(AI Resume Builder\)/);
  });

  it("does not emit characters outside Latin-1 into the content stream", async () => {
    const doc = await buildAtsPdf(baseResume({ summary: "Ships fast 🚀 — “always”" }));
    const output = doc.output();
    expect(output).toContain("(Ships fast - \"always\") Tj");
  });
});

// jsdom's Blob has no arrayBuffer(), so read it the old-fashioned way.
const readBlob = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer);
  reader.onerror = () => reject(reader.error);
  reader.readAsArrayBuffer(blob);
});

describe("buildDocx", () => {
  it("returns a non-empty .docx (zip) Blob", async () => {
    const blob = await buildDocx(baseResume());
    expect(blob.size).toBeGreaterThan(1000);
    const bytes = new Uint8Array(await readBlob(blob));
    // .docx files are zip archives, which start with "PK".
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
  });
});

describe("downloadText", () => {
  afterEach(() => vi.restoreAllMocks());

  it("saves the plain text through a temporary download link", () => {
    const createObjectURL = vi.fn(() => "blob:resume");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.useFakeTimers();

    downloadText(baseResume(), "jane-resume");

    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("jane-resume.txt");
    expect(document.querySelector("a[download]")).toBeNull();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:resume");
    vi.useRealTimers();
  });
});
