/**
 * Stackra file contract:
 * Purpose: `InvalidDocumentError`, the refusal of a document that is not a tree of nodes, or of a node whose props its
 *          block's schema refuses (`invalid_document`).
 * Boundary: raised by `resolveDocument` before anything is drawn; kind `Validation` (HTTP 400), not retryable. It names
 *           where the node sits and, once known, its block; the schema's issues travel as the `cause`, never in the
 *           envelope, so text a scope's editor wrote is not echoed back.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 6: bad props are refused); ADR 0140 (envelope and kinds); final review R-02
 *                     (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the stored document must change.
 *
 * @example
 * throw InvalidDocumentError.create({ path: "0.children.1", block: "web.cta_banner" }, { cause: parsed.error });
 */
export class InvalidDocumentError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** Where the refused node sits (`0.children.1`). */
  path!: string;

  /** The node's block key, when the node named one. */
  block?: string;
}
