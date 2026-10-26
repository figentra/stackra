/**
 * Stackra file contract:
 * Purpose: `outlineText(file, text, size, options)`, a line of text set in a font file and outlined: every glyph a
 *          path, Arabic shaped by opentype.js (joining forms, the lam-alef ligature) and kerned, baseline at y = 0.
 *          A logo or a store caption carries this, never live `<text>`.
 * Boundary: reads the font through `loadFont`; the path data is `pathData`'s, so the output is stable.
 * Runtime: node
 * Governing contract: ADR 0340 decision 10 (the outliner), ADR 0441 (decisions 5 and 7); ported from figentra/os
 *                     `tools/brand-kit/lib/outline.mjs` (ORIGIN.md).
 */
import type { TextOutline } from "#contracts/types/text-outline.type";
import { pathData } from "#core/functions/path-data.function";
import { loadFont } from "#node/functions/load-font.function";

/**
 * The outline of `text` in `file` at `size` units.
 *
 * @param file - a ttf, otf or woff font file.
 * @param text - one line.
 * @param size - the font size in the output's units.
 * @param options.letterSpacing - extra tracking in em.
 * @example
 * const { d, box } = outlineText("fonts/IBMPlexSansArabic-SemiBold.ttf", "تجارة", 96);
 */
export function outlineText(
  file: string,
  text: string,
  size: number,
  options: { readonly letterSpacing?: number } = {},
): TextOutline {
  const font = loadFont(file);
  const layout =
    options.letterSpacing === undefined ? {} : { letterSpacing: options.letterSpacing };
  const path = font.getPath(text, 0, 0, size, layout);
  const box = path.getBoundingBox();
  return {
    d: pathData(path.commands),
    box: { x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2 },
    advance: font.getAdvanceWidth(text, size, layout),
  };
}
