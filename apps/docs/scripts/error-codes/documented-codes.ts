/**
 * Stackra file contract:
 * Purpose: `documentedCodes(markdown)`, the codes an error-code page lists: every table row whose first cell is one
 *          code in backticks, grouped by the `## ` section it sits under, with its cause and fix cells. The
 *          error-code reference test compares them with what the tools emit (`emittedCodes`).
 * Boundary: pure; reads Markdown text only. Rows inside fenced code blocks and rows whose first cell is not a single
 *           token in backticks (a header, a bold phase name) are not codes. A `|` inside backticks stays in its cell.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); STA-2853.
 */
import type { DocumentedCode } from "#scripts/error-codes/documented-code";
import { tableCells } from "#scripts/error-codes/table-cells";

/**
 * Every code row of an error-code page.
 *
 * @param markdown - the page's text.
 * @returns the rows in page order.
 * @example
 * documentedCodes("## Gen\n\n| Code | Cause | Fix |\n| --- | --- | --- |\n| `x_y` | why | do |\n");
 * // [{ code: "x_y", section: "Gen", cause: "why", fix: "do", line: 5 }]
 */
export function documentedCodes(markdown: string): DocumentedCode[] {
  const rows: DocumentedCode[] = [];
  let section = "";
  let fenced = false;
  for (const [index, line] of markdown.split("\n").entries()) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const heading = /^## (.+)$/.exec(line);
    if (heading !== null) section = (heading[1] ?? "").trim();
    const cells = tableCells(line);
    const first = cells?.[0] === undefined ? undefined : /^`([^`\s]+)`$/.exec(cells[0]);
    if (cells === undefined || first === undefined || first === null) continue;
    rows.push({
      code: first[1] ?? "",
      section,
      cause: cells[1] ?? "",
      fix: cells[2] ?? "",
      line: index + 1,
    });
  }
  return rows;
}
