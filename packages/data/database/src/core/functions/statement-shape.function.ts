/**
 * Stackra file contract:
 * Purpose: `statementShape(sql)`, the normalised shape of one SQL statement for telemetry and the N+1 guard: every
 *          string and number literal and every bound placeholder becomes `?`, a list of `?` becomes one `(?)` (so an
 *          `in` list of any length, or a multi-row `values`, has one shape), whitespace is collapsed; with its verb and
 *          the first table it names.
 * Boundary: pure text work, no parser: it reads what the ORM sends, which is generated SQL. An identifier with a digit
 *           inside (`t0`, `e1`) is kept; a bare number is not. The shape never holds a value, so it is safe to log.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps scale-performance 7 and 8 (stackra-282, STA-1400).
 */

/** A table name after `from`, `into` or `update`, quoted or not, with an optional schema. */
const TABLE = /\b(?:from|into|update)\s+((?:"[^"]+"|[A-Za-z_]\w*)(?:\.(?:"[^"]+"|[A-Za-z_]\w*))?)/i;

/**
 * The shape of `sql`.
 *
 * @example
 * statementShape("select * from \"orders\" where id in ($1, $2) and total > 10");
 * // { statement: 'select * from "orders" where id in (?) and total > ?', verb: "select", table: "orders" }
 */
export function statementShape(sql: string): {
  statement: string;
  verb: string;
  table?: string;
} {
  const statement = sql
    .replaceAll(/'(?:[^']|'')*'/g, "?")
    .replaceAll(/\$\d+/g, "?")
    .replaceAll(/\b\d+(?:\.\d+)?\b/g, "?")
    .replaceAll(/\(\s*\?(?:\s*,\s*\?)*\s*\)/g, "(?)")
    .replaceAll(/\(\?\)(?:\s*,\s*\(\?\))+/g, "(?)")
    .replaceAll(/\s+/g, " ")
    .trim();
  const verb = (/^\(?\s*([A-Za-z]+)/.exec(statement)?.[1] ?? "").toLowerCase();
  const table = TABLE.exec(statement)?.[1]?.replaceAll('"', "");
  return table === undefined ? { statement, verb } : { statement, verb, table };
}
