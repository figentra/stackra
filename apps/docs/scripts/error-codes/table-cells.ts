/**
 * Stackra file contract:
 * Purpose: `tableCells(line)`, the cells of one Markdown table row, splitting on `|` outside backticks, so a code
 *          span that holds a pipe stays in its cell.
 * Boundary: pure; one line at a time.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); STA-2853.
 */

/**
 * The cells of a Markdown table row, split on `|` outside backticks.
 *
 * @param line - one line of Markdown.
 * @returns the trimmed cells, or `undefined` when the line is no table row.
 * @example
 * tableCells("| `a | b` | c |"); // ["`a | b`", "c"]
 */
export function tableCells(line: string): string[] | undefined {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|") || trimmed.length < 2) return undefined;
  const cells: string[] = [];
  let cell = "";
  let code = false;
  for (const char of trimmed.slice(1, -1)) {
    if (char === "`") code = !code;
    if (char === "|" && !code) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}
