/**
 * Stackra file contract:
 * Purpose: `FontFamilies`, part of the token schema of the Stackra Design System (see `Theme`): the three font
 *          stacks, each a CSS `font-family` list.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** The three font stacks, each a CSS `font-family` list. */
export interface FontFamilies {
  /** The stack for Latin text. */
  readonly sans: string;
  /** The stack for code, labels and figures. */
  readonly mono: string;
  /** The stack for Arabic (RTL) text. */
  readonly arabic: string;
}
