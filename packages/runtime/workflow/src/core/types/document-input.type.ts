/**
 * Stackra file contract:
 * Purpose: `DocumentInput`, the input a document run keeps in the journal: the checked document itself (its version is
 *          the run's pin) and the run's own input (the trigger occurrence, or the plan's input).
 * Boundary: a type only, internal. Keeping the document in the run means a run resumes on the version it started on,
 *           whatever was published since, and a plan needs no stored record.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (decision 2: the version pin); ADR 0245 (decision 8).
 */
import type { AutomationDocument } from "#core/types/automation-document.type";

/** A document run's input. */
export interface DocumentInput {
  /** The document the run follows. */
  readonly document: AutomationDocument;

  /** The run's input, as JSON. */
  readonly input: unknown;
}
