/**
 * Stackra file contract:
 * Purpose: `policyGaps`, the policy half of the row-level-security catalogue audit of one owned table: exactly one
 *          permissive policy, `pol_<table>_<column>`, `FOR ALL` and testing the owner column against its setting; every
 *          other policy restrictive and named `pol_<table>_<column>` after a column of the table.
 * Boundary: pure; `assertRowSecurity` reads the catalogue and passes the rows. A `FOR ALL` policy without its own
 *           `WITH CHECK` checks writes with its `USING`, as Postgres does. Whether a restrictive column is one the
 *           model lists in `rowScopes` is not known here (the catalogue holds no model).
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decisions 1, 2 and 5); ADR 0231 (`pol_<table>_<column>`).
 */
import type { PolicyRow } from "#testing/types/policy-row.type";

/**
 * The policy gaps of one table holding the owner column.
 *
 * @param name - the schema-qualified table, for the messages.
 * @param table - the bare table name the policy names start with.
 * @param columns - the table's column names.
 * @example
 * policyGaps("notes.notes", "notes", "owner_id", "app.owner_id", policies, ["id", "owner_id"]); // []
 */
export function policyGaps(
  name: string,
  table: string,
  column: string,
  setting: string,
  policies: readonly PolicyRow[],
  columns: readonly string[],
): string[] {
  const expected = `pol_${table}_${column}`;
  const tests = (expression: string): boolean =>
    expression.includes(column) && expression.includes(`'${setting}'`);
  const gaps: string[] = [];
  const equality = policies.find((policy) => policy.name === expected);
  if (equality === undefined) gaps.push(`${name} has no policy ${expected}`);
  else if (
    !equality.permissive ||
    equality.command !== "*" ||
    !tests(equality.using) ||
    !tests(equality.check || equality.using)
  )
    gaps.push(
      `${name}: ${expected} is not the owner equality, a permissive FOR ALL policy testing ${column} against ${setting}`,
    );
  for (const policy of policies) {
    if (policy.name === expected) continue;
    if (policy.permissive)
      gaps.push(
        `${name}: ${policy.name} is a second permissive policy, which widens ${expected}; only a restrictive policy may narrow it`,
      );
    else if (!columns.some((known) => policy.name === `pol_${table}_${known}`))
      gaps.push(
        `${name}: restrictive policy ${policy.name} is not named pol_${table}_<column> after a column it tests`,
      );
  }
  return gaps;
}
