/**
 * Stackra file contract:
 * Purpose: `BrandColor`, one resolved brand colour and the text colour that reads on it.
 * Boundary: a type in the leaf entry, part of `BrandProfile`. Both values are `#RRGGBB`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md; rule R8); STA-2644.
 */

/**
 * A colour a surface fills with, and the text colour to put on it.
 *
 * @example
 * const { color, onColor } = profile.primary ?? { color: "#000000", onColor: "#FFFFFF" };
 */
export interface BrandColor {
  /** The brand colour, `#RRGGBB`. */
  readonly color: string;

  /** White or near-black (`#111111`), whichever contrasts more with `color`. */
  readonly onColor: string;
}
