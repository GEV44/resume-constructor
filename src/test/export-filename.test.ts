import { describe, it, expect } from "vitest";
import { exportFilename } from "@/lib/export-filename";

describe("exportFilename", () => {
  it("builds Name_Role_Resume.ext", () => {
    expect(exportFilename("Ada Lovelace", "Data Scientist", "pdf")).toBe("Ada_Lovelace_Data_Scientist_Resume.pdf");
  });
  it("strips unsafe characters and collapses separators", () => {
    expect(exportFilename("  Ada / Lovelace?? ", "Front-end  Engineer (React)", "docx")).toBe("Ada_Lovelace_Front-end_Engineer_React_Resume.docx");
  });
  it("keeps Armenian and Russian letters", () => {
    expect(exportFilename("Գևորգ Հովհաննիսյան", "ML Engineer", "pdf")).toBe("Գևորգ_Հովհաննիսյան_ML_Engineer_Resume.pdf");
    expect(exportFilename("Иван Петров", "Аналитик", "txt")).toBe("Иван_Петров_Аналитик_Resume.txt");
  });
  it("falls back when name or role is empty", () => {
    expect(exportFilename("", "", "pdf")).toBe("Resume.pdf");
    expect(exportFilename("Ada", undefined, "pdf")).toBe("Ada_Resume.pdf");
  });
  it("adds an optional suffix and caps length", () => {
    expect(exportFilename("Ada", "Designer", "pdf", "modern")).toBe("Ada_Designer_Resume_modern.pdf");
    expect(exportFilename("A".repeat(200), "B".repeat(200), "pdf").length).toBeLessThanOrEqual(120);
  });
});
