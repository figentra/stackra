/**
 * Stackra file contract:
 * Purpose: `MotionToken`, part of the token schema of the Stackra Design System (see `Theme`): one motion step.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** One motion step. */
export interface MotionToken {
  /** The CSS transition duration. */
  readonly duration: string;
  /** The CSS timing function. */
  readonly easing: string;
}
