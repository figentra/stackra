/**
 * Stackra file contract:
 * Purpose: `useImageVariant(image, options)`, the hook a component sizes an image with: the URL of the resized variant
 *          and the box it asked for, so a list never downloads a full-size image (`<img src={variant?.url} />`).
 * Boundary: pure string work memoised per URL and box; no container, no I/O, so it renders the same on the server and
 *           in the browser. An absent image (`null`, `undefined`, a product without photos) gives `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants); ADR 0183 (LCP and transfer budget); ADR 0294
 *                     (decision 17).
 */
import { useMemo } from "react";

import { imageVariantUrl } from "#core/functions/image-variant-url.function";
import type { ImageVariant, ImageVariantOptions } from "#core/index";

/**
 * The variant of `image` at `options`' box and format.
 *
 * @throws RangeError when the width or height is not a whole number from 1, or the format is not an `ImageFormat`.
 * @example
 * image = useImageVariant(this.props.product.image, { width: 480, format: ImageFormat.Webp });
 * <img src={this.image?.url} width={480} height={480} alt="" />
 */
export function useImageVariant(
  image: { readonly url: string } | string | null | undefined,
  options: ImageVariantOptions,
): ImageVariant | undefined {
  const url = typeof image === "string" ? image : image?.url;
  const { width, height, format } = options;
  return useMemo(() => {
    if (url === undefined) return undefined;
    const box = {
      width,
      ...(height === undefined ? {} : { height }),
      ...(format === undefined ? {} : { format }),
    };
    return {
      url: imageVariantUrl(url, box),
      width,
      ...(height === undefined ? {} : { height }),
    };
  }, [url, width, height, format]);
}
