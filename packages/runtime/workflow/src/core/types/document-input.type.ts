/**
 * Stackra file contract:
 * Purpose: `DocumentInput`, the input a document run keeps in the journal: the checked document itself (its version is
 *          the run's pin), the run's own input (the trigger occurrence, or the plan's input) and, for a run a trigger
 *          started, its place in the event chain.
 * Boundary: a type only, internal. Keeping the document in the run means a run resumes on the version it started on,
 *           whatever was published since, and a plan needs no stored record.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (decision 2: the version pin); ADR 0245 (decision 8); OS-232 (chain depth).
 */
import type { AutomationDocument } from "#core/types/automation-document.type";
import type { RunChain } from "#core/types/run-chain.type";

/** A document run's input. */
export interface DocumentInput {
  /** The document the run follows. */
  readonly document: AutomationDocument;

  /** The run's input, as JSON. */
  readonly input: unknown;

  /** Its place in the event chain; absent for a run no trigger started (a plan, a manual run). */
  readonly chain?: RunChain;
}
