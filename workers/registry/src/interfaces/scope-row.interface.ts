/**
 * Stackra file contract:
 * Purpose: `ScopeRow`: A `scopes` row: the read rule and the licence rule of one scope.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `scopes` row: the read rule and the licence rule of one scope. */
export interface ScopeRow {
  /** The scope name, such as `@stackra`. */
  readonly scope: string;
  /** Who may read the scope: anyone, licence holders, or no one outside the registry. */
  readonly read_rule: "open" | "licensed" | "internal";
  /** Whether the scope's packages are open source or commercial. */
  readonly licence_rule: "open-source" | "commercial";
  /** The `license` value a commercial package must name and an open-source package must not. */
  readonly commercial_licence: string;
}
