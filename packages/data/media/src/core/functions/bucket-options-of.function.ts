/**
 * Stackra file contract:
 * Purpose: `bucketOptionsOf`, which reads the checked options a bucket class declared with `Bucket({...})` from the kind
 *          registry.
 * Boundary: reads the registry only; internal to this package. Refuses the bare kind base and any class of another
 *           kind, so a wrong argument fails before a path or a signed URL is made from it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: kinds and options from the registry, no reflect-metadata).
 */
import { kindOf } from "@stackra/container";

import type { BucketClass } from "#core/types/bucket-class.type";
import type { BucketOptions } from "#core/types/bucket-options.type";

/**
 * The declared options of `type`.
 *
 * @throws TypeError when `type` does not extend `Bucket({...})`.
 * @example
 * bucketOptionsOf(ProductImagesBucket).maxBytes; // 5_000_000
 */
export function bucketOptionsOf(type: BucketClass): BucketOptions {
  const record = kindOf(type);
  if (record?.kind !== "bucket" || record.options["visibility"] === undefined)
    throw new TypeError(`${type.name || "This class"} does not extend Bucket({ ... })`);
  return record.options as unknown as BucketOptions;
}
