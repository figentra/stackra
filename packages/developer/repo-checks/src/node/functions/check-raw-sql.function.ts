/**
 * Stackra file contract:
 * Purpose: `checkRawSql(path, text, allowed)`, ADR 0160 decision 1: every raw SQL call carries a `// raw-sql:` comment
 *          with its reason, on the call's line, inside its statement, or in the `//` comment lines directly above the
 *          statement.
 * Boundary: pure, text only. A raw SQL call is `.execute(` whose first argument is a string or template literal (the
 *           query builder's `.execute("get" | "all" | "run")` is not), or `raw(` with such an argument in a file that
 *           imports `raw` from `@mikro-orm/*`, `@stackra/database` or the database package's own `#core`. A statement
 *           starts after the nearest line above ending in `;`, `{` or `}`. Comment lines are skipped. `allowed` is the
 *           file's `RAW_SQL_BASELINE` count: findings only once the file has more calls without a reason.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1); gap mo23 (stackra-288).
 */

/** A raw SQL call: `.execute("…` (not a query-builder mode) or `raw("…`. */
const CALL = /(\.execute|\braw)\(\s*(?!["'`](?:get|all|run)["'`])(?=["'`])/g;

/** An import of `raw` from the ORM or the database package. */
const IMPORTS_RAW =
  /import\s*\{[^}]*\braw\b[^}]*\}\s*from\s*["'](?:@mikro-orm\/[^"']+|@stackra\/database[^"']*|#core\/[^"']*)["']/;

/** The reason marker. */
const MARKER = "raw-sql:";

/** True when the line is a comment line. */
const isComment = (line: string): boolean => /^\s*(?:\/\/|\/\*|\*)/.test(line);

/** True when the call on line `at` has its reason. */
function hasReason(lines: readonly string[], at: number): boolean {
  let start = at;
  for (; start > 0; start -= 1) {
    const above = lines[start - 1] ?? "";
    if (above.trim() === "" || isComment(above) || /[;{}]\s*$/.test(above)) break;
  }
  if (lines.slice(start, at + 1).some((line) => line.includes(MARKER))) return true;
  for (let line = start - 1; line >= 0 && /^\s*\/\//.test(lines[line] ?? ""); line -= 1)
    if (lines[line]?.includes(MARKER)) return true;
  return false;
}

/**
 * The raw-SQL findings of one TS source file.
 *
 * @param path - repository-relative, used in the findings.
 * @param text - the file's contents.
 * @param allowed - how many calls without a reason the baseline still allows in this file.
 * @example
 * checkRawSql("packages/x/src/node/a.driver.ts", source); // one finding per raw SQL call without a reason
 */
export function checkRawSql(path: string, text: string, allowed = 0): string[] {
  const lines = text.split("\n");
  const importsRaw = IMPORTS_RAW.test(text);
  const missing: number[] = [];
  for (const match of text.matchAll(CALL)) {
    if (match[1] === "raw" && !importsRaw) continue;
    const at = text.slice(0, match.index).split("\n").length - 1;
    if (isComment(lines[at] ?? "")) continue;
    if (!hasReason(lines, at)) missing.push(at + 1);
  }
  if (missing.length <= allowed) return [];
  return missing.map(
    (line) =>
      `${path}:${line}: raw SQL without a reason; put a \`// raw-sql: <why>\` comment above the statement (ADR 0160)`,
  );
}
