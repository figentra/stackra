/**
 * Stackra file contract:
 * Purpose: `grantsOf`: `licence_grants` rows (one per scope and name, `*` for every name) folded into grants, one per
 *          scope, sorted, so the licence API and the read check answer the same shape.
 * Boundary: pure.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 13); migrations/0002_licences.sql.
 */
import type { LicenceGrantView } from "#src/interfaces/licence-grant-view.interface";

/**
 * The grants of `licence_grants` rows.
 *
 * @example
 * grantsOf([{ scope: "@stackra-pro", name: "*" }]); // [{ scope: "@stackra-pro", names: "*" }]
 */
export function grantsOf(
  rows: readonly { readonly scope: string; readonly name: string }[],
): LicenceGrantView[] {
  const byScope = new Map<string, Set<string>>();
  for (const row of rows) {
    const names = byScope.get(row.scope) ?? new Set<string>();
    names.add(row.name);
    byScope.set(row.scope, names);
  }
  return (
    [...byScope.entries()]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([a], [b]) => a.localeCompare(b))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .map(([scope, names]) => ({ scope, names: names.has("*") ? "*" : [...names].sort() }))
  );
}
