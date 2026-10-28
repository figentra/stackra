/**
 * Stackra file contract:
 * Purpose: `AnalyticsIdentityRecord`, the visitor identity an `AnalyticsIdentity` driver keeps across launches: the
 *          anonymous id, the signed-in user's public id once identified, and the groups the visitor is in.
 * Boundary: a type only, in the leaf entry. Written only while the analytics consent category is granted and removed
 *           when it is refused or on `reset`. Holds ids only: no trait, name or contact field (ADR 0071).
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071 (no identifier before consent).
 */

/** The kept visitor identity. */
export interface AnalyticsIdentityRecord {
  /** The anonymous visitor id (`anon_` and 26 characters). */
  readonly anonymousId: string;

  /** The signed-in user's public id; absent until `identify`. */
  readonly userId?: string;

  /** Group type to group id (for example `scope` to the scope's public id); absent when in no group. */
  readonly groups?: Readonly<Record<string, string>>;
}
