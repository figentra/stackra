/**
 * Stackra file contract:
 * Purpose: `renderBanner(theme, version, mode)`, the Laravel-installer banner: the theme's ASCII logo coloured column
 *          by column across its gradient (the same column the same colour on every line), then the glyph, name and
 *          version.
 * Boundary: pure; at depth 0 the logo is plain text.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016.
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import { colourEscape } from "#core/functions/colour-escape.function";
import { createPainter } from "#core/functions/create-painter.function";
import { gradientColours } from "#core/functions/gradient-colours.function";
import type { ConsoleMode } from "#core/types/console-mode.type";

/** The banner lines. */
export function renderBanner(theme: ConsoleTheme, version: string, mode: ConsoleMode): string[] {
  const painter = createPainter(mode.depth, theme.accent);
  const width = Math.max(0, ...theme.logo.map((line) => [...line].length));
  const colours = gradientColours(theme.gradient, width).map((hex) =>
    colourEscape(hex, mode.depth),
  );
  const logo = theme.logo.map((line) =>
    mode.depth === 0
      ? `  ${line}`.trimEnd()
      : `  ${[...line].map((character, index) => (character === " " ? " " : `${colours[index] ?? ""}${character}`)).join("")}\u001B[39m`,
  );
  const glyph = mode.unicode ? theme.glyph : theme.asciiGlyph;
  return [
    "",
    ...logo,
    "",
    `  ${painter.accent(glyph)} ${painter.bold(theme.name)} ${painter.dim(version)}`,
    "",
  ];
}
