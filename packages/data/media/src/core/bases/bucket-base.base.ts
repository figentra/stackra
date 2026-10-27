/**
 * Stackra file contract:
 * Purpose: `BucketBase`, the instance side every `Bucket({ ... })` class shares: the kind brand, so a class of another
 *          kind cannot stand in for a bucket where `BucketClass`, `Upload<B>` or `MediaLibrary` asks for one.
 * Boundary: never extended directly: a bucket extends `Bucket({ ... })` (bucket.base.ts), whose prototype is this one.
 *           No instance behaviour.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rules 2, 3 and 10 to 13); ADR 0222 (decisions 2 to 4).
 */
/** The instance side every bucket shares. */
export abstract class BucketBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a bucket. */
  declare readonly "~kind": "bucket";
}
