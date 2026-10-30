/**
 * Stackra file contract:
 * Purpose: `ThemeBars`, what `useThemeBars()` returns: how the status bar and a navigation header draw over the
 *          active theme: the content tone, the theme's background and foreground, the glass tint, and whether the
 *          glass is solid (Reduce Transparency).
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (the status bar and the top bar follow the theme).
 */
import type { BarContent } from "@stackra/tokens/contracts";

/** The bars of the active theme. */
export interface ThemeBars {
  /** `light` content (white clock and title) on a dark background, `dark` on a light one: by its lightness. */
  readonly content: BarContent;
  /** The theme's background colour, as the theme gives it. */
  readonly background: string;
  /** The theme's foreground colour, for a bar's title and icons. */
  readonly foreground: string;
  /** The bar glass: the background at `BAR_SHARE` as `#RRGGBBAA`, or the background itself when solid. */
  readonly tint: string;
  /** Reduce Transparency is on: the bars are solid and draw no blur. */
  readonly isSolid: boolean;
}
