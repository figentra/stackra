/**
 * Stackra file contract:
 * Purpose: `SequenceSeries`, the values of a sequence's declared dimensions for one call
 *          (`{ legalEntityId: "le_…", locationId: "loc_…" }`).
 * Boundary: a type only; `SequenceService` refuses a missing, extra or empty dimension, since each distinct value set
 *           is its own counter.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 1).
 */

/** Dimension name to value. */
export type SequenceSeries = Readonly<Record<string, string>>;
