/**
 * Stackra file contract:
 * Purpose: `unownedTableGroup`, why a table without the owner column, and not listed as a platform table, is still
 *          waiting, read from the catalogue: an ancestor `scope_path` policy (the contract step adds the owner column),
 *          a `scope_id` policy on the owner's setting, no row-level security at all (a system table awaiting its ADR
 *          decision), or unclassified when none of these fits.
 * Boundary: pure; `assertRowSecurity` passes the table's row-level-security flag and its policies. It never guesses:
 *           a table that matches no group is `unclassified`.
 * Runtime: isomorphic
 * Governing contract: ADR 0347 (decision 5); tenancy audit 2026-11-07 (gap D, item 2).
 */
import type { PolicyRow } from "#testing/types/policy-row.type";

/**
 * The group of an unlisted table without the owner column.
 *
 * @param enabled - whether the table enables row-level security.
 * @param policies - the table's policies.
 * @param setting - the owner setting (`app.tenant_id`).
 * @example
 * unownedTableGroup(false, [], "app.tenant_id"); // "a system table with no row-level security, awaiting its ADR decision"
 */
export function unownedTableGroup(
  enabled: boolean,
  policies: readonly PolicyRow[],
  setting: string,
): string {
  const tests = (word: string) =>
    policies.filter((policy) => `${policy.using} ${policy.check}`.includes(word));
  if (tests("scope_path").length > 0)
    return "an ancestor scope_path table awaiting the contract step";
  if (
    tests("scope_id").some((policy) => `${policy.using} ${policy.check}`.includes(`'${setting}'`))
  )
    return `a scope_id table whose policy reads ${setting}`;
  if (!enabled && policies.length === 0)
    return "a system table with no row-level security, awaiting its ADR decision";
  return "unclassified";
}
