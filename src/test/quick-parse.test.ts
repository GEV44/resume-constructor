import { describe, it, expect } from "vitest";
import { quickParse, yearsFromRanges, SAMPLE_RESUME } from "@/lib/quick-parse";
import { scoreResume } from "@/lib/scoring";

const NOW = new Date(2026, 8, 1); // Sep 2026

describe("yearsFromRanges", () => {
  it("sums ranges and counts overlaps once", () => {
    expect(yearsFromRanges("Jan 2020 – Dec 2021\nJan 2021 - Dec 2022", NOW)).toBe(3);
  });
  it("treats Present as now and year-only ranges as whole years", () => {
    expect(yearsFromRanges("Sep 2024 – Present", NOW)).toBe(2);
    expect(yearsFromRanges("2018 - 2019", NOW)).toBe(2);
  });
  it("ignores text without ranges", () => {
    expect(yearsFromRanges("Graduated in 2019", NOW)).toBe(0);
  });
});

describe("quickParse", () => {
  const parsed = quickParse(SAMPLE_RESUME);

  it("splits sections from headings", () => {
    expect(parsed.contact?.name).toBe("Alex Morgan");
    expect(parsed.contact?.email).toBe("alex.morgan@example.com");
    expect(parsed.summary).toMatch(/Frontend engineer/);
    expect(parsed.skills).toEqual(expect.arrayContaining(["TypeScript", "React", "Tailwind CSS"]));
    expect(parsed.education?.[0].degree).toMatch(/Computer Science/);
  });

  it("collects bullets and experience years", () => {
    expect(parsed.experience?.[0].responsibilities).toHaveLength(6);
    expect(parsed.total_years_experience).toBeGreaterThanOrEqual(7);
  });

  it("produces a realistic score for the sample", () => {
    const r = scoreResume(parsed, "frontend-engineer", SAMPLE_RESUME);
    expect(r.missing_skills).toEqual([]);
    expect(r.overall_score).toBeGreaterThan(60);
  });

  it("copes with unstructured text", () => {
    const p = quickParse("Jane\nBuilt dashboards in Python and SQL that saved 10 hours per week for the finance team.");
    expect(p.experience?.[0].responsibilities).toHaveLength(1);
  });
});
