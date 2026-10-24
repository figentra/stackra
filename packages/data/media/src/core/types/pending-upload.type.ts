/**
 * Stackra file contract:
 * Purpose: `PendingUpload<B>`, what `MediaLibrary.createUpload` returns: the token the client later sends to an
 *          action, the signed URL and headers it puts the bytes with, and when both stop working.
 * Boundary: a type only; the wire form is `CreateUploadOutput` in `./node`.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: presigned uploads).
 */
import type { SignedUpload } from "#contracts/types/signed-upload.type";
import type { BucketBase } from "#core/bases/bucket.base";
import type { Upload } from "#core/values/upload.value";

/** An upload that waits for the client's bytes. */
export interface PendingUpload<B extends BucketBase = BucketBase> extends SignedUpload {
  /** The token to send to the claiming action. */
  readonly upload: Upload<B>;

  /** When the signed URL and the token expire. */
  readonly expiresAt: Date;
}
