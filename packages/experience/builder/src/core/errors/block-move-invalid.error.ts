/**
 * Stackra file contract:
 * Purpose: `BlockMoveInvalidError`, the refusal to move a block into itself or into a block nested in it
 *          (`block_move_invalid`), which would cut it out of the tree.
 * Boundary: raised by `Editor.move`; kind `Validation` (HTTP 400), not retryable. Its details are the moved block and
 *           the parent asked for.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: drag and drop); ADR 0140 (error envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the new parent is the block or one of its descendants.
 *
 * @example
 * throw BlockMoveInvalidError.create({ id: section.id, parentId: column.id });
 */
export class BlockMoveInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The block the caller moved. */
  id!: string;

  /** The parent the caller asked for. */
  parentId!: string;
}
