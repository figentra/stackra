/**
 * Stackra file contract:
 * Purpose: what `useDesignSystem()` returns on web and native: the current scheme (picked and resolved), locale,
 *          direction and theme, and the setters a switcher calls.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native).
 */
import type { ColorScheme, ResolvedColorScheme } from "#contracts/enums/color-scheme.enum";
import type { Direction } from "#contracts/enums/direction.enum";

/** The design system state a provider shares with its subtree. */
export interface DesignSystemState {
  /** The scheme the user picked. */
  readonly colorScheme: ColorScheme;
  /** The scheme on screen: `system` resolved to light or dark. */
  readonly resolvedColorScheme: ResolvedColorScheme;
  /** The BCP 47 locale. */
  readonly locale: string;
  /** The text direction. */
  readonly direction: Direction;
  /** The theme name. */
  readonly theme: string;
  /** Picks a colour scheme. */
  readonly setColorScheme: (colorScheme: ColorScheme) => void;
  /** Picks a locale; the direction follows unless the provider was given one. */
  readonly setLocale: (locale: string) => void;
}
