/**
 * Stackra file contract:
 * Purpose: `StudioKnobs`: the studio's knobs: the theme knobs `deriveTheme` reads, plus the display faces, which the
 *          studio draws on the canvas (`--font-display`, `--font-display-arabic`) until the theme carries them.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";

/** The theme knobs and the display faces, by CSS family name. */
export type StudioKnobs = ThemeKnobs & {
  /** The Latin display face's family, for example `Bodoni Moda`. */
  readonly display?: string | undefined;
  /** The Arabic display face's family, for example `El Messiri`. */
  readonly displayArabic?: string | undefined;
};
