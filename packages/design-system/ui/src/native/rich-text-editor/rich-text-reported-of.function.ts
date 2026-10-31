/**
 * Stackra file contract:
 * Purpose: `richTextReportedOf(json)`: the native editor's document JSON in the web editor's shape, every node but
 *          text carrying `dir: "auto"` as TipTap's `textDirection: "auto"` writes it, so a document round-trips between
 *          web and native unchanged.
 * Boundary: pure; a `dir` already set is kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0466 (decisions 2 and 8); STA-1371.
 */
import type { RichTextNode } from "#contracts/types/rich-text-node.type";

/**
 * The document with `dir: "auto"` on every non-text node.
 * @param node - a document node from the native editor
 * @returns the same document in the web editor's shape
 */
export function richTextReportedOf(node: RichTextNode): RichTextNode {
  if (node.type === "text") return node;
  return {
    ...node,
    attrs: { dir: "auto", ...node.attrs },
    ...(node.content === undefined ? {} : { content: node.content.map(richTextReportedOf) }),
  };
}
