/**
 * Stackra file contract:
 * Purpose: `MobileBuildRecord`, what a `MobileBuilder` answers for one build: the app key and the builder's reference
 *          to the builds it started.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decision 2).
 */

/** One build's record. */
export interface MobileBuildRecord {
  /** The app key. */
  readonly app: string;

  /** The builder's reference (EAS build ids, comma-separated). */
  readonly reference: string;
}
