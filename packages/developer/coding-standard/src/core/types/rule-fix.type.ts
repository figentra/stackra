/**
 * Stackra file contract:
 * Purpose: one text edit an autofix applies, as oxlint's fixer returns it.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */

/** Replace the text in `range` with `text`. */
export interface RuleFix {
  /** Start and end offsets of the replaced text. */
  readonly range: readonly [number, number];

  /** The text written over the range. */
  readonly text: string;
}
