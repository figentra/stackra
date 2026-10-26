/**
 * Stackra file contract:
 * Purpose: `scopeSettings`, the transaction settings `Database.withScope` writes: `app.scope_id` and `app.scope_path`
 *          hold the scope when exactly one is given, and `app.scope_paths` holds every granted path joined by `|`.
 * Boundary: internal and pure, so the driver only writes what it returns. A setting with nothing to hold is written as
 *           `''`, which every compiled policy reads as unset (no rows), so an outer scope never leaks into an inner one
 *           and no granted path means no rows. A path must be an `ltree` path, which also keeps `|` out of it.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 3 and 5: a scope is an id and an `ltree` path); `.agents/rules/tenancy.md`
 *                     (empty granted paths means false).
 */
import type { ScopeRef } from "@stackra/contracts";

import { LTREE_PATH } from "#core/constants/ltree-path.constant";

/**
 * The settings of `scopes`, as `[name, value]` pairs.
 *
 * @throws TypeError for a path that is not an `ltree` path.
 * @example
 * scopeSettings({ id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" });
 * // [["app.scope_id", "scp_01j9…"], ["app.scope_path", "platform.acme"], ["app.scope_paths", "platform.acme"]]
 */
export function scopeSettings(
  scopes: ScopeRef | readonly ScopeRef[],
): readonly (readonly [string, string])[] {
  const list: readonly ScopeRef[] = "path" in scopes ? [scopes] : scopes;
  for (const scope of list)
    if (!LTREE_PATH.test(scope.path))
      throw new TypeError(`"${scope.path}" is not an ltree scope path`);
  const only = list.length === 1 ? list[0] : undefined;
  return [
    ["app.scope_id", only?.id ?? ""],
    ["app.scope_path", only?.path ?? ""],
    ["app.scope_paths", list.map((scope) => scope.path).join("|")],
  ];
}
