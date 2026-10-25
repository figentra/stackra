/**
 * Stackra file contract:
 * Purpose: `BlockNotAllowedError`, the refusal to insert a registered block that the document's kind or the editor's
 *          reviewed block kit does not allow (`block_not_allowed`).
 * Boundary: raised by `Editor.insert`; kind `Validation` (HTTP 400), not retryable. Its one detail is the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 3 and 6); ADR 0140; COM-358.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the block does not fit this document's kind or kit.
 *
 * @example
 * throw BlockNotAllowedError.create({ block: "web.hero_section" });
 */
export class BlockNotAllowedError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The block key the caller sent. */
  block!: string;
}
