/**
 * Stackra file contract:
 * Purpose: `ResolvedPageRecord`, one record of a resolved page context: its public id, one sentence from its `Facts`
 *          class and the allow-listed facts.
 * Boundary: a type only; model input, so it holds only what the caller may read and the data class's allow-list names
 *           (ADR 0490 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 6); STA-1631.
 */

/** One resolved record. */
export interface ResolvedPageRecord {
  /** The record's public id. */
  readonly id: string;

  /** One sentence about it, from its `Facts` class. */
  readonly summary: string;

  /** The allow-listed facts. */
  readonly facts: Readonly<Record<string, unknown>>;
}
