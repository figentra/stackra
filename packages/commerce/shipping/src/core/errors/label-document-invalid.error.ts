/**
 * Stackra file contract:
 * Purpose: `LabelDocumentInvalidError`, the refusal when a carrier's label is not the document it claims to be: not
 *          base64, not a PDF, or not a complete ZPL format.
 * Boundary: a refusal (`internal`, category `internal`); code `label_document_invalid`, derived from the class name.
 *           Raised by `labelDocument` inside a connector, so a broken label never reaches a printer. `reason` is a
 *           code; the bytes are never copied into the error.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 5); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the same carrier answer fails the same way.
 *
 * @example
 * throw LabelDocumentInvalidError.create({ format: "pdf", reason: "signature" });
 */
export class LabelDocumentInvalidError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: false,
}) {
  /** The format the carrier claimed. */
  format!: string;

  /** Why: `not_base64`, `empty` or `signature`. */
  reason!: string;
}
