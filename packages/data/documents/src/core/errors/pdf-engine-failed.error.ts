/**
 * Stackra file contract:
 * Purpose: `PdfEngineFailedError` (`pdf_engine_failed`), the PDF engine could not be reached or answered an error
 *          while printing, merging or making a hybrid PDF.
 * Boundary: an unavailable refusal (503), retryable: the engine is a separate process. It names the route and the HTTP
 *           status only (`null` when nothing answered); the document's content is never put in it.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The PDF engine failed. */
export class PdfEngineFailedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The engine route that was called (`/forms/pdfengines/merge`). */
  route!: string;

  /** The HTTP status it answered, or `null` when it could not be reached. */
  status!: number | null;
}
