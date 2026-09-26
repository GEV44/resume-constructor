import { describe, it, expect } from "vitest";
import { docxXmlToText } from "@/lib/extract-text";

describe("docxXmlToText", () => {
  it("keeps paragraphs, marks list items as bullets and decodes entities", () => {
    const xml = `<w:body>
      <w:p><w:r><w:t>Alex Morgan</w:t></w:r></w:p>
      <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Cut bugs by 35% &amp; shipped</w:t></w:r></w:p>
      <w:p><w:r><w:t>Skills</w:t><w:tab/><w:t>React</w:t></w:r></w:p>
    </w:body>`;
    expect(docxXmlToText(xml)).toBe("Alex Morgan\n• Cut bugs by 35% & shipped\nSkills\tReact");
  });
});
