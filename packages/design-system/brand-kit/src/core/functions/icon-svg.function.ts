/**
 * Stackra file contract:
 * Purpose: `iconSvg(symbol, options)`, one square canvas of the symbol: an optional tile in a colour with optional
 *          rounded corners, and the symbol centred on it at a share of the side, painted in one colour through
 *          `currentColor`. Every app icon, adaptive layer, splash image and favicon is one of these.
 * Boundary: pure; colours arrive as values the caller took from the theme. The canvas is 1024 units; the rasteriser
 *           scales it to the pixel size.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5).
 */

/** The canvas side in user units. */
const SIDE = 1024;

/**
 * The SVG of one icon canvas.
 *
 * @param symbol - from `symbolOf`.
 * @param options.color - the symbol's colour.
 * @param options.background - the tile's colour; a transparent canvas when absent.
 * @param options.scale - the symbol's share of the side, 0 to 1.
 * @param options.radius - the tile's corner radius as a share of the side; square corners when absent.
 * @example
 * iconSvg(symbolOf(svg, "marks/symbol.svg"), { color: "#FFFFFF", background: "#1F4FD1", scale: 0.58 });
 */
export function iconSvg(
  symbol: { readonly viewBox: readonly [number, number, number, number]; readonly body: string },
  options: {
    readonly color: string;
    readonly background?: string;
    readonly scale: number;
    readonly radius?: number;
  },
): string {
  const box = SIDE * options.scale;
  const at = (SIDE - box) / 2;
  const tile =
    options.background === undefined
      ? ""
      : `<rect width="${SIDE}" height="${SIDE}" rx="${SIDE * (options.radius ?? 0)}" fill="${options.background}"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIDE} ${SIDE}" width="${SIDE}" height="${SIDE}">` +
    tile +
    `<svg x="${at}" y="${at}" width="${box}" height="${box}" viewBox="${symbol.viewBox.join(" ")}" color="${options.color}" fill="currentColor">` +
    `${symbol.body}</svg></svg>\n`
  );
}
