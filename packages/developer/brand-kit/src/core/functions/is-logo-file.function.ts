/**
 * Stackra file contract:
 * Purpose: `isLogoFile`, whether a kit-relative path is a logo or mark SVG (any SVG under a `logos/` or `marks/`
 *          folder, directions and versions included): the files that must carry no live `<text>`.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */

/**
 * True for a logo or mark SVG.
 *
 * @example
 * isLogoFile("logos/app-icon/app-icon-light.svg"); // true
 */
export function isLogoFile(path: string): boolean {
  return path.endsWith(".svg") && /(^|\/)(logos|marks)\//.test(path);
}
