/**
 * Stackra file contract:
 * Purpose: `BucketClass`, the class side of a bucket: what `Bucket({...})` returns and what `MediaLibrary` and
 *          `registerBuckets` take.
 * Boundary: a type only. Abstract, so a bucket class with a constructor of its own still fits.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rule 2: called-only kinds).
 */
import type { BucketBase } from "#core/bases/bucket.base";

/** A bucket class; `B` is its instance type, so `Upload<B>` names the same bucket. */
export type BucketClass<B extends BucketBase = BucketBase> = abstract new () => B;
