/**
 * Stackra file contract:
 * Purpose: unit tests of `docxText`: paragraphs on their own lines, run tabs and breaks kept, tab stops and deleted
 *          text left out, entities decoded, Arabic in logical order, and a refusal for bytes that are not a DOCX.
 * Boundary: test only; builds DOCX archives in memory with fflate.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0234; R3-SO-13.
 */
import { describe, expect, it } from "@stackra/testing";
import { strToU8, zipSync } from "fflate";

import { docxText } from "#node/functions/docx-text.function";

/** A DOCX whose body is `body` (the children of `w:body`). */
function docx(body: string): Uint8Array {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
  return zipSync({ "[Content_Types].xml": strToU8("<Types/>"), "word/document.xml": strToU8(xml) });
}

describe("docxText", () => {
  it("reads paragraphs, run tabs and breaks", () => {
    const bytes = docx(
      '<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr><w:r><w:t>Name</w:t><w:tab/><w:t xml:space="preserve">Acme </w:t></w:r><w:r><w:t>Ltd</w:t><w:br/><w:t>Riyadh</w:t></w:r></w:p>' +
        "<w:p><w:r><w:t>Second</w:t></w:r></w:p>",
    );
    expect(docxText(bytes)).toBe("Name\tAcme Ltd\nRiyadh\nSecond");
  });

  it("leaves out deleted text and decodes entities", () => {
    const bytes = docx(
      "<w:p><w:del><w:r><w:delText>old</w:delText></w:r></w:del><w:r><w:t>A &amp; B &lt;1&gt; &#x41;&#66;</w:t></w:r></w:p>",
    );
    expect(docxText(bytes)).toBe("A & B <1> AB");
  });

  it("keeps Arabic in logical order", () => {
    expect(docxText(docx("<w:p><w:r><w:rPr><w:rtl/></w:rPr><w:t>العقد</w:t></w:r></w:p>"))).toBe(
      "العقد",
    );
  });

  it("refuses bytes that are not a ZIP, and a ZIP without a body", () => {
    expect(() => docxText(new Uint8Array([1, 2, 3]))).toThrow(RangeError);
    expect(() => docxText(zipSync({ "a.txt": strToU8("a") }))).toThrow(/word\/document\.xml/);
  });
});
