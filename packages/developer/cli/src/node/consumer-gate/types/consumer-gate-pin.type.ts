/**
 * Stackra file contract:
 * Purpose: `ConsumerGatePin`, the age of a run's pin: the matrix `pinned` date, the days since it on the run date,
 *          and whether it is stale.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813; STA-2705.
 */

/** How old the pin is. */
export type ConsumerGatePin = {
  /** The matrix `pinned` date, `YYYY-MM-DD`, when it has one. */
  readonly pinned?: string;

  /** Days from `pinned` to the run date, when `pinned` is set. */
  readonly ageDays?: number;

  /** Older than `CONSUMER_GATE_STALE_PIN_DAYS`, or undated. */
  readonly stale: boolean;
};
