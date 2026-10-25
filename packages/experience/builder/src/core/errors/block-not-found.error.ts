/**
 * Stackra file contract:
 * Purpose: `BlockNotFoundError`, the refusal of a change that names a block instance the document does not hold
 *          (`block_not_found`).
 * Boundary: raised when a change is applied; kind `NotFound` (HTTP 404), not retryable. A co-editor may have removed
 *           the block meanwhile: undo and redo skip such a change instead of raising this. Its one detail is the id.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4); ADR 0140 (error envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: no block in the document has this id.
 *
 * @example
 * throw BlockNotFoundError.create({ id: "0b6f0c52-6d0f-4f8e-9a51-3f4f1f0e2c11" });
 */
export class BlockNotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {
  /** The block id the change named. */
  id!: string;
}
