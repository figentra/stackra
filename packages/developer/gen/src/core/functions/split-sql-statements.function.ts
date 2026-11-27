/**
 * Stackra file contract:
 * Purpose: `splitSqlStatements(sql)`, the top-level statements of one compiled migration string: it splits on each
 *          semicolon outside a single-quoted literal (`E''` escapes included), a quoted identifier, a dollar-quoted
 *          body, a line comment and a block comment (nested, as Postgres reads them; `skipSqlQuoted`), and drops a part that holds
 *          only whitespace and comments. `schema.sql()` stores its string as one operation and Postgres runs every
 *          statement in it, so gen classifies each part (ADR 0159 decision 3).
 * Boundary: pure; reads the text only. A `BEGIN ATOMIC` function body is split at its inner semicolons too, so its
 *           tail reads as a statement gen cannot read, which counts as destructive: never safer than it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: gen enforces the class of each step); STA-2866.
 */
import { skipSqlQuoted } from "#core/functions/skip-sql-quoted.function";

/**
 * The top-level statements of `sql`, each without its semicolon, comments kept.
 *
 * @example
 * splitSqlStatements("comment on table orders is null; drop table orders");
 * // ["comment on table orders is null", " drop table orders"]
 */
export function splitSqlStatements(sql: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let code = false;
  let index = 0;
  while (index < sql.length) {
    const char = sql[index] ?? "";
    const skipped = skipSqlQuoted(sql, index);
    if (skipped !== undefined) {
      // A comment is not code; a literal, an identifier or a dollar-quoted body is.
      if (char === "'" || char === '"' || char === "$") code = true;
      index = skipped;
      continue;
    }
    if (char === ";") {
      if (code) parts.push(sql.slice(start, index));
      start = index + 1;
      code = false;
    } else if (!/\s/.test(char)) code = true;
    index += 1;
  }
  if (code) parts.push(sql.slice(start));
  return parts;
}
