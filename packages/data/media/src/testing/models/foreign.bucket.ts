/**
 * Stackra file contract:
 * Purpose: `ForeignBucket`, the bucket `fakeUpload(app, null, ...)` signs for: one no member declares, so a claim into
 *          any real bucket refuses the token with `UploadBucketMismatchError`.
 * Boundary: test code only; internal to `./testing`. Accepts every media type up to 1 GB so the fake never refuses the
 *           upload itself. Its key is derived (`foreign`), which never equals a gen-registered key (those carry a dot).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's `fakeUpload(app, null, ...)`.
 */
import { Enum } from "@stackra/contracts";

import { Bucket, BucketVisibility, MediaType } from "#core/index";

/** A bucket of no member. */
export class ForeignBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 1_000_000_000,
  accept: Enum.values(MediaType),
}) {}
