/**
 * Stackra file contract:
 * Purpose: `EdgeRow`, one key and value of the edge Worker's KV copy that Runway writes: a platform host's `host:`
 *          row or an app-link `wellknown:` row.
 * Boundary: type only; the value is the stored text (JSON for `host:`, the file body for `wellknown:`). Public data
 *           only: no secret and nothing per user.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decisions 3 and 6: Runway writes platform `host:` rows and app-link `wellknown:` rows).
 */

/** One KV row. */
export interface EdgeRow {
  /** `host:<hostname>` or `wellknown:<hostname>:<file>`. */
  readonly key: string;

  /** The stored text. */
  readonly value: string;
}
