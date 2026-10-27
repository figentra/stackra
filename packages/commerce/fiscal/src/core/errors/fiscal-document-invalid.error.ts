/**
 * Stackra file contract:
 * Purpose: `FiscalDocumentInvalidError`, the refusal when a document lacks a field the chosen mandate requires (an item
 *          code, a buyer endpoint, a seller tax number).
 * Boundary: a refusal (`Validation`); code derived from the class name; the fields carry keys and numbers only, never a
 *           document's content or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0364; ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the host completes the document and seals again.
 *
 * @example
 * throw FiscalDocumentInvalidError.create({ driver: "eta", field: "lines.0.itemCode" });
 */
export class FiscalDocumentInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The driver that needs the field. */
  driver!: string;

  /** The missing field as a dotted path into the document. */
  field!: string;
}
