/**
 * Stackra file contract:
 * Purpose: `RootBlockLockedError`, the refusal to move or remove a document's root block (`root_block_locked`): a
 *          document always has exactly one root.
 * Boundary: raised by `Editor.move` and `Editor.remove`; kind `FailedPrecondition` (HTTP 412), not retryable. No
 *           details: the root is the document.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1 and 4); ADR 0140 (error envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the root stays where it is.
 *
 * @example
 * throw RootBlockLockedError.create();
 */
export class RootBlockLockedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
