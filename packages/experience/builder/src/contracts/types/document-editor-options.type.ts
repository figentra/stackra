/**
 * Stackra file contract:
 * Purpose: `DocumentEditorOptions`, what `DocumentEditor.create` takes: the document to open and the check that finds
 *          its problems (an automation's `automationProblems`, a form's `formProblems`).
 * Boundary: a type only. The check is pure and never throws; a document may stay incomplete while it is edited, and
 *           the host's save refuses what the check reports.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 3).
 */
import type { FieldErrors } from "@stackra/errors";

/** The options of a structured editor. */
export interface DocumentEditorOptions<T> {
  /** The document to open. */
  readonly document: T;

  /** The problems of a document, by path; `{}` when there are none. */
  readonly check: (document: T) => FieldErrors;
}
