/**
 * Stackra file contract:
 * Purpose: `encodeIco`, packs PNG images into one `.ico` file (the PNG-in-ICO form every current browser reads), so
 *          `favicon.ico` needs no image library.
 * Boundary: pure; it never decodes the PNGs, it only frames them.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: favicons).
 */
import type { IcoImage } from "#core/types/ico-image.type";

const HEADER = 6;
const ENTRY = 16;

/**
 * The `.ico` bytes holding `images`, in the order given.
 *
 * @example
 * const ico = encodeIco([{ size: 16, png: png16 }, { size: 32, png: png32 }]);
 * @throws RangeError when a size is not a whole number from 1 to 256.
 */
export function encodeIco(images: readonly IcoImage[]): Uint8Array {
  const total = images.reduce(
    (sum, image) => sum + image.png.byteLength,
    HEADER + ENTRY * images.length,
  );
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true); // type 1: icon
  view.setUint16(4, images.length, true);
  let offset = HEADER + ENTRY * images.length;
  images.forEach((image, index) => {
    if (!Number.isInteger(image.size) || image.size < 1 || image.size > 256)
      throw new RangeError(`An icon size is a whole number from 1 to 256, got ${image.size}`);
    const at = HEADER + ENTRY * index;
    out[at] = image.size % 256; // 0 means 256
    out[at + 1] = image.size % 256;
    view.setUint16(at + 4, 1, true); // colour planes
    view.setUint16(at + 6, 32, true); // bits per pixel
    view.setUint32(at + 8, image.png.byteLength, true);
    view.setUint32(at + 12, offset, true);
    out.set(image.png, offset);
    offset += image.png.byteLength;
  });
  return out;
}
