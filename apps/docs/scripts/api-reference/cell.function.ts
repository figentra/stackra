/**
 * Stackra file contract:
 * Purpose: `cell(text)`, markdown as one GFM table cell: one line, every `|` escaped.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0514 (Fumadocs MDX pages); STA-2857.
 */

/**
 * Text as one GFM table cell: one line, `|` escaped (also inside code spans, as GFM requires).
 *
 * @param text - the cell's markdown, already passed through `prose` or `inlineCode`.
 * @returns the text on one line with every `|` written `\|`.
 * @example
 * cell("`a | b`\nnext"); // "`a \\| b` next"
 */
export function cell(text: string): string {
  return text
    .replaceAll(/\s*\n\s*/g, " ")
    .replaceAll("|", "\\|")
    .trim();
}
