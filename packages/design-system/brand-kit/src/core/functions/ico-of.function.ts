/**
 * Stackra file contract:
 * Purpose: `icoOf(images)`, packs square PNGs into one ICO file (`favicon.ico`): the six-byte header, one sixteen-byte
 *          directory entry per image, then the PNG bytes as they are, which every browser since Windows Vista's icon
 *          format reads.
 * Boundary: pure bytes; the PNGs come from the rasteriser. Each image is at most 256 pixels (the ICO directory
 *           writes 256 as 0).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5: favicons).
 */

/**
 * The ICO holding `images`.
 *
 * @param images - each image's side in pixels and its PNG bytes.
 * @throws RangeError when an image is not 1 to 256 pixels.
 * @example
 * const ico = icoOf([{ size: 16, png: png16 }, { size: 32, png: png32 }]);
 */
export function icoOf(
  images: readonly { readonly size: number; readonly png: Uint8Array }[],
): Uint8Array {
  const header = 6 + 16 * images.length;
  const total = images.reduce((sum, image) => sum + image.png.byteLength, header);
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint16(2, 1, true); // type 1: icon
  view.setUint16(4, images.length, true);
  let offset = header;
  images.forEach((image, i) => {
    if (!Number.isInteger(image.size) || image.size < 1 || image.size > 256)
      throw new RangeError(`an ICO image is 1 to 256 pixels, not ${image.size}`);
    const entry = 6 + 16 * i;
    view.setUint8(entry, image.size % 256);
    view.setUint8(entry + 1, image.size % 256);
    view.setUint16(entry + 4, 1, true); // colour planes
    view.setUint16(entry + 6, 32, true); // bits per pixel
    view.setUint32(entry + 8, image.png.byteLength, true);
    view.setUint32(entry + 12, offset, true);
    bytes.set(image.png, offset);
    offset += image.png.byteLength;
  });
  return bytes;
}
