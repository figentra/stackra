/**
 * Stackra file contract:
 * Purpose: `Deprecation`, what `@Deprecated` records and the manifest's `deprecations` section carries: the release
 *          (or date version) that deprecated something, the release (or date) that removes it, and what to use instead.
 * Boundary: a type only. `deprecationProblem` says whether a value is a well-formed one inside its window.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4: `@Deprecated({ since, replacement, sunset })`); ADR 0136 (decision 4: a
 *                     public API's sunset is at least 6 months out); ADR 0177 (decision 6: one minor before 1.0, one
 *                     major after); STA-2836.
 */

/** A deprecation: since when, until when, and the replacement. */
export interface Deprecation {
  /**
   * The release that deprecated it, a version (`"0.34.0"`), or for a wire API the date version it was deprecated on
   * (`"2026-11-26"`, ADR 0118).
   */
  readonly since: string;

  /**
   * The release that removes it (`"0.35.0"`), or for a wire API the date it stops answering (`"2027-05-26"`); the same
   * form as `since`, and no earlier than `earliestSunset(since)`.
   */
  readonly sunset: string;

  /** What to use instead, as a reader writes it (`"orders.order.cancel@2"`, `"OrderPlaced.total"`); absent when nothing replaces it. */
  readonly replacement?: string;
}
