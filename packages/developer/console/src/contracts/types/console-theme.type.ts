/**
 * Stackra file contract:
 * Purpose: `ConsoleTheme`, what changes from one product's CLI to another's: its name, ASCII logo, gradient stops,
 *          accent colour and glyph. Layout, spacing, symbols and copy never change.
 * Boundary: a type only; colours are `#rrggbb` strings.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016 and FR-017.
 */

/** One product's look. */
export interface ConsoleTheme {
  /** The product name, shown beside the version. */
  readonly name: string;

  /** The ASCII logo, one string per line, coloured column by column with `gradient`. */
  readonly logo: readonly string[];

  /** Two to five `#rrggbb` stops, left to right. */
  readonly gradient: readonly string[];

  /** The `#rrggbb` colour of prompts, titles and the selected choice. */
  readonly accent: string;

  /** One grapheme shown before the product name. */
  readonly glyph: string;

  /** The glyph where the terminal has no Unicode. */
  readonly asciiGlyph: string;
}
