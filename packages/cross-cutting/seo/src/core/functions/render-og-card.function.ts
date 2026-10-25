/**
 * Stackra file contract:
 * Purpose: `renderOgCard`, the one pipeline from an Open Graph card to PNG bytes: check the size, load the fonts, lay
 *          the card's element tree out to SVG, then rasterise it at the card's width.
 * Boundary: internal. The layout and rasterising engines are passed in, because each runtime loads its WebAssembly
 *           differently (`./server` reads the files, `./worker` imports them as modules); the steps are the same.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7).
 */
import type { OgCard } from "#contracts/types/og-card.type";
import { loadOgFonts } from "#core/functions/load-og-fonts.function";
import { ogCardTree } from "#core/functions/og-card-tree.function";

/**
 * The PNG of `card`.
 *
 * @param layout - lays an element tree out to SVG (satori).
 * @param rasterize - turns SVG into PNG bytes at a width (resvg).
 * @throws RangeError when the size is not whole pixels from 200 to 4096.
 * @throws Error when a font cannot be fetched or an engine fails.
 */
export async function renderOgCard(
  card: OgCard,
  layout: (
    tree: ReturnType<typeof ogCardTree>,
    options: { width: number; height: number; fonts: Awaited<ReturnType<typeof loadOgFonts>> },
  ) => Promise<string>,
  rasterize: (svg: string, width: number) => Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> {
  for (const side of [card.width, card.height]) {
    if (!Number.isInteger(side) || side < 200 || side > 4096) {
      throw new RangeError("An Open Graph card is whole pixels from 200 to 4096 on each side");
    }
  }
  const fonts = await loadOgFonts();
  const svg = await layout(ogCardTree(card), { width: card.width, height: card.height, fonts });
  return new Uint8Array(rasterize(svg, card.width));
}
