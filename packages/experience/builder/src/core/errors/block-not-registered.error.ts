/**
 * Stackra file contract:
 * Purpose: `BlockNotRegisteredError`, the refusal to insert a block whose key no registered block has
 *          (`block_not_registered`).
 * Boundary: raised by `Editor.insert`; kind `Validation` (HTTP 400), not retryable. The palette is code (ADR 0270
 *           decision 3), so a document never gains a block the code does not register. Its one detail is the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1 and 3); ADR 0154 (documents reference registered code only); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the key names no registered block.
 *
 * @example
 * throw BlockNotRegisteredError.create({ block: "web.hero_section" });
 */
export class BlockNotRegisteredError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The block key the caller sent. */
  block!: string;
}
