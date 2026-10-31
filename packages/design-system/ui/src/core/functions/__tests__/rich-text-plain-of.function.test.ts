/**
 * Stackra file contract:
 * Purpose: proves `richTextPlainOf` reads a document's blocks and list items one per line and HTML with its tags
 *          dropped, and that `richTextDocumentOf` writes text back as paragraphs that read the same, Arabic included.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0466 (decisions 1 and 8); ADR 0022 (test placement); STA-1371.
 */
import { richTextDocumentOf } from "#core/functions/rich-text-document-of.function";
import { richTextPlainOf } from "#core/functions/rich-text-plain-of.function";

describe("richTextPlainOf and richTextDocumentOf", () => {
  it("reads a document one block per line", () => {
    const document = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }],
            },
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "two" }] }],
            },
          ],
        },
      ],
    };
    expect(richTextPlainOf(document)).toBe("Title\nHello world\none\ntwo");
  });

  it("reads HTML without its tags", () => {
    expect(richTextPlainOf("<h2>Title</h2><p>A &amp; <strong>B</strong><br>C</p>")).toBe(
      "Title\nA & B\nC",
    );
    expect(richTextPlainOf(undefined)).toBe("");
  });

  it("writes text back as paragraphs that read the same", () => {
    const text = "مرحبا بكم\n\nWelcome";
    const document = richTextDocumentOf(text);
    expect(document.content).toHaveLength(3);
    expect(richTextPlainOf(document)).toBe(text);
  });
});
