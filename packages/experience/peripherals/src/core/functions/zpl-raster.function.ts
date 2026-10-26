/**
 * Stackra file contract:
 * Purpose: `zplRaster`, a ZPL II label that prints a 1-bit raster image dot for dot (`^GFA`, hexadecimal rows), the
 *          way a label in Arabic or any other script reaches a ZPL printer (ADR 0339 decision 2), with `^PQ` copies.
 * Boundary: internal; pure. The image's data length must equal `ceil(width / 8) × height`; otherwise a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decisions 1 and 2).
 */
import type { RasterImage } from "#contracts/types/raster-image.type";

/** True when `value` is a positive whole number. */
const isWhole = (value: number) => Number.isInteger(value) && value > 0;

/**
 * The ZPL document of `image`, printed `copies` times.
 *
 * @example
 * zplRaster({ width: 8, height: 1, data: Uint8Array.of(0xff) }, 1); // "^XA^FO0,0^GFA,1,1,1,FF^FS^PQ1^XZ"
 * @throws RangeError when the data length does not match the size, or `copies` is not a positive integer.
 */
export function zplRaster(image: RasterImage, copies: number): string {
  const rowBytes = Math.ceil(image.width / 8);
  const total = rowBytes * image.height;
  if (!isWhole(image.width) || !isWhole(image.height))
    throw new RangeError("zplRaster: the image needs a positive whole width and height");
  if (image.data.length !== total)
    throw new RangeError(
      `zplRaster: ${image.width}x${image.height} needs ${total} bytes, got ${image.data.length}`,
    );
  if (!Number.isInteger(copies) || copies < 1)
    throw new RangeError(`zplRaster: copies must be a positive integer, got ${copies}`);
  let hex = "";
  for (const byte of image.data) hex += byte.toString(16).padStart(2, "0").toUpperCase();
  return `^XA^FO0,0^GFA,${total},${total},${rowBytes},${hex}^FS^PQ${copies}^XZ`;
}
