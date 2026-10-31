/**
 * Stackra file contract:
 * Purpose: `richTextDocumentOf(text)`: a rich-text document of plain text, one paragraph per line, the value the
 *          native RichTextEditor's stand-in reports.
 * Boundary: pure; an empty line is an empty paragraph, so the text reads back the same through `richTextPlainOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0466 (decisions 1 and 2); STA-1371.
 */
import type { RichTextNode } from "#contracts/types/rich-text-node.type";

/**
 * The document of `text`.
 * @param text - plain text, lines separated by `\n`
 * @returns a `doc` node with one paragraph per line
 */
export function richTextDocumentOf(text: string): RichTextNode {
  return {
    type: "doc",
    content: text
      .split("\n")
      .map((line) =>
        line === ""
          ? { type: "paragraph" }
          : { type: "paragraph", content: [{ type: "text", text: line }] },
      ),
  };
}
