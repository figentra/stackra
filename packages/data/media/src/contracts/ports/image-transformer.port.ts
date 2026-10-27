/**
 * Stackra file contract:
 * Purpose: the `ImageTransformer` port: resizes, composites and re-encodes an uploaded image on the server (thumbnails,
 *          the variants a CDN cannot make, watermarks and personalisation layers, stripping metadata before a public
 *          image is served).
 * Boundary: an abstract class that is its own token, keyed `media.ImageTransformer`. Every output drops the source's
 *           EXIF and location metadata; content credentials, when the image carries them, are attached again by
 *           `ContentCredentials` after the transform. The engine is a driver choice in config (`sharp` in `./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 3); ADR 0294 (decisions 4 and 16); OS-142.
 */
import { Port } from "@stackra/contracts";

import type { ImageTransform } from "#contracts/types/image-transform.type";

/**
 * Transforms one image.
 *
 * @example
 * const thumbnail = await images.transform(bytes, { width: 320, format: "webp", quality: 80 });
 */
export abstract class ImageTransformer extends Port {
  /** Type-only port key, so `DriverName<ImageTransformer>` narrows to this port's drivers. */
  declare readonly "~key": "media.ImageTransformer";

  /**
   * The image `bytes` transformed by `transform`, without its metadata.
   *
   * @throws RangeError when `bytes` or a layer is not an image the driver reads, or a layer does not fit.
   */
  abstract transform(bytes: Uint8Array, transform: ImageTransform): Promise<Uint8Array>;
}
