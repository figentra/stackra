/**
 * Stackra file contract:
 * Purpose: `ShadowToken`, part of the token schema of the Stackra Design System (see `Theme`): a CSS `box-shadow` for
 *          each mode.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** A CSS `box-shadow` for each mode. */
export interface ShadowToken {
  /** The shadow in the light mode. */
  readonly light: string;
  /** The shadow in the dark mode. */
  readonly dark: string;
}
