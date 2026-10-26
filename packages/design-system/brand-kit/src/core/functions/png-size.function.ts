/**
 * Stackra file contract:
 * Purpose: `pngSize(png)`, the width and height of a PNG from its header (the IHDR chunk), so a store frame fits a
 *          captured screen without decoding it.
 * Boundary: pure; reads the first 24 bytes only.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 7: store-screenshot frames).
 */

/** The eight signature bytes every PNG starts with. */
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * The pixel size of `png`.
 *
 * @throws TypeError when the bytes are not a PNG.
 * @example
 * pngSize(readFileSync("home.png")); // { width: 1290, height: 2796 }
 */
export function pngSize(png: Uint8Array): { readonly width: number; readonly height: number } {
  if (png.byteLength < 24 || SIGNATURE.some((byte, i) => png[i] !== byte))
    throw new TypeError("not a PNG file");
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
