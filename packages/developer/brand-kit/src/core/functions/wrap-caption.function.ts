/**
 * Stackra file contract:
 * Purpose: `wrapCaption`, breaks a store caption into lines of at most `maxChars` characters at spaces (a longer word
 *          keeps its own line).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19 captions).
 */

/**
 * The caption's lines.
 *
 * @example
 * wrapCaption("Every size and colour, one scan away", 20); // ["Every size and", "colour, one scan", "away"]
 */
// shortcut: counts characters, not measured glyph widths; measure with the kit font (opentype.js, a catalog entry)
// when a caption overflows its frame.
export function wrapCaption(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    if (line && line.length + 1 + word.length > maxChars) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}
