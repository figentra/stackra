/**
 * Stackra file contract:
 * Purpose: `ThemeRadius`, part of the token schema of the Stackra Design System (see `Theme`): the corner radii.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
/** The corner radii. */
export interface ThemeRadius {
  /** The base radius, HeroUI's `--radius`. */
  readonly base: string;
  /** The form field radius, HeroUI's `--field-radius`. */
  readonly field: string;
  /** Further named radii, rendered as `--radius-<name>`. */
  readonly steps: Readonly<Record<string, string>>;
}
