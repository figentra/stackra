/**
 * Stackra file contract:
 * Purpose: `SocialMarkPath`, one path of a built-in sign-in provider mark.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28).
 */

/** One path of a mark. */
export interface SocialMarkPath {
  /** The SVG path data, on a 24 by 24 grid. */
  readonly d: string;
  /** The brand colour; without it the path takes the text colour. */
  readonly fill?: string;
  /** True to outline the path in the text colour instead of filling it. */
  readonly stroke?: boolean;
}
