/**
 * Stackra file contract:
 * Purpose: `ThemeStatusBarProps`: props of `ThemeStatusBar`.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link ThemeStatusBar}. */
export interface ThemeStatusBarProps {
  /**
   * The colour under the status bar when it is not the theme's background (a screen whose top is a dark or light
   * hero): the content follows this colour's lightness instead.
   */
  readonly over?: string | undefined;
  /** Whether this bar speaks now (a screen's override only while it is focused); true by default. */
  readonly isActive?: boolean | undefined;
}
