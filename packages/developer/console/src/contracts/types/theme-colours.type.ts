/**
 * Stackra file contract:
 * Purpose: `ThemeColours`, the colours of a `ConsoleTheme` on one terminal ground: its gradient stops and accent.
 * Boundary: a type only; colours are `#rrggbb` strings.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016 and FR-017.
 */

/** A theme's colours on one ground. */
export interface ThemeColours {
  /** Two to five `#rrggbb` stops, left to right. */
  readonly gradient: readonly string[];

  /** The `#rrggbb` colour of prompts, titles and the selected choice. */
  readonly accent: string;
}
