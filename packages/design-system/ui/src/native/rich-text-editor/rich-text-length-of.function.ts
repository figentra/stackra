/**
 * Stackra file contract:
 * Purpose: `richTextLengthOf(node)`: the characters of a document as the web editor's CharacterCount counts them (text
 *          length in UTF-16 units, one per leaf such as a line break or image, nothing between blocks), for the native
 *          editor, whose bundled TipTap has no CharacterCount.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0466; STA-1371.
 */
import type { RichTextNode } from "#contracts/types/rich-text-node.type";

/** Nodes with no content that count as one character. */
const LEAVES = new Set(["hardBreak", "image", "horizontalRule"]);

/**
 * The character count of `node`.
 * @param node - a document node
 * @returns its characters
 */
export function richTextLengthOf(node: RichTextNode): number {
  if (node.type === "text") return node.text?.length ?? 0;
  if (LEAVES.has(node.type)) return 1;
  return (node.content ?? []).reduce((sum, child) => sum + richTextLengthOf(child), 0);
}
