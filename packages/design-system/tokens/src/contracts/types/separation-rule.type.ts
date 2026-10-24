/**
 * Stackra file contract:
 * Purpose: a colour a policy wants kept apart from its neighbours, so a status is never read as a brand colour: the
 *          subject (an accent) must differ from each neighbour by enough hue or enough lightness (ADR 0340 decision 5,
 *          the old engine's rule: 25 degrees of hue or 0.1 of oklch lightness, hue wrapping round).
 * Boundary: types only; `checkSeparation` measures it, and a breach is a notice, never a refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 5).
 */

/** A subject colour and the neighbours it must stand apart from, by painted name. */
export interface SeparationRule {
  /** The colour kept apart, usually `accent`. */
  readonly subject: string;
  /** The neighbours, for example `danger`, `warning`, `success` and the banner colours. */
  readonly from: readonly string[];
  /** The hue difference that separates, in degrees; 25 when left out. */
  readonly minHue?: number;
  /** The oklch lightness difference that separates, 0 to 1; 0.1 when left out. */
  readonly minLightness?: number;
}
