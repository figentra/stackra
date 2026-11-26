/**
 * Stackra file contract:
 * Purpose: `FileRetainedError`, the refusal of a write, move or delete of a file kept unchangeable until a time
 *          (`WriteOptions.retainUntil`, WORM): a legal archive copy, such as a tax document, may not change before it.
 * Boundary: a `Refusal` of kind `FailedPrecondition`; it names the key and the time it is retained until, nothing of
 *           the file's contents. The memory and local disks raise it; a bucket with Object Lock refuses on its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0140 (the error envelope, as amended: errors are classes extending
 *                     `Refusal`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A retained file cannot change yet.
 *
 * @example
 * if (retained) throw FileRetainedError.create({ path: key, retainUntil });
 */
export class FileRetainedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {
  /** The normalised key of the retained file. */
  path!: string;

  /** When it may change again. */
  retainUntil!: Date;
}
