/**
 * Stackra file contract:
 * Purpose: `BucketOptions`, what a bucket declares: who reads its files, the largest file it takes, the media types it
 *          accepts and the image variants made of its files.
 * Boundary: a type only; `Bucket({...})` checks the values and records them in the kind registry. Gen lists them in
 *           the manifest `infra.buckets`, where runway sizes the store.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 2 to 4); ADR 0294 (decisions 13 and 16: `.bucket.ts` in `models/`).
 */
import type { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import type { MediaType } from "#core/enums/media-type.enum";
import type { ImageVariantOptions } from "#core/types/image-variant-options.type";

/** A bucket's declaration. */
export interface BucketOptions {
  /** Public files are served by the CDN; private ones only through temporary URLs. */
  readonly visibility: BucketVisibility;

  /** The largest file in bytes, a whole number from 1. */
  readonly maxBytes: number;

  /** The media types an upload may have; at least one. */
  readonly accept: readonly MediaType[];

  /** Named image variants (`card: { width: 600 }`); snake_case names. */
  readonly variants?: Readonly<Record<string, ImageVariantOptions>>;
}
