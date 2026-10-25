/**
 * Stackra file contract:
 * Purpose: `DocumentView`, a document run as its steps see it: the run's id, its `DocumentInput`, the results so far
 *          and when it started (the time a step's condition is evaluated at).
 * Boundary: a type only, internal: the engine's view of a run, typed for document runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 6: the time is the caller's); ADR 0152 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";

import type { DocumentInput } from "#core/types/document-input.type";

/** A document run as a step sees it. */
export interface DocumentView {
  /** The run's id. */
  readonly id: PublicId<"wfr">;

  /** The document and the run's input. */
  readonly input: DocumentInput;

  /** Each done step's result, by name. */
  readonly results: Readonly<Record<string, unknown>>;

  /** When the run started. */
  readonly startedAt: Date;
}
