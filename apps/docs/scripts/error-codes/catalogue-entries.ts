/**
 * Stackra file contract:
 * Purpose: `catalogueEntries(markdown)`, the rows of the error-code reference as `ErrorCodeEntry`s, the data
 *          `@stackra/gen`'s `ERROR_CODES` holds: each code row (`documentedCodes`) with its tool (the `## ` section,
 *          lower-cased), its group (the nearest heading above it) and that heading's site id (`headingAnchors`).
 * Boundary: pure; reads Markdown text only. A code under a section that is not Gen, Check or Runway throws, so a new
 *           section is added to `ErrorCodeEntry["tool"]` before it is listed.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); STA-2853 (the page); STA-2891 (one catalogue for the
 *                     terminal, the page and the MCP).
 */
import type { ErrorCodeEntry } from "@stackra/gen";

import { documentedCodes } from "#scripts/error-codes/documented-codes";
import { headingAnchors } from "#scripts/error-codes/heading-anchors";

/** The page's `## ` sections, by the tool each one lists. */
const TOOLS: Readonly<Record<string, ErrorCodeEntry["tool"]>> = {
  Gen: "gen",
  Check: "check",
  Runway: "runway",
};

/**
 * The reference rows of an error-code page.
 *
 * @param markdown - the page's text.
 * @returns one entry per code row, in page order.
 * @throws Error when a code sits under a section that names no tool, or under no heading.
 * @example
 * catalogueEntries("## Gen\n\n### Shapes\n\n| Code | Cause | Fix |\n| --- | --- | --- |\n| `a_b` | why | do |\n");
 * // [{ code: "a_b", tool: "gen", group: "Shapes", anchor: "shapes", cause: "why", fix: "do" }]
 */
export function catalogueEntries(markdown: string): ErrorCodeEntry[] {
  const headings = headingAnchors(markdown);
  return documentedCodes(markdown).map((row) => {
    const tool = TOOLS[row.section];
    if (tool === undefined)
      throw new Error(`line ${row.line}: ${row.code} sits under "${row.section}", no tool`);
    const group = headings.findLast((heading) => heading.line < row.line && heading.depth <= 3);
    if (group === undefined) throw new Error(`line ${row.line}: ${row.code} sits under no heading`);
    return {
      code: row.code,
      tool,
      group: group.text,
      anchor: group.id,
      cause: row.cause,
      fix: row.fix,
    };
  });
}
