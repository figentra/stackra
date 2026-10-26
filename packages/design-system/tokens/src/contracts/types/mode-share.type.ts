/**
 * Stackra file contract:
 * Purpose: `ModeShare`, part of the token schema of the Stackra Design System (see `Theme`): a share from 0 to 1 for
 *          each mode.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** A share from 0 to 1 for each mode. */
export interface ModeShare {
  /** The share in the light mode. */
  readonly light: number;
  /** The share in the dark mode. */
  readonly dark: number;
}
