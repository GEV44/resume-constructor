/** Builds a recruiter-friendly file name such as `Ada_Lovelace_Data_Scientist_Resume.pdf`. */
const clean = (s?: string) =>
  (s ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}-]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");

export function exportFilename(name: string | undefined, role: string | undefined, ext: string, suffix?: string): string {
  const parts = [clean(name).slice(0, 40), clean(role).slice(0, 40), "Resume", clean(suffix).slice(0, 20)].filter(Boolean);
  return `${parts.join("_")}.${ext.replace(/^\./, "")}`;
}
