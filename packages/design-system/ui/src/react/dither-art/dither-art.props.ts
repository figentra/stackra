/**
 * Stackra file contract:
 * Purpose: `DitherArtProps`, the props of the web `DitherArt` in `dither-art.tsx`.
 * Boundary: types only. Colours are theme token names (`accent`, `background`, `core`), never colour values.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); brand rules §39 and §40; STA-2041.
 */
import type { DitherPattern } from "#contracts/enums/dither-pattern.enum";
import type { DitherSun } from "#contracts/types/dither-sun.type";

/** Props of the web DitherArt. */
export interface DitherArtProps {
  /** The brand pattern. Defaults to `strata`, the primary. */
  readonly pattern?: DitherPattern | undefined;
  /** The steel dots' colour, a theme token name read as `--color-<name>`. Defaults to `accent`. */
  readonly front?: string | undefined;
  /** The ground's colour, a theme token name. Defaults to `background`. */
  readonly back?: string | undefined;
  /** The engine glow's colour (the champagne core), a theme token name. Defaults to `core`. */
  readonly core?: string | undefined;
  /** One dither cell in CSS pixels: 2 to 8 for `dots`, 2 to 24 for `glyphs`. Defaults to 4. */
  readonly pixelSize?: number | undefined;
  /**
   * How a lit cell is drawn: `dots`, a square of its colour, or `glyphs`, a code character in the mono font at the cell
   * size. Defaults to `dots`.
   */
  readonly mode?: "dots" | "glyphs" | undefined;
  /** The characters `glyphs` draws from. Defaults to `{}[]()<>/=+*#;`. */
  readonly glyphs?: string | undefined;
  /** Where the core glow (the sun) sits, as fractions of the art's width and height. Defaults to the pattern's own. */
  readonly sun?: DitherSun | undefined;
  /** How fast the art drifts on real time; 0 is still. Defaults to 1, and is 0 whenever motion is reduced. */
  readonly speed?: number | undefined;
  /**
   * The kit's poster image for this pattern, one for both schemes or one per scheme (`{ light, dark }`; dark first):
   * what the edge render, a page without script and print show,
   * under the canvas until it draws.
   */
  readonly poster: string | { readonly light: string; readonly dark: string };
  /** A fade over the art: `radial` toward the edges, `bottom` or `top` toward that side. Defaults to `none`. */
  readonly mask?: "none" | "radial" | "bottom" | "top" | undefined;
  /** Styles the wrapper; give it a size, since the art fills it. */
  readonly className?: string | undefined;
}
