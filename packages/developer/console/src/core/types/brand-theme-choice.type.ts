/**
 * Stackra file contract:
 * Purpose: `BrandThemeChoice`, what a CLI owner picks when building a theme from brand tokens: the product name, its
 *          ASCII logo, its glyphs, and the palette token names of the gradient stops and the accent.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017.
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";

/** The parts of a theme that are not colours, plus which palette tokens give the colours. */
export interface BrandThemeChoice extends Omit<ConsoleTheme, "gradient" | "accent"> {
  /** Palette token names of the gradient stops, left to right. */
  readonly gradient: readonly string[];

  /** Palette token name of the accent. */
  readonly accent: string;
}
