/**
 * Stackra file contract:
 * Purpose: `BreakingRelease`, an `@stackra/*` release that carries at least one break mark: a released version from
 *          `RELEASE_NOTES_FLOOR` on, or the version the pending changesets will release.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); STA-2835.
 */

/** A release a consumer must act on. */
export type BreakingRelease = {
  /** The version, `x.y.z`. */
  readonly version: string;

  /** The changelog commits (`d5a7d0a`) or pending changeset files (`.changeset/x.md`) that carry a break mark. */
  readonly refs: readonly string[];

  /** True for the version the pending changesets will release; false for a released one. */
  readonly pending: boolean;
};
