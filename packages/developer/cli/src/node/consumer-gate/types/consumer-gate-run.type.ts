/**
 * Stackra file contract:
 * Purpose: `ConsumerGateRun`, what `runConsumerGate` resolves with: an exit code (0 green, 1 red, 2 setup error), the
 *          setup error text and the summary of a run that got as far as writing one.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateSummary } from "#node/consumer-gate/types/consumer-gate-summary.type";

/** The outcome of one gate run. */
export type ConsumerGateRun = {
  /** The exit code: 0 green, 1 red, 2 setup error. */
  readonly code: number;

  /** The setup error text, on code 2. */
  readonly error?: string;

  /** The summary, when the run got as far as writing one. */
  readonly summary?: ConsumerGateSummary;
};
