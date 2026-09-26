// In-browser text extraction for resume files, so the free checker never
// uploads anything. Heavy libraries are loaded only when a file is picked.

export class ExtractError extends Error {}

const MAX_BYTES = 5 * 1024 * 1024;

type Kind = "pdf" | "docx" | "txt";

function detectKind(bytes: Uint8Array, name: string): Kind | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf"; // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return /\.docx$/i.test(name) || !/\.\w+$/.test(name) ? "docx" : null; // ZIP
  if (/\.(txt|md)$/i.test(name)) return "txt";
  return null;
}

/** Converts the body of a DOCX document to text, prefixing list paragraphs with "• ". */
export function docxXmlToText(xml: string): string {
  return xml
    .split(/<\/w:p>/)
    .map((para) => {
      const text = para
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&")
        .trim();
      return text && /<w:numPr>/.test(para) ? `• ${text}` : text;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function docxToText(bytes: Uint8Array): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new ExtractError("This Word file has no readable document body.");
  return docxXmlToText(xml);
}

async function pdfToText(bytes: Uint8Array): Promise<string> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const task = pdfjs.getDocument({ data: bytes });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, 10); n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    let page = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      page += item.str + (item.hasEOL ? "\n" : item.str && !item.str.endsWith(" ") ? " " : "");
    }
    pages.push(page.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trim());
  }
  await task.destroy();
  return pages.join("\n\n");
}

/** Extracts plain text from a PDF, DOCX or TXT resume entirely in the browser. */
export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new ExtractError("File must be under 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(bytes, file.name);
  if (!kind) throw new ExtractError("Please choose a PDF, DOCX or TXT file.");

  const text = kind === "pdf" ? await pdfToText(bytes) : kind === "docx" ? await docxToText(bytes) : new TextDecoder().decode(bytes);
  if (text.replace(/\s/g, "").length < 50) {
    throw new ExtractError(kind === "pdf"
      ? "No text found — this looks like a scanned PDF. Export it as a text PDF or DOCX, or paste the text."
      : "The file appears to be empty.");
  }
  return text;
}
