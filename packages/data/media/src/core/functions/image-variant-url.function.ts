/**
 * Stackra file contract:
 * Purpose: `imageVariantUrl`, the URL of a resized image: the media URL with `w`, `h` and `format` query parameters
 *          (`https://cdn.test/tee.jpg?w=480&format=webp`), the form the media CDN's resizer reads.
 * Boundary: pure; works on absolute and relative URLs and keeps an existing query and fragment. It never fetches and
 *           never checks that the image exists.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants); ADR 0183 (LCP and transfer budget).
 */
import { checkImageVariant } from "#core/functions/check-image-variant.function";
import type { ImageVariantOptions } from "#core/types/image-variant-options.type";

/**
 * The variant URL of `url`.
 *
 * shortcut: one URL form, the resizer's `w`/`h`/`format` parameters; make it a port when a deployment's CDN needs another.
 *
 * @throws RangeError when the width or height is not a whole number from 1, or the format is not an `ImageFormat`.
 * @example
 * imageVariantUrl("https://cdn.test/tee.jpg", { width: 480, format: ImageFormat.Webp });
 * // "https://cdn.test/tee.jpg?w=480&format=webp"
 */
export function imageVariantUrl(url: string, variant: ImageVariantOptions): string {
  checkImageVariant("imageVariantUrl", variant);
  const hashAt = url.indexOf("#");
  const fragment = hashAt === -1 ? "" : url.slice(hashAt);
  const address = hashAt === -1 ? url : url.slice(0, hashAt);
  const parameters = new URLSearchParams({ w: String(variant.width) });
  if (variant.height !== undefined) parameters.set("h", String(variant.height));
  if (variant.format !== undefined) parameters.set("format", variant.format);
  return `${address}${address.includes("?") ? "&" : "?"}${parameters.toString()}${fragment}`;
}
