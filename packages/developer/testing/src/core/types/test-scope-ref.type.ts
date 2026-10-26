/**
 * Stackra file contract:
 * Purpose: `TestScopeRef`, the scope reference the tenant factories hand out: a `scp_` id and an `ltree` path.
 * Boundary: a type only, written structurally so this entry imports no workspace package (ADR 0269 decision 2); it is
 *           assignable to the contracts `ScopeRef` (`{ id: PublicId<"scp">; path: string }`).
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 2); ADR 0327 (decision 3: a scope is an id and a path).
 */

/** A test scope reference. */
export interface TestScopeRef {
  /** The scope node's id, which is also the tenant id (a tenant is its scope node). */
  readonly id: `scp_${string}`;

  /** The node's path, root first, labels separated by dots. */
  readonly path: string;
}
