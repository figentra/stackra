/**
 * Stackra file contract:
 * Purpose: `registerBuckets`, how gen's generated entry tells `MediaLibrary` the bucket keys it derived and locked:
 *          each bucket class with its `<module>.<name>` key.
 * Boundary: writes the process-wide registry; a later row for a class replaces the earlier one. Checks each row, so a
 *           wrong row fails at boot rather than on the first upload. Two classes under one key are refused: the key is
 *           what a signed upload is bound to.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22); the actions precedent (`registerActions`).
 */
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { bucketOptionsOf } from "#core/functions/bucket-options-of.function";
import type { BucketRegistration } from "#core/types/bucket-registration.type";

/** A bucket key: snake_case segments joined by dots (`catalogue.product_images`). */
const BUCKET_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

/**
 * Registers the derived keys of buckets.
 *
 * @throws TypeError when a row's class is not a bucket, its key is malformed, or another class holds the key.
 * @example
 * registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
 */
export function registerBuckets(rows: readonly BucketRegistration[]): void {
  for (const { type, key } of rows) {
    bucketOptionsOf(type);
    if (typeof key !== "string" || !BUCKET_KEY.test(key))
      throw new TypeError(
        `registerBuckets: ${type.name} needs a key such as catalogue.product_images, got ${JSON.stringify(key)}`,
      );
    for (const [other, taken] of BUCKET_REGISTRY)
      if (taken === key && other !== type)
        throw new TypeError(`registerBuckets: ${other.name} and ${type.name} both claim "${key}"`);
    BUCKET_REGISTRY.set(type, key);
  }
}
