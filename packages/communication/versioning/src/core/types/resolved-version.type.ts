/**
 * Stackra file contract:
 * Purpose: `ResolvedVersion`, what `resolveVersion` returns: the request's dated version and the response headers that
 *          version calls for.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 3 and 4).
 */

/** A request's dated version. */
export interface ResolvedVersion {
  /** The `YYYY-MM-DD` version the response is shaped for; pass it to `downgrade`. */
  readonly version: string;

  /** `Deprecation` and `Sunset` when a newer version exists; empty for the newest. */
  readonly headers: Readonly<Record<string, string>>;
}
