/**
 * Stackra file contract:
 * Purpose: `RetentionUnsupportedError`, the refusal of a write that asks for retention (`WriteOptions.retainUntil`) on
 *          a disk that cannot keep a file unchangeable (the Encore bucket, GCS, Expo): the file is not stored at all,
 *          rather than stored without the protection the caller asked for.
 * Boundary: a `Refusal` of kind `FailedPrecondition`; it names the disk. The fix is configuration: a retained archive
 *           belongs on the `s3` disk over a bucket with Object Lock.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0140 (the error envelope, as amended).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * This disk cannot retain a file.
 *
 * @example
 * if (options?.retainUntil !== undefined) throw RetentionUnsupportedError.create({ disk: "gcs" });
 */
export class RetentionUnsupportedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {
  /** The disk that was asked to retain a file. */
  disk!: string;
}
