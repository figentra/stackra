/**
 * Stackra file contract:
 * Purpose: `checkImageVariant`, the one check of a variant's box and format, shared by `Bucket({ variants })` and
 *          `imageVariantUrl`.
 * Boundary: pure; internal to this package. Throws on the first broken rule and names where the variant came from.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants).
 */
import { Enum } from "@stackra/contracts";

import { ImageFormat } from "#core/enums/image-format.enum";
import type { ImageVariantOptions } from "#core/types/image-variant-options.type";

/** Whether `value` is a whole number of pixels from 1. */
const isPixels = (value: unknown): boolean => Number.isInteger(value) && (value as number) >= 1;

/**
 * Checks one variant.
 *
 * @param where - how the error names the variant (`Bucket({ variants: { card } })`).
 * @throws RangeError when the width or height is not a whole number from 1, or the format is not an `ImageFormat`.
 * @example
 * checkImageVariant("useImageVariant", { width: 480, format: ImageFormat.Webp });
 */
export function checkImageVariant(where: string, variant: ImageVariantOptions): void {
  if (!isPixels(variant.width))
    throw new RangeError(`${where}: width must be a whole number from 1, got ${variant.width}`);
  if (variant.height !== undefined && !isPixels(variant.height))
    throw new RangeError(`${where}: height must be a whole number from 1, got ${variant.height}`);
  if (variant.format !== undefined && !Enum.values(ImageFormat).includes(variant.format))
    throw new RangeError(
      `${where}: format takes an ImageFormat, got ${JSON.stringify(variant.format)}`,
    );
}
