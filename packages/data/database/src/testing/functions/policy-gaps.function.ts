/**
 * Stackra file contract:
 * Purpose: `policyGaps`, the policy half of the row-level-security catalogue audit of one owned table: exactly one
 *          permissive policy, `pol_<table>_<column>`, `FOR ALL` and testing the owner column against its setting; every
 *          other policy restrictive and named `pol_<table>_<column>` after a column of the table. A platform-form owner
 *          policy (its `USING` also shows the owner column's null rows, ADR 0239 amendment gap C) needs its restrictive
 *          `pol_<table>_<column>_write_update` (`FOR UPDATE`) and `_write_delete` (`FOR DELETE`), which are accepted
 *          by those names; `_write_update` tests what `_write_delete` does, and, only when the table declares
 *          `t.systemAccess` update columns (`systemUpdate`), also lets `SYSTEM_ACCESS_ROLE` through
 *          (`... OR CURRENT_USER = 'stackra_system_access'`), so a claim with no tenant reaches tenant rows.
 * Boundary: pure; `assertRowSecurity` reads the catalogue and passes the rows. A `FOR ALL` policy without its own
 *           `WITH CHECK` checks writes with its `USING`, as Postgres does. Whether a restrictive column is one the
 *           model lists in `rowScopes` is not known here (the catalogue holds no model).
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decisions 1, 2 and 5); ADR 0231 (`pol_<table>_<column>`).
 */
import { SYSTEM_ACCESS_ROLE } from "#core/constants/system-access-role.constant";
import type { PolicyRow } from "#testing/types/policy-row.type";

/** `own` letting the system-access role through, as Postgres prints `(<own>) or current_user = '<role>'`. */
const lift = (own: string): string => `(${own} OR (CURRENT_USER = '${SYSTEM_ACCESS_ROLE}'::name))`;

/**
 * The policy gaps of one table holding the owner column.
 *
 * @param name - the schema-qualified table, for the messages.
 * @param table - the bare table name the policy names start with.
 * @param columns - the table's column names.
 * @param systemUpdate - whether the table has its `pol_<table>_system_access_update` policy (`t.systemAccess` update).
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
  systemUpdate = false,
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
  // The platform form: the owner policy also shows the null rows, so its two write policies must keep UPDATE and
  // DELETE on the session's own rows.
  const writes = new Map([
    [`${expected}_write_update`, "w"],
    [`${expected}_write_delete`, "d"],
  ]);
  const platform =
    equality !== undefined && new RegExp(`\\b${column}\\b\\)? IS NULL`).test(equality.using);
  if (platform) {
    for (const [write, command] of writes) {
      const found = policies.find((policy) => policy.name === write);
      if (
        found === undefined ||
        found.permissive ||
        found.command !== command ||
        !tests(found.using)
      )
        gaps.push(
          `${name}: ${expected} is the platform form, so it needs ${write}, a restrictive FOR ${command === "w" ? "UPDATE" : "DELETE"} policy testing ${column} against ${setting}`,
        );
    }
    const update = policies.find((policy) => policy.name === `${expected}_write_update`);
    const remove = policies.find((policy) => policy.name === `${expected}_write_delete`);
    if (update !== undefined && remove !== undefined) {
      const lifted = update.using === lift(remove.using);
      if (systemUpdate && !lifted)
        gaps.push(
          `${name}: ${expected}_write_update must also pass ${SYSTEM_ACCESS_ROLE} (… or current_user = '${SYSTEM_ACCESS_ROLE}'), as the table declares t.systemAccess update columns; without it a claim reaches only the NULL rows. Declare both in one blueprint`,
        );
      else if (!systemUpdate && update.using !== remove.using)
        gaps.push(
          `${name}: ${expected}_write_update does not test what ${expected}_write_delete does${lifted ? `; it passes ${SYSTEM_ACCESS_ROLE}, though the table declares no t.systemAccess update column` : ""}`,
        );
    }
  }
  for (const policy of policies) {
    if (policy.name === expected || (platform && writes.has(policy.name) && !policy.permissive))
      continue;
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
