/**
 * Stackra file contract:
 * Purpose: `ClockFace`, what a TimeClock's face draws: its numerals, each at an angle on the outer or inner ring and
 *          marked when it is the chosen one, and where the hand points.
 * Boundary: types only; `clockFaceOf` builds it, the web and native faces draw it.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/** A face to draw. */
export interface ClockFace {
  /** The numerals, written in the customer's digits. */
  readonly numerals: readonly {
    readonly text: string;
    readonly angle: number;
    readonly isInner: boolean;
    readonly isSelected: boolean;
  }[];
  /** The hand: its angle clockwise from the top and whether it reaches the inner ring. */
  readonly hand: { readonly angle: number; readonly isInner: boolean };
}
