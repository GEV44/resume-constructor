import { describe, it, expect } from "vitest";
import { hydrateResumeData, parseOptimizedPayload, serializeOptimizedPayload, renderResumeHtml, type ResumeData } from "@/lib/resume-pdf";

const original: Partial<ResumeData> = {
  contact: { name: "Jane Doe", email: "jane@example.com", phone: "", linkedin: "linkedin.com/in/jane" },
  skills: ["Python", "SQL"],
  tools: ["Docker"],
  experience: [{ company: "Acme", role: "Engineer", duration: "2020 – 2024", responsibilities: ["Did stuff", "Fixed bugs"] }],
  projects: [],
  education: [{ degree: "BSc", institution: "MIT", year: "2020" }],
  certifications: [],
};

describe("hydrateResumeData", () => {
  it("replaces original bullets with optimized ones instead of duplicating them", () => {
    const optimized = { ...original, experience: [{ ...original.experience![0], responsibilities: ["Shipped 12 features", "Cut bug backlog 40%"] }] };
    const merged = hydrateResumeData(optimized, "", original);
    expect(merged.experience).toHaveLength(1);
    expect(merged.experience[0].responsibilities).toEqual(["Shipped 12 features", "Cut bug backlog 40%"]);
  });

  it("keeps contact details from the original parse", () => {
    const merged = hydrateResumeData({ ...original, contact: { name: "Jane Doe", email: "", phone: "" } }, "", original);
    expect(merged.contact.linkedin).toBe("linkedin.com/in/jane");
    expect(merged.contact.email).toBe("jane@example.com");
  });

  it("respects skills removed during editing", () => {
    const merged = hydrateResumeData({ ...original, skills: ["Python"] }, "", original);
    expect(merged.skills).toEqual(["Python"]);
  });
});

describe("optimized payload", () => {
  it("round-trips suggestions and mode", () => {
    const structured = hydrateResumeData(original);
    const raw = serializeOptimizedPayload({ text: "Jane", structured, suggestions: ["If you have used dbt, add it."], mode: "both" });
    const parsed = parseOptimizedPayload(raw)!;
    expect(parsed.suggestions).toEqual(["If you have used dbt, add it."]);
    expect(parsed.mode).toBe("both");
    expect(parsed.structured.contact.name).toBe("Jane Doe");
  });

  it("returns null for legacy plain-text payloads", () => {
    expect(parseOptimizedPayload("JANE DOE\nEngineer")).toBeNull();
  });
});

describe("renderResumeHtml", () => {
  it("escapes resume content in every template", () => {
    const evil = hydrateResumeData({ ...original, summary: `<img src=x onerror="alert(1)">` });
    for (const t of ["ats", "executive", "modern", "minimal", "creative", "tech", "elegant", "bold", "editorial", "compact"] as const) {
      const html = renderResumeHtml(t, evil);
      expect(html).not.toContain("<img src=x");
    }
  });
});
