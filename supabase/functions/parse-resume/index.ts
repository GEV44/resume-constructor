import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import JSZip from "npm:jszip@3.10.1";
import { adminClient, enforceHourlyLimit, handle, HttpError, json, readJson, requireUser } from "../_shared/http.ts";
import { callTool, todayLine } from "../_shared/ai.ts";
import type { ParsedResume } from "../_shared/scoring.ts";

const MAX_BYTES = 5 * 1024 * 1024;

const stringArray = { type: "array", items: { type: "string" } };
const PARSE_SCHEMA = {
  type: "object",
  properties: {
    contact: {
      type: "object",
      properties: {
        name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, location: { type: "string" },
        linkedin: { type: "string" }, github: { type: "string" }, website: { type: "string" },
      },
      required: ["name", "email", "phone"],
    },
    summary: { type: "string", description: "The candidate's own summary/objective, verbatim. Empty if absent." },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: { degree: { type: "string" }, institution: { type: "string" }, year: { type: "string" }, field: { type: "string" } },
        required: ["degree", "institution", "year", "field"],
      },
    },
    skills: stringArray,
    tools: stringArray,
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" }, role: { type: "string" }, duration: { type: "string" },
          years: { type: "number", description: "Length of this position in years (decimals allowed)" },
          responsibilities: { ...stringArray, description: "Each bullet verbatim" },
        },
        required: ["company", "role", "duration", "years", "responsibilities"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, description: { type: "string" }, technologies: stringArray },
        required: ["name", "description", "technologies"],
      },
    },
    certifications: stringArray,
    languages: { ...stringArray, description: "Spoken languages with proficiency if stated" },
    total_years_experience: { type: "number", description: "Total professional experience in years, overlapping periods counted once" },
    quantified_metrics: { ...stringArray, description: "Every quantified achievement phrase (numbers, %, money, time)" },
    extracted_text: { type: "string", description: "The full plain text of the resume, preserving reading order" },
  },
  required: ["contact", "summary", "education", "skills", "tools", "experience", "projects", "certifications", "languages", "total_years_experience", "quantified_metrics", "extracted_text"],
};

const SYSTEM = `${todayLine()}

You are a precise resume parser. Extract structured data exactly as written — never infer, embellish or invent anything.
- Copy bullets, titles, company names and dates verbatim.
- Put programming languages, methods and domain skills in "skills"; named software, platforms and libraries in "tools".
- If a field is missing, return an empty string or empty array.`;

/** Plain text from a .docx (Office Open XML) without any external service. */
async function docxToText(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new HttpError(422, "This DOCX file has no readable document body.");
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type ParseOutput = ParsedResume & { extracted_text?: string };

Deno.serve(handle("parse-resume", async (req) => {
  const supabase = adminClient();
  const user = await requireUser(req, supabase);
  await enforceHourlyLimit(supabase, "resumes", user.id, "PARSE_LIMIT_PER_HOUR", 20);

  const { filePath, fileName } = await readJson<{ filePath?: unknown; fileName?: unknown }>(req);
  if (typeof filePath !== "string" || typeof fileName !== "string") throw new HttpError(400, "Invalid request");
  if (!filePath.startsWith(`${user.id}/`) || filePath.includes("..")) throw new HttpError(403, "Forbidden");

  const { data: file, error } = await supabase.storage.from("resumes").download(filePath);
  if (error || !file) throw new HttpError(404, "Uploaded file not found");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) throw new HttpError(422, "The file is empty.");
  if (bytes.byteLength > MAX_BYTES) throw new HttpError(413, "File must be under 5MB.");

  // Trust the file signature, not the name: %PDF or a ZIP container (DOCX).
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isPdf && !isZip) throw new HttpError(415, "Only PDF and DOCX files are supported.");

  const user_content = isPdf
    ? [
      { type: "text" as const, text: "Parse this resume document." },
      { type: "image_url" as const, image_url: { url: `data:application/pdf;base64,${encodeBase64(bytes)}` } },
    ]
    : `Parse this resume (text extracted from a DOCX file):\n\n${(await docxToText(bytes)).slice(0, 60_000)}`;

  const parsed = await callTool<ParseOutput>({
    system: SYSTEM,
    user: user_content,
    tool: { name: "parse_resume", description: "Return the resume as structured data", parameters: PARSE_SCHEMA },
    temperature: 0,
  });

  let text = parsed.extracted_text ?? "";
  delete parsed.extracted_text;
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  parsed.skills = [...new Set(parsed.skills ?? [])].sort(collator.compare);
  parsed.tools = [...new Set(parsed.tools ?? [])].sort(collator.compare);

  if (!text) {
    text = [
      parsed.contact?.name,
      parsed.summary,
      parsed.skills.length ? `Skills: ${parsed.skills.join(", ")}` : "",
      ...(parsed.experience ?? []).map((e) => `${e.role} at ${e.company} (${e.duration}): ${(e.responsibilities ?? []).join("; ")}`),
    ].filter(Boolean).join("\n\n");
  }
  if (!text.trim() && (parsed.experience ?? []).length === 0 && parsed.skills.length === 0) {
    throw new HttpError(422, "We couldn't read any text from this file. If it's a scanned image, export it as a text PDF or DOCX.");
  }

  return json(req, { parsed, text });
}));
