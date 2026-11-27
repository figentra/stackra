/**
 * Stackra file contract:
 * Purpose: `sqlCodeOf(sql, keepBodies)`, the code of a SQL text with nothing in it that a keyword match could misread:
 *          every line and block comment (nested included) becomes a space, every single-quoted literal (`E''` escapes
 *          included) becomes `''`, every quoted identifier becomes `"0<hex>"` (its unquoted text, each code point as six
 *          hex digits, so `"default"` or `"not valid"` never reads as a keyword) and every dollar-quoted body
 *          becomes `$$` unless `keepBodies` keeps it verbatim, tags included. It walks the text with `skipSqlQuoted`,
 *          the scanner `splitSqlStatements` uses, so the two agree on where a literal or a comment ends.
 * Boundary: pure; reads the text only. A kept body is not masked; a caller that reads it runs `sqlCodeOf` on it again.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: gen enforces the class of each step); STA-2866.
 */
import { skipSqlQuoted } from "#core/functions/skip-sql-quoted.function";

/** The masked form of a quoted identifier: `"0` then six hex digits per code point of its unquoted text, then `"`. */
const maskIdentifier = (quoted: string): string => {
  const points = [...quoted.slice(1, -1).replaceAll('""', '"')].map((char) =>
    (char.codePointAt(0) ?? 0).toString(16).padStart(6, "0"),
  );
  return `"0${points.join("")}"`;
};

/**
 * The code of `sql`: comments gone, literals blanked, quoted identifiers masked, bodies blanked or kept.
 *
 * @param sql - the SQL text, one statement or several.
 * @param keepBodies - keep dollar-quoted bodies verbatim instead of blanking them to `$$`.
 * @example
 * sqlCodeOf("select 'a;b' -- why"); // "select '' "
 */
export function sqlCodeOf(sql: string, keepBodies = false): string {
  let code = "";
  let index = 0;
  while (index < sql.length) {
    const skipped = skipSqlQuoted(sql, index);
    if (skipped === undefined) {
      code += sql[index] ?? "";
      index += 1;
      continue;
    }
    const part = sql.slice(index, skipped);
    if (part.startsWith("'")) code += "''";
    else if (part.startsWith('"')) code += maskIdentifier(part);
    else if (part.startsWith("$")) code += keepBodies ? part : "$$";
    else code += " ";
    index = skipped;
  }
  return code;
}
