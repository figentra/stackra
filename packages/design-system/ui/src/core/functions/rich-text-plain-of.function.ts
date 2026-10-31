/**
 * Stackra file contract:
 * Purpose: `richTextPlainOf(value)`: the plain text of a rich-text value, one block per line, for the native
 *          RichTextEditor's stand-in and for counting.
 * Boundary: pure; a string value is HTML, read with its tags dropped and block ends kept as line breaks.
 * Runtime: isomorphic
 * Governing contract: ADR 0466 (decision 1, native); STA-1371.
 */
import type { RichTextNode } from "#contracts/types/rich-text-node.type";

/** Text of one node: a text node's text, inline children run together, block children one per line. */
const textOf = (node: RichTextNode): string => {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const children = node.content ?? [];
  const isBlockParent = children.some(
    (child) => child.type !== "text" && child.type !== "hardBreak",
  );
  return children.map(textOf).join(isBlockParent ? "\n" : "");
};

/** Decodes the few HTML entities the editor writes. */
const decode = (html: string) =>
  html
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&");

/**
 * The plain text of `value`.
 * @param value - a document node or an HTML string
 * @returns the text, blocks separated by a line break
 */
export function richTextPlainOf(value: RichTextNode | string | undefined): string {
  if (value === undefined) return "";
  if (typeof value !== "string") return textOf(value);
  // shortcut: a tag-stripping read of HTML for display text only (never rendered as HTML); a real parser comes with
  // the native TipTap editor.
  const lines = value
    .replaceAll(/<br\s*\/?>/gi, "\n")
    .replaceAll(/<\/(p|h[1-6]|li|blockquote|pre)>/gi, "\n")
    .replaceAll(/<[^>]*>/g, "");
  return decode(lines).replace(/\n+$/, "");
}
