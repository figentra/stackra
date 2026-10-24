/**
 * Stackra file contract:
 * Purpose: `UploadBucketMismatchError`, what `MediaLibrary.claim` raises for a token signed for another bucket: a file
 *          meant for one place must not be claimable in another.
 * Boundary: kind `Validation` (the input's upload field is wrong), code `upload_bucket_mismatch`. The detail names the
 *           bucket the caller claimed for, never the one the token was signed for.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: the same token never fits this bucket. */
export class UploadBucketMismatchError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The bucket key the caller claimed the upload for. */
  bucket!: string;
}
