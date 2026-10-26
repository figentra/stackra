/**
 * Stackra file contract:
 * Purpose: `ColorToken`, part of the token schema of the Stackra Design System (see `Theme`): one colour in both
 *          modes: a CSS colour for each, and its sRGB hex for platforms that take hex.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** One colour in both modes: a CSS colour for each, and its sRGB hex for platforms that take hex. */
export interface ColorToken {
  /** The CSS colour (oklch) in the light mode. */
  readonly light: string;
  /** The CSS colour (oklch) in the dark mode. */
  readonly dark: string;
  /** The sRGB hex equivalent of `light`, `#RRGGBB` or `#RRGGBBAA`. */
  readonly hexLight: string;
  /** The sRGB hex equivalent of `dark`, `#RRGGBB` or `#RRGGBBAA`. */
  readonly hexDark: string;
}
