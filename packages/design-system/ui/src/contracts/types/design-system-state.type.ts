/**
 * Stackra file contract:
 * Purpose: what `useDesignSystem()` returns on web and native: the current scheme (picked and resolved), locale,
 *          direction, theme, brand family and theme transition, and the setters a switcher calls.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native).
 */
import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { ResolvedColorScheme } from "#contracts/types/resolved-color-scheme.type";
import type { Direction } from "#contracts/enums/direction.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";

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
  /** The brand family drawn over the theme, or `undefined` for the theme alone. */
  readonly brand: string | undefined;
  /** The transition preset a display change plays (`none` plays none). */
  readonly transition: string;
  /**
   * The theme family the provider was given (`front` or `studio`), or `undefined` to follow the theme (ADR 0320 as
   * amended 2026-10-31). Native glass reads it to choose each role's material.
   */
  readonly family: string | undefined;
  /** The material mode the provider was given, or `undefined` to follow the theme's default mode. */
  readonly material: string | undefined;
  /** The motion level the user picked. */
  readonly motion: MotionLevel;
  /** The motion level in force: the picked one, lowered to `reduced` by the system's reduce-motion setting. */
  readonly resolvedMotion: MotionLevel;
  /** Picks a colour scheme. */
  readonly setColorScheme: (colorScheme: ColorScheme) => void;
  /** Picks a locale; the direction follows unless the provider was given one. */
  readonly setLocale: (locale: string) => void;
  /** Picks a brand family. */
  readonly setBrand: (brand: string) => void;
  /** Picks the motion level. */
  readonly setMotion: (motion: MotionLevel) => void;
  /** Picks the transition preset. */
  readonly setTransition: (transition: string) => void;
}
