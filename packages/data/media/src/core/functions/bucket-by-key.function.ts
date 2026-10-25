/**
 * Stackra file contract:
 * Purpose: `bucketByKey`, the registered bucket class of a key a client names, or the member's only registered bucket
 *          when it names none.
 * Boundary: reads the registry only; internal to this package (the `upload.create` action uses it). Only registered
 *           buckets are found, so a client can never reach a class gen did not list.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0222 (decision 2).
 */
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import type { BucketClass } from "#core/types/bucket-class.type";

/**
 * The bucket registered under `key`; for `null`, the only registered bucket.
 *
 * @returns undefined when no bucket has the key, or `key` is `null` and the member has none or several.
 * @example
 * bucketByKey("catalogue.product_images"); // ProductImagesBucket
 */
export function bucketByKey(key: string | null): BucketClass | undefined {
  if (key === null) {
    const [only, ...others] = BUCKET_REGISTRY.keys();
    return others.length === 0 ? only : undefined;
  }
  for (const [type, taken] of BUCKET_REGISTRY) if (taken === key) return type;
  return undefined;
}
