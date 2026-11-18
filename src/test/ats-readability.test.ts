import { describe, it, expect } from "vitest";
import { checkReadability } from "@/lib/ats-readability";

const good = `Ada Lovelace
ada@example.com | +1 555 123 4567 | London

Summary
Data scientist with four years of experience.

Experience
Data Scientist, Acme (2021 - 2025)
- Built churn model that reduced churn by 18%
- Ran 40 A/B tests

Education
BSc Mathematics, University of London (2017 - 2021)

Skills
Python, SQL, Statistics
${"Extra line of resume content that keeps the text reasonably long.\n".repeat(12)}`;

const ids = (t: string) => checkReadability(t).map((i) => i.id);

describe("checkReadability", () => {
  it("passes a clean resume with no issues", () => {
    expect(ids(good)).toEqual([]);
  });
  it("flags missing email and phone", () => {
    const r = ids(good.replace("ada@example.com", "").replace("+1 555 123 4567", ""));
    expect(r).toContain("no-email");
    expect(r).toContain("no-phone");
  });
  it("flags missing standard sections", () => {
    const r = ids("Ada Lovelace\nada@example.com 555 123 4567\n" + "I did many things at many places over many years.\n".repeat(20));
    expect(r).toContain("no-experience-heading");
    expect(r).toContain("no-education-heading");
    expect(r).toContain("no-skills-heading");
  });
  it("flags table-like columns and decorative glyphs", () => {
    expect(ids(good + "Python \t\t Java \t\t Go\n")).toContain("columns");
    expect(ids(good + "★★★★☆ Python\n")).toContain("glyphs");
  });
  it("flags missing dates", () => {
    expect(ids(good.replace(/\(.*?\)/g, ""))).toContain("no-dates");
  });
  it("flags too-short and too-long text", () => {
    expect(ids("Ada\nada@example.com")).toContain("too-short");
    expect(ids(good + "word ".repeat(2000))).toContain("too-long");
  });
  it("every issue has an actionable fix and a severity", () => {
    for (const i of checkReadability("hello")) {
      expect(i.fix.length).toBeGreaterThan(10);
      expect(["high", "medium", "low"]).toContain(i.severity);
    }
  });
});
