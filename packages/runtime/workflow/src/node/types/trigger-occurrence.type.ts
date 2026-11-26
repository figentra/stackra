/**
 * Stackra file contract:
 * Purpose: `TriggerOccurrence`, one trigger occurrence as its delivery saw it: the block, the event id and
 *          correlation, and the occurrence itself, which `startTriggered` starts each automation with.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 1).
 */

/** One trigger occurrence, as its delivery saw it. */
export interface TriggerOccurrence {
  /** The trigger building block's key. */
  readonly block: string;
  /** The occurrence's event id, half of each start's key. */
  readonly eventId: string;
  /** The delivery's correlation (a run's step call id when a run caused it), which places the start in a chain. */
  readonly correlationId?: string;
  /** The occurrence itself, each run's input. */
  readonly input: unknown;
}
