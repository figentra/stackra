/**
 * Stackra file contract:
 * Purpose: `splitSqlStatements(sql)`, the top-level statements of one compiled migration string: it splits on each
 *          semicolon outside a single-quoted literal (`E''` escapes included), a quoted identifier, a dollar-quoted
 *          body, a line comment and a block comment (nested, as Postgres reads them), and drops a part that holds
 *          only whitespace and comments. `schema.sql()` stores its string as one operation and Postgres runs every
 *          statement in it, so gen classifies each part (ADR 0159 decision 3).
 * Boundary: pure; reads the text only. A `BEGIN ATOMIC` function body is split at its inner semicolons too, so its
 *           tail reads as a statement gen cannot read, which counts as destructive: never safer than it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: gen enforces the class of each step); STA-2866.
 */

/** A character an identifier or keyword may hold, so a `$` after it is no dollar quote and an `E` before `'` is a word. */
const WORD = /[A-Za-z0-9_$]/;

/** The index just past the literal, identifier or comment that opens at `index`, or `undefined` when none opens. */
function skipQuoted(sql: string, index: number): number | undefined {
  const char = sql[index];
  const next = sql[index + 1];
  if (char === "-" && next === "-") {
    const end = sql.indexOf("\n", index);
    return end === -1 ? sql.length : end + 1;
  }
  if (char === "/" && next === "*") {
    let depth = 1;
    let at = index + 2;
    while (at < sql.length && depth > 0) {
      if (sql.startsWith("/*", at)) {
        depth += 1;
        at += 2;
      } else if (sql.startsWith("*/", at)) {
        depth -= 1;
        at += 2;
      } else at += 1;
    }
    return at;
  }
  if (char === "'" || char === '"') {
    // An E'' literal takes backslash escapes; a plain one and an identifier double their quote.
    const escapes =
      char === "'" && /[Ee]/.test(sql[index - 1] ?? "") && !WORD.test(sql[index - 2] ?? "");
    let at = index + 1;
    while (at < sql.length) {
      if (escapes && sql[at] === "\\") at += 2;
      else if (sql[at] === char && sql[at + 1] === char) at += 2;
      else if (sql[at] === char) return at + 1;
      else at += 1;
    }
    return sql.length;
  }
  if (char === "$" && !WORD.test(sql[index - 1] ?? "")) {
    const tag = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(index))?.[0];
    if (tag === undefined) return undefined;
    const end = sql.indexOf(tag, index + tag.length);
    return end === -1 ? sql.length : end + tag.length;
  }
  return undefined;
}

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
    const skipped = skipQuoted(sql, index);
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
