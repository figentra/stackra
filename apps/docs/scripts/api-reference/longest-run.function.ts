/**
 * Stackra file contract:
 * Purpose: `longestRun(text, char)`, the longest run of one character in a text: how long a code delimiter must be.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0514 (Fumadocs MDX pages); STA-2857.
 */

/** The longest run of `char` in `text`. */
export function longestRun(text: string, char: string): number {
  let longest = 0;
  let current = 0;
  for (const c of text) {
    current = c === char ? current + 1 : 0;
    if (current > longest) longest = current;
  }
  return longest;
}
