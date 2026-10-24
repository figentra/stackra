/**
 * Stackra file contract:
 * Purpose: `BUCKET_REGISTRY`, the derived keys `registerBuckets` stored, by bucket class.
 * Boundary: process-wide and internal: written by `registerBuckets`, read by `bucketKeyOf` and `bucketByKey`. A later
 *           row for the same class replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import type { BucketClass } from "#core/types/bucket-class.type";

/** Bucket class to its locked key. */
export const BUCKET_REGISTRY = new Map<BucketClass, string>();
