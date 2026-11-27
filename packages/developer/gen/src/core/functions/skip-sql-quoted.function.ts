/**
 * Stackra file contract:
 * Purpose: `skipSqlQuoted(sql, index)`, the index just past the single-quoted literal (`E''` escapes included), quoted
 *          identifier, dollar-quoted body, line comment or block comment (nested, as Postgres reads them) that opens at
 *          `index`, or `undefined` when none opens there. The one scanner `splitSqlStatements` and `sqlCodeOf` share,
 *          so a split and a classification never disagree on where a literal or a comment ends.
 * Boundary: pure; reads the text only. An unterminated literal, identifier, body or comment runs to the end.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: gen enforces the class of each step); STA-2866.
 */

/** A character an identifier or keyword may hold, so a `$` after it is no dollar quote and an `E` before `'` is a word. */
const WORD = /[A-Za-z0-9_$]/;

/**
 * The index just past the literal, identifier, body or comment that opens at `index`.
 *
 * @param sql - the SQL text.
 * @param index - where a literal, identifier, body or comment may open.
 * @example
 * skipSqlQuoted("a -- b\nc", 2); // 7
 */
export function skipSqlQuoted(sql: string, index: number): number | undefined {
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
