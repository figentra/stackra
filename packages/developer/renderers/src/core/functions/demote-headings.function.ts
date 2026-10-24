/**
 * Stackra file contract:
 * Purpose: `demoteHeadings`, Markdown with every ATX heading pushed down by a number of levels (capped at six), so a
 *          document's own `# Title` nests under the sections of a combined file such as `AGENTS.md`. Lines inside
 *          fenced code blocks are left alone.
 * Boundary: internal; pure. Setext headings (underlined) are not changed; the neutral documents use ATX headings.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2: `AGENTS.md` for Codex, Gemini and others).
 */

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^(#{1,6})(?=[ \t]|$)/;

/**
 * The demoted text.
 *
 * @param markdown - the Markdown.
 * @param levels - how many levels to add.
 * @example
 * demoteHeadings("# Versions\n\n## Rules\n", 2); // "### Versions\n\n#### Rules\n"
 */
export function demoteHeadings(markdown: string, levels: number): string {
  let fence: string | undefined;
  return markdown
    .split("\n")
    .map((line) => {
      const marker = FENCE.exec(line)?.[1];
      if (marker !== undefined) {
        if (fence === undefined) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
        return line;
      }
      if (fence !== undefined) return line;
      return line.replace(HEADING, (hashes) => "#".repeat(Math.min(6, hashes.length + levels)));
    })
    .join("\n");
}
