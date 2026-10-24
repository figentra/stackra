/**
 * Stackra file contract:
 * Purpose: `BucketRegistration`, one row gen hands `registerBuckets`: a bucket class with the key gen derived from its
 *          file and locked in the manifest.
 * Boundary: a type only. The module folder and the file name are gone at run time, so this row is how `MediaLibrary`
 *           knows `catalogue.product_images`; without one it derives the key from the class name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22: derived identities, the manifest lock).
 */
import type { BucketClass } from "#core/types/bucket-class.type";

/** The derived identity of one bucket. */
export interface BucketRegistration {
  /** The bucket class. */
  readonly type: BucketClass;

  /** The locked key, `<module>.<name>` (`catalogue.product_images`). */
  readonly key: string;
}
