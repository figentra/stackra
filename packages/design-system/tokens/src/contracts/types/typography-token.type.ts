/**
 * Stackra file contract:
 * Purpose: `TypographyToken`, part of the token schema of the Stackra Design System (see `Theme`): one text style.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { FontFamilyName } from "#contracts/types/font-family-name.type";

/** One text style. */
export interface TypographyToken {
  /** The CSS `font-weight`, 100 to 900. */
  readonly weight: number;
  /** The CSS `font-size`. */
  readonly size: string;
  /** The CSS `line-height`. */
  readonly lineHeight: string;
  /** The font stack it is set in. */
  readonly family: FontFamilyName;
  /** The CSS `letter-spacing`. */
  readonly letterSpacing: string;
}
