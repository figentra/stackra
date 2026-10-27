/**
 * Stackra file contract:
 * Purpose: the `sharp` driver of `ImageTransformer`: resizes, composites layers over and re-encodes an image on the
 *          server with sharp (libvips, Apache-2.0), for thumbnails, watermarks and personalised product images.
 * Boundary: in process, so the bytes stay in the region the service runs in. Applies the EXIF orientation, then fits
 *           the image inside `width` x `height` without enlarging it, composites `layers` in order over the result,
 *           and encodes `format` at `quality`. sharp drops every metadata block (EXIF, GPS, ICC beyond sRGB) unless
 *           asked to keep it, and this driver never asks. Any engine refusal (an unreadable image, a layer larger
 *           than the output, `left` without `top`) is a `RangeError` naming sharp's reason, never the bytes.
 * Runtime: node
 * Governing contract: ADR 0222 (decision 3); ADR 0294 (decision 16); STA-789; OS-142.
 */
import { Driver } from "@stackra/container";
import sharp from "sharp";

import { ImageTransformer } from "#contracts/ports/image-transformer.port";
import type { ImageTransform } from "#contracts/types/image-transform.type";

/**
 * Transforms images with sharp.
 *
 * @example
 * const card = await images.transform(bytes, {
 *   width: 600,
 *   format: "webp",
 *   quality: 80,
 *   layers: [{ bytes: watermark, gravity: "southeast" }],
 * });
 */
export class SharpImageTransformerDriver extends Driver(ImageTransformer) {
  /**
   * The image resized, composited and re-encoded, without metadata.
   *
   * @throws RangeError when sharp cannot read `bytes` or a layer, or cannot place a layer.
   */
  async transform(bytes: Uint8Array, transform: ImageTransform): Promise<Uint8Array> {
    const { width, height, layers = [], format, quality } = transform;
    try {
      let image = sharp(bytes).rotate();
      if (width !== undefined || height !== undefined)
        image = image.resize(width ?? null, height ?? null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      // sharp's overlay `input` takes a Buffer, not a Uint8Array: wrap each layer's bytes without copying them.
      if (layers.length > 0)
        image = image.composite(
          layers.map(({ bytes: layer, ...place }) => ({
            input: Buffer.from(layer.buffer, layer.byteOffset, layer.byteLength),
            ...place,
          })),
        );
      return await image.toFormat(format, quality === undefined ? {} : { quality }).toBuffer();
    } catch (error) {
      throw new RangeError(
        `The image could not be transformed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}
