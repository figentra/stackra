/**
 * Stackra file contract:
 * Purpose: `SvgRenderer`, the port that rasterises one SVG to PNG at a pixel width (resvg by default; tests pass a
 *          fake).
 * Boundary: a type in the leaf entry. A renderer must be deterministic: the same SVG and width give the same bytes.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: deterministic output).
 */

/**
 * Rasterises `svg` to a PNG `width` pixels wide, keeping its aspect ratio.
 *
 * @example
 * const png = await render('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>', 192);
 */
export type SvgRenderer = (svg: string, width: number) => Promise<Uint8Array>;
