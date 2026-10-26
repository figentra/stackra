/**
 * Stackra file contract:
 * Purpose: `CommentTombstonedError`, the refusal of an edit of a deleted comment. A 412.
 * Boundary: a refusal; it names the comment, never its text.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 1); ADR 0140 (error envelope); OS-225.
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A comment that is a tombstone.
 *
 * @example
 * throw CommentTombstonedError.create({ commentId });
 */
export class CommentTombstonedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The deleted comment. */
  commentId!: PublicId<"cmt">;
}
