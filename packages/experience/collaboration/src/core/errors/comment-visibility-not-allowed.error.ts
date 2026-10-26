/**
 * Stackra file contract:
 * Purpose: `CommentVisibilityNotAllowedError`, the refusal of a comment level the author may not use: an external
 *          author posting internal, or a shared comment while shared comments are off. A 412.
 * Boundary: a refusal; it names the level only.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 2); ADR 0140 (error envelope); OS-224.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { CommentVisibility } from "#contracts/enums/comment-visibility.enum";

/**
 * A level refused.
 *
 * @example
 * throw CommentVisibilityNotAllowedError.create({ visibility: CommentVisibility.Shared });
 */
export class CommentVisibilityNotAllowedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The refused level. */
  visibility!: CommentVisibility;
}
