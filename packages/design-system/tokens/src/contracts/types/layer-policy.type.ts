/**
 * Stackra file contract:
 * Purpose: what a brand owner allows the layers below theirs to change (ADR 0340 decision 3): theme path patterns
 *          that may change and patterns that are locked (lock wins), plus contrast pairs and separation rules added to
 *          the checks. A layer's policy binds every layer under it, and a lower policy may only narrow it.
 * Boundary: types only; data a brand owner writes. Stackra encodes no brand rule: which paths a brand allows is its
 *           own policy's entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 2 and 3).
 */
import type { ContrastPair } from "#contracts/types/contrast-pair.type";
import type { SeparationRule } from "#contracts/types/separation-rule.type";

/** The rules a layer sets for the layers below it. */
export interface LayerPolicy {
  /**
   * Theme paths that may change, dot-separated (`colors.accent`, `radius.base`); a pattern matches its path and every
   * path under it, and a trailing `*` matches any rest of the last segment (`palette.accent-*`).
   */
  readonly allow: readonly string[];
  /** Theme paths that may not change, in the same form; a lock wins over an allow. */
  readonly lock?: readonly string[];
  /** Contrast pairs checked as well as the defaults. */
  readonly contrast?: readonly ContrastPair[];
  /** Colours kept apart; a breach is a notice that asks for icons and labels. */
  readonly separate?: readonly SeparationRule[];
}
