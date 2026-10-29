/**
 * Stackra file contract:
 * Purpose: `ScopeMoveInvalidError`, the refusal of a subtree move whose new parent is the node itself or one of its
 *          descendants (`scope_move_invalid`): the tree would loop.
 * Boundary: raised by `ScopeNodeService.moveSubtree`; kind `Validation` (HTTP 400), not retryable. Its details are the moved
 *           node's path and the parent's path, both visible to the caller's session.
 * Runtime: isomorphic
 * Governing contract: ADR 0411 (subtree move); ADR 0327 (decision 3); ADR 0140 (envelope and kinds); final review R-02
 *                     (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: a node never moves under itself.
 *
 * @example
 * throw ScopeMoveInvalidError.create({ path: "platform.acme", parent: "platform.acme.eu" });
 */
export class ScopeMoveInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The path of the node asked to move. */
  path!: string;

  /** The path of the parent asked for. */
  parent!: string;
}
