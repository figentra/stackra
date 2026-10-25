/**
 * Stackra file contract:
 * Purpose: `SequenceClass`, the class `Sequence({...})` returns and an author extends (`class InvoiceSequence extends
 *          Sequence({ key: "invoice" }) {}`).
 * Boundary: a type only, one construct signature, so the declaration emit of an author's sequence names an exported
 *           type (ADR 0305 rule 43). Nobody constructs a sequence: the class is the reference `SequenceService` takes.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 1); ADR 0294 (decision 25); ADR 0305 (rule 43).
 */
import type { Sequence } from "#core/bases/sequence.base";

/** A sequence class. */
export type SequenceClass = new () => Sequence;
