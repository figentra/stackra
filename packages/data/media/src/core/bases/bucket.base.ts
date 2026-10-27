/**
 * Stackra file contract:
 * Purpose: `Bucket({ visibility, maxBytes, accept, variants })`, the kind base of a server file-storage declaration:
 *          where a module's uploads land, who reads them, which types and sizes it takes and which image variants are
 *          made of them.
 * Boundary: called only (the options are required, so a bare `extends Bucket` fails to compile). The options are
 *           checked and recorded in the kind registry, frozen. A declaration with no instance behaviour: the key is
 *           derived by gen from the file (`catalogue/models/product-images.bucket.ts` is `catalogue.product_images`)
 *           and reaches the runtime through `registerBuckets`. Uploads into it are made and claimed by `MediaLibrary`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 13, 16, 20 and 25); ADR 0305 (rules 2 and 3); ADR 0222 (decisions 2 to 4).
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { BucketBase } from "#core/bases/bucket-base.base";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { checkImageVariant } from "#core/functions/check-image-variant.function";
import type { BucketClass } from "#core/types/bucket-class.type";
import type { BucketOptions } from "#core/types/bucket-options.type";

/** A variant name: snake_case words (`card`, `zoom_2x`). */
const VARIANT_NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** A bucket instance. */
export type Bucket = BucketBase;

/** Checks the options of a bucket and freezes them; the return type is inferred, so it fits the kind registry. */
function read(options: BucketOptions) {
  if (!Enum.values(BucketVisibility).includes(options.visibility))
    throw new RangeError(
      `Bucket({ visibility }) takes a BucketVisibility, got ${JSON.stringify(options.visibility)}`,
    );
  if (!Number.isInteger(options.maxBytes) || options.maxBytes < 1)
    throw new RangeError(
      `Bucket({ maxBytes }) must be a whole number of bytes from 1, got ${options.maxBytes}`,
    );
  if (
    !Array.isArray(options.accept) ||
    options.accept.length === 0 ||
    !options.accept.every((type) => Enum.values(MediaType).includes(type))
  )
    throw new RangeError("Bucket({ accept }) lists at least one MediaType and nothing else");
  const variants = options.variants ?? {};
  for (const [name, variant] of Object.entries(variants)) {
    if (!VARIANT_NAME.test(name))
      throw new TypeError(`Bucket({ variants }): "${name}" is not a snake_case variant name`);
    checkImageVariant(`Bucket({ variants: { ${name} } })`, variant);
  }
  return {
    visibility: options.visibility,
    maxBytes: options.maxBytes,
    accept: Object.freeze([...options.accept]),
    variants: Object.freeze(
      Object.fromEntries(
        Object.entries(variants).map(([name, variant]) => [name, Object.freeze({ ...variant })]),
      ),
    ),
  };
}

/**
 * The bucket kind base.
 *
 * @throws RangeError when `visibility`, `maxBytes`, `accept` or a variant's box breaks its rule.
 * @throws TypeError when a variant name is not snake_case.
 * @example
 * // src/modules/catalogue/models/product-images.bucket.ts — catalogue.product_images
 * export class ProductImagesBucket extends Bucket({
 *   visibility: BucketVisibility.Public,
 *   maxBytes: 5_000_000,
 *   accept: [MediaType.Jpeg, MediaType.Png, MediaType.Webp],
 *   variants: { card: { width: 600 }, zoom: { width: 1_600 } },
 * }) {}
 */
export const Bucket = createKind("bucket", BucketBase, read) as (
  options: BucketOptions,
) => BucketClass;
