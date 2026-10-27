/**
 * Stackra file contract:
 * Purpose: `ScopeRow`: A `scopes` row: the read rule and the licence rule of one scope.
 * Boundary: types only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `scopes` row: the read rule and the licence rule of one scope. */
export interface ScopeRow {
  readonly scope: string;
  readonly read_rule: "open" | "licensed" | "internal";
  readonly licence_rule: "open-source" | "commercial";
  readonly commercial_licence: string;
}
