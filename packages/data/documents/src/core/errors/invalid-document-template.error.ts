/**
 * Stackra file contract:
 * Purpose: `InvalidDocumentTemplateError` (`invalid_document_template`), the refusal of a template that breaks its
 *          schema or that a format or a signed form cannot use.
 * Boundary: a validation refusal (400), never retryable: the template must change. Its details are the first broken
 *           path and the problem, never the template's text.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The template cannot be rendered as asked. */
export class InvalidDocumentTemplateError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The broken path in the template (`locales`, `blocks.3.value`). */
  path!: string;

  /** What is wrong with it. */
  problem!: string;
}
